import { ZepClient } from '@getzep/zep-cloud'

export const zep = new ZepClient({
  apiKey: process.env.VITE_ZEP_KEY,
})

export const getZepResults = async (question: string, sessionId: string) => {
  try {
    const { results: zepResults } = await zep.memory.searchSessions({
      sessionIds: [sessionId],
      text: question,
      searchType: 'similarity',
      searchScope: 'facts',
    })

    console.log(`[zep] found ${zepResults.length} result${zepResults.length !== 1 ? 's' : ''}`)

    return zepResults
  } catch (e) {
    console.log(`[zep] error with zep search`)
    console.log(JSON.stringify(e))

    return []
  }
}

export const saveToZep = async (sessionId: string, newMessages: any[]) => {
  try {
    await zep.memory.add(sessionId, {
      messages: newMessages.map((m) => ({
        ...m,
        roleType: m.role === 'ai' ? 'assistant' : 'user',
      })),
    })

    console.log(`[zep] updated zep memory on ${sessionId}`)
  } catch {
    console.log('[zep] could not save to zep')
  }
}
