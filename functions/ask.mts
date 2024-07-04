import type { Context } from '@netlify/functions'
import { getCache, saveToCache } from '../server/cache'
import { askQuestion } from '../server/ask'

export default async (req: Request, context: Context) => {
  const body = await req.json()
  const qs = new URL(req.url).searchParams
  const nocache = body?.nocache ?? qs.get('nocache') === 'true' ?? false
  const model = body?.model ?? qs.get('model') ?? 'openai'
  const user = body?.user ?? qs.get('user') ?? 'anonymous'
  const input = body?.question?.trim() ?? null
  const conversationId = body?.conversationId ?? qs.get('conversationId') ?? null

  const ctxt = 'kb'
  const fallbackAnswer = '42'

  if (!input) {
    return Response.json({ error: 'No question provided' }, { status: 400 })
  }

  const currentTime = Date.now()

  if (!nocache) {
    const cachedData = await getCache(ctxt, currentTime, model, conversationId, user, input)
    const latestCacheHit = cachedData?.[0]

    if (latestCacheHit && latestCacheHit.answer) {
      console.log(`[${context}] cache hit`)
      return Response.json({
        ...latestCacheHit,
        isCached: true,
      })
    }
  }

  try {
    const answer = await askQuestion(input, ctxt, user, conversationId, model)
    saveToCache(ctxt, currentTime, input, answer, model, user)

    return Response.json({
      answer: answer ?? fallbackAnswer,
    })
  } catch (e) {
    console.error(e)
    return Response.error()
  }

  return Response.json({ answer: '42', model, user, nocache })
}
