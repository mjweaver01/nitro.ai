import OpenAI from 'openai'
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions'
import { tools } from '../tools'
import { models } from '../constants'

export const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
})

const gemini = new OpenAI({
  apiKey: process.env.VITE_GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

export const createChatCompletion = async (
  messages: ChatCompletionMessageParam[],
  model: string,
  stream: boolean = true,
) => {
  try {
    const formattedTools: ChatCompletionTool[] = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }))

    const isGemini = model.includes('gemini')
    const activeClient = isGemini ? gemini : openai
    
    // Create different payload based on the client
    const payload = isGemini ? {
      model,
      messages,
      stream,
      tools: formattedTools,
      tool_choice: 'auto' as const,
    } : {
      model,
      messages,
      temperature: 0,
      stream,
      store: true,
      tools: formattedTools,
      tool_choice: 'auto' as const,
    }

    const completion = await activeClient.chat.completions.create(payload)

    return completion
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error occurred'
    throw new Error(`OpenAI API Error: ${errorMessage}`)
  }
}

export async function embeddings(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: models.embedding,
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('[embeddings] Error:', error)
    throw error
  }
}
