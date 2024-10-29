import OpenAI from 'openai'
import { fourOModel } from '../constants'
import { tools } from '../tools'

export const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
})

export const createChatCompletion = async (
  messages: any[],
  model: string = fourOModel,
  stream: boolean = true,
) => {
  return await openai.chat.completions.create({
    model,
    messages,
    temperature: 0,
    stream,
    function_call: 'auto',
    functions: tools,
  })
}

export const embeddings = async (input: string) => {
  const response = await openai.embeddings.create({
    input,
    model: 'text-embedding-3-large',
  })
  return response.data[0].embedding
}
