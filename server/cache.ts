import { supabase } from './supabase'

export const getCache = async (
  context: string,
  time: number,
  model: string,
  conversationId?: string,
  user?: string,
  question?: any,
) => {
  if (context === 'status') {
    const { data } = await supabase
      .from('caches')
      .select('*')
      .eq('context', context)
      .eq('model', model)
      // .gte('time', time - FIVE_MINUTES)
      .order('time', { ascending: false })
    return data
  } else {
    let query = supabase
      .from('caches')
      .select('*')
      .eq('context', context)
      .eq('question', question)
      .eq('model', model)
      .order('time', { ascending: false })

    if (conversationId) {
      query = query.eq('id', conversationId)
    }

    if (user) {
      query = query.eq('user', user)
    }

    const { data } = await query

    return data
  }
}

export const saveToCache = async (
  context: SourceType,
  time: number,
  question: string,
  answer: any,
  model: string,
  user: string,
) => {
  if (answer) {
    try {
      const { data, error } = await supabase.from('caches').upsert({
        context,
        time,
        question,
        answer,
        model,
        user,
      })

      if (error) {
        console.error(error.message)
      } else {
        console.log(`[${context}] Cached question/answer`)
      }
    } catch {}
  }
}

export const getConversation = async (conversationId: string, user: string) => {
  let query = supabase.from('conversations').select('*').eq('id', conversationId)
  if (user) {
    query = query.eq('user', user)
  }
  const { data } = await query
  console.log('data', data, conversationId, user)
  return data?.[0]
}
