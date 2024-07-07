import { supabase } from './supabase'

export const getCache = async (
  model: string,
  conversationId?: string,
  user?: string,
  question?: any,
) => {
  let query = supabase
    .from('caches')
    .select('*')
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

export const saveToCache = async (
  time: number,
  question: string,
  answer: any,
  model: string,
  user: string,
) => {
  if (answer) {
    try {
      const { data, error } = await supabase.from('caches').upsert({
        time,
        question,
        answer,
        model,
        user,
      })

      if (error) {
        console.error(error.message)
      } else {
        console.log(`[cache] Cached question/answer`)
      }
    } catch {}
  }
}

export const getConversation = async (conversationId: string, user: string) => {
  let query = supabase.from('conversations').select('*').eq('id', parseInt(conversationId))
  if (user) {
    query = query.eq('user', user)
  }
  const { data } = await query
  return data?.[0]
}
