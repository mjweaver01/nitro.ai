import OpenAI from 'openai'
import { fourOModel } from '../constants'

export const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
})

export const createChatCompletion = async (
  messages: any[],
  functions?: any[],
  model: string = fourOModel,
  stream: boolean = true,
) => {
  return await openai.chat.completions.create({
    model,
    messages,
    temperature: 0,
    stream,
    tools: functions?.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    })),
  })
}

export const embeddings = async (input: string) => {
  const response = await openai.embeddings.create({
    input,
    model: 'text-embedding-3-large',
  })
  return response.data[0].embedding
}
