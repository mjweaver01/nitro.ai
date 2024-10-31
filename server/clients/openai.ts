import OpenAI from 'openai'
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions'
import { tools } from '../tools'

export const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
})

export const createChatCompletion = async (
  messages: ChatCompletionMessageParam[],
  model: string,
  stream: boolean = true,
) => {
  const formattedTools: ChatCompletionTool[] = tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0,
    stream,
    tools: formattedTools,
    tool_choice: 'auto',
  })

  return completion
}

export const embeddings = async (input: string) => {
  const response = await openai.embeddings.create({
    input,
    model: 'text-embedding-3-large',
  })
  return response.data[0].embedding
}
