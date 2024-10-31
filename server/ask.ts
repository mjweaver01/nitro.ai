import { Stream } from 'openai/streaming'
import type { ChatCompletionChunk, ChatCompletionMessage } from 'openai/resources/chat/completions'
import { supabase } from './clients/supabase'
import { systemPromptTemplate } from './prompts'
import { defaultQuestion } from './constants'
import random from './idGenerator'
import { saveToCache } from './cache'
import { saveToZep } from './clients/zep'
import { createChatCompletion } from './clients/openai'
import { models } from './constants'
import { handleToolCalls } from './handleToolCalls'

export const ask = async (
  input: string,
  user: string,
  conversationId?: string,
  model?: string,
  nocache?: boolean,
  nosupa?: boolean,
): Promise<ReadableStream> => {
  const sessionId = (conversationId || random()).toString()
  const messages: ChatCompletionMessage[] = []

  // Create a persistent tool call object outside the stream
  let currentToolCall = {
    id: '',
    name: '',
    arguments: '',
  }

  // Get existing conversation if available
  if (conversationId && !nosupa) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', parseInt(conversationId))

    if (data?.[0]?.messages) {
      messages.push(
        ...data[0].messages.map((msg) => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content,
        })),
      )
    }
  }

  // Add system prompt
  messages.unshift({
    role: 'assistant',
    content: systemPromptTemplate(model === 'anthropic'),
    refusal: '',
  })

  // Add user input
  messages.push({
    role: 'user' as any,
    content: input,
    refusal: '',
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const completion = await createChatCompletion(messages, models[model], true)

        let outputCache = ''

        for await (const chunk of completion as any) {
          const content = chunk.choices[0]?.delta?.content
          const toolCalls = chunk.choices[0]?.delta?.tool_calls

          if (content) {
            controller.enqueue(encoder.encode(content))
            outputCache += content
          }

          // Handle the tool calls with persistent state
          // second stream will be handled here
          if (toolCalls) {
            const toolResult = await handleToolCalls(
              toolCalls,
              messages,
              models[model],
              currentToolCall,
            )
            if (toolResult) {
              for await (const chunk of toolResult as any) {
                const content = chunk.choices[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(content))
                  outputCache += content
                }
              }
            }
          }
        }

        // Cache the conversation if needed
        if (!nocache && !nosupa && outputCache.length > 0) {
          // Save conversation in background
          Promise.all([
            supabase.from('conversations').upsert({
              id: parseInt(sessionId),
              conversationId: parseInt(sessionId),
              model: models[model],
              user,
              messages: [
                ...messages.filter(
                  (message) => message.role !== 'assistant' && message.role !== 'tool',
                ),
                { role: 'user', content: input },
                { role: 'assistant', content: outputCache },
              ],
            }),
            saveToCache(Date.now(), input, outputCache, model, user),
            saveToZep(sessionId, [
              { role: 'user', content: input },
              { role: 'assistant', content: outputCache },
            ]),
          ]).catch(console.error)
        }

        controller.close()
      } catch (error) {
        console.error('Error in stream:', error)
        controller.error(error)
      }
    },
  })
}

export async function askQuestion(
  input: string = defaultQuestion,
  user: string,
  conversationId?: string,
  model?: string,
  nocache?: boolean,
  nosupa?: boolean,
): Promise<ReadableStream> {
  const response = await ask(input, user, conversationId, model, nocache, nosupa)

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk)
    },
  })

  return response.pipeThrough(transformStream)
}
