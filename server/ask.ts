import type { ChatCompletionMessage, ChatCompletionRole } from 'openai/resources/chat/completions'
import { supabase } from './clients/supabase'
import { systemPromptTemplate } from './prompts'
import { defaultQuestion } from './constants'
import random from './idGenerator'
import { saveToCache } from './cache'
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
  const messages = []

  // Get existing conversation if available
  if (conversationId && !nosupa) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', parseInt(conversationId))

    if (data?.[0]?.messages) {
      messages.push(
        ...data[0].messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      )
    }

    console.log(`[ask] loaded conversation with ${messages.length} messages`, conversationId)
  }

  if (messages.length === 0) {
    // Add system prompt
    messages.unshift({
      role: 'system',
      content: systemPromptTemplate(model === 'anthropic'),
      refusal: '',
    })
  }

  // Add user input
  messages.push({
    role: 'user',
    content: input,
    refusal: '',
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const completion = await createChatCompletion(messages, models[model], true)

        let outputCache = ''
        let currentToolCall = null

        for await (const chunk of completion as any) {
          const content = chunk.choices[0]?.delta?.content
          const toolCalls = chunk.choices[0]?.delta?.tool_calls

          if (content) {
            controller.enqueue(encoder.encode(content))
            outputCache += content
          }

          if (toolCalls) {
            // Initialize or update the current tool call
            if (!currentToolCall && toolCalls[0]?.id) {
              currentToolCall = {
                id: toolCalls[0].id,
                type: toolCalls[0].type,
                function: {
                  name: toolCalls[0].function.name,
                  arguments: '',
                },
              }
            }

            // Accumulate function arguments
            if (currentToolCall && toolCalls[0]?.function?.arguments) {
              currentToolCall.function.arguments += toolCalls[0].function.arguments
            }
          } else if (toolCalls === undefined && currentToolCall) {
            // Only process when toolCalls is explicitly undefined and we have a complete tool call
            const toolResult = await handleToolCalls([currentToolCall], messages, models[model])
            if (toolResult) {
              for await (const chunk of toolResult as any) {
                const content = chunk.choices[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(content))
                  outputCache += content
                }
              }
            }
            currentToolCall = null
          }
        }

        // Cache the conversation if needed
        if (!nosupa && outputCache.length > 0) {
          const saveConversation = async () => {
            if (conversationId) {
              const { data: existingConversation } = await supabase
                .from('conversations')
                .select('messages')
                .eq('id', parseInt(conversationId))
                .single()

              if (existingConversation) {
                const filteredMessages = messages.filter(
                  (msg) =>
                    msg.content?.length > 0 &&
                    msg.role !== ('system' as ChatCompletionRole) &&
                    msg.role !== ('tool' as ChatCompletionRole),
                )

                await supabase
                  .from('conversations')
                  .update({
                    messages: [...filteredMessages, { role: 'assistant', content: outputCache }],
                  })
                  .eq('id', parseInt(conversationId))
                console.log('[ask] updated conversation', conversationId)
                return
              }
            }

            // If no existing conversation found or no conversationId, create new
            await supabase.from('conversations').insert({
              id: parseInt(sessionId),
              conversationId: parseInt(sessionId),
              model: models[model],
              user,
              messages: [
                ...messages.filter(
                  (msg) =>
                    msg.content?.length > 0 &&
                    msg.role !== ('system' as ChatCompletionRole) &&
                    msg.role !== ('tool' as ChatCompletionRole),
                ),
                { role: 'assistant', content: outputCache },
              ],
            })
            console.log('[ask] created conversation', sessionId)
          }

          const saveCacheIfNeeded = async () => {
            if (!nocache) {
              await saveToCache(Date.now(), input, outputCache, model, user)
            }
          }

          await Promise.allSettled([saveConversation(), saveCacheIfNeeded()])
        }

        // Send the conversation ID as a JSON string at the end of the stream
        controller.enqueue(encoder.encode(`\n{"conversationId":"${sessionId}"}`))
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
