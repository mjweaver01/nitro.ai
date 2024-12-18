import type { ChatCompletionMessage, ChatCompletionRole } from 'openai/resources/chat/completions'
import { supabase } from './clients/supabase'
import { compiledSystemPrompt } from './prompts'
import { defaultQuestion } from './constants'
import random from './idGenerator'
import { saveToCache } from './cache'
import { createChatCompletion } from './clients/openai'
import { models } from './constants'
import { handleToolCalls } from './handleToolCalls'

const getUserProfile = async (userId: string) => {
  if (!userId || userId === 'anonymous') return ''

  const { data } = await supabase.from('user_info').select('*').eq('id', userId).single()

  if (data) {
    return `
  User Profile Information:
  - Current Age & Physique: ${data.physique || 'Not specified'}
  - Training Knowledge & Experience: ${data.experience || 'Not specified'}
  - Fitness Goals: ${data.goals || 'Not specified'}
  - Available Equipment: ${data.equipment || 'Not specified'}
  `
  }

  return ''
}

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

  // Get user profile info
  const userProfileInfo = await getUserProfile(user)

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
    // Add system prompt with user profile info
    const systemPromptWithProfile = compiledSystemPrompt.replace(
      '{userProfileInfo}',
      userProfileInfo,
    )
    messages.unshift({
      role: 'system',
      content: systemPromptWithProfile,
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
        let currentToolCalls = new Map()

        for await (const chunk of completion as any) {
          const content = chunk.choices[0]?.delta?.content
          const toolCalls = chunk.choices[0]?.delta?.tool_calls

          // First handle any content that comes in
          if (content) {
            controller.enqueue(encoder.encode(content))
            outputCache += content
          }

          // Then handle tool calls if present
          if (toolCalls?.length > 0) {
            // Handle all tool calls in this delta
            for (const call of toolCalls) {
              // Get the correct tool call using either id or index
              const callId =
                call.id ||
                (call.index !== undefined ? Array.from(currentToolCalls.keys())[call.index] : null)

              if (call.id) {
                // Initialize new tool call
                if (!currentToolCalls.has(call.id)) {
                  console.log(
                    `[ask] New tool call: ${call.function?.name || 'unknown'} (${call.id})`,
                  )
                  currentToolCalls.set(call.id, {
                    id: call.id,
                    type: call.type || 'function',
                    function: {
                      name: call.function?.name || '',
                      arguments: '',
                    },
                  })
                }
              }

              // Accumulate function arguments if we have a valid call
              if (callId && currentToolCalls.has(callId)) {
                const currentCall = currentToolCalls.get(callId)
                if (currentCall) {
                  if (call.function?.name) {
                    currentCall.function.name = call.function.name
                  }
                  if (call.function?.arguments) {
                    // Reset arguments if we're getting a new JSON start
                    if (call.function.arguments.includes('{"')) {
                      currentCall.function.arguments = ''
                    }
                    currentCall.function.arguments += call.function.arguments
                  }
                }
              }
            }
          } else if (currentToolCalls.size > 0) {
            // Only check for completion when we have pending tool calls
            const completedCalls = Array.from(currentToolCalls.values()).filter((call) => {
              try {
                const args = call.function?.arguments || ''
                const isComplete =
                  args.trim().startsWith('{') && args.trim().endsWith('}') && call.function?.name

                if (isComplete) {
                  try {
                    JSON.parse(args)
                    return true
                  } catch (e) {
                    console.log(`[ask] Invalid JSON for ${call.id}`)
                    return false
                  }
                }
                return false
              } catch (e) {
                console.error('[ask] Error validating tool call:', e)
                return false
              }
            })

            if (completedCalls.length > 0) {
              try {
                console.log(`[ask] Processing ${completedCalls.length} tool calls`)
                const toolResult = await handleToolCalls(completedCalls, messages, models[model])

                if (toolResult) {
                  for await (const chunk of toolResult as any) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                      controller.enqueue(encoder.encode(content))
                      outputCache += content
                    }
                  }
                } else {
                  console.log('[ask] No content returned from tool calls')
                }
              } catch (error) {
                console.error('[ask] Error processing tool calls:', error)
              }

              // Clear processed tool calls
              completedCalls.forEach((call) => currentToolCalls.delete(call.id))
            }
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
      } catch (error: any) {
        console.error('Error in stream:', error)
        // Send error message to client
        const errorMessage = {
          error: true,
          message: error.message || 'An error occurred while processing your request',
        }
        controller.enqueue(encoder.encode(JSON.stringify(errorMessage)))
        controller.close()
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
