import { supabase } from './clients/supabase'
import { tools } from './llm/tools'
import { systemPromptTemplate } from './llm/prompts'
import { defaultQuestion } from './constants'
import random from './idGenerator'
import { saveToCache } from './cache'
import { zepMemory, saveToZep } from './clients/zep'
import { createChatCompletion } from './clients/openai'
import { fourOModel, threeModel } from './constants'

export const ask = async (
  input: string,
  user: string,
  conversationId?: string,
  model?: string,
): Promise<ReadableStream> => {
  const sessionId = (conversationId || random()).toString()
  const messages = []

  // Get existing conversation if available
  if (conversationId) {
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
    role: 'system',
    content: systemPromptTemplate(model === 'anthropic'),
  })

  // Add user input
  messages.push({
    role: 'user',
    content: input,
  })

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()
  let outputCache = ''

  try {
    const completion = await createChatCompletion(
      messages,
      tools,
      model === 'anthropic' ? fourOModel : threeModel,
      true,
    )

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || ''
      const toolCalls = chunk.choices[0]?.delta?.tool_calls || []

      if (content) {
        writer.write(encoder.encode(content))
        outputCache += content
      }

      // Handle tool calls
      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.function) {
            const tool = tools.find((t) => t.name === toolCall.function.name)
            if (tool) {
              try {
                const args = JSON.parse(toolCall.function.arguments)
                const result = await tool.function(args.question, {
                  configurable: { isAnthropic: model === 'anthropic' },
                })
                const toolResponse = result.toString()
                writer.write(encoder.encode(toolResponse))
                outputCache += toolResponse
              } catch (error) {
                console.error(`Error executing tool ${toolCall.function.name}:`, error)
              }
            }
          }
        }
      }
    }

    // Save conversation
    const newMessages = [
      { role: 'user', content: input },
      { role: 'assistant', content: outputCache },
    ]

    await supabase.from('conversations').upsert({
      id: parseInt(sessionId),
      conversationId: parseInt(sessionId),
      model,
      user,
      messages: [...messages, ...newMessages],
    })

    await saveToCache(Date.now(), input, outputCache, model, user)
    await saveToZep(sessionId, newMessages)
  } catch (error) {
    console.error(error)
    writer.write(encoder.encode('An error occurred'))
  } finally {
    writer.close()
  }

  return stream.readable
}

export async function askQuestion(
  input: string = defaultQuestion,
  user: string,
  conversationId?: string,
  model?: string,
): Promise<ReadableStream> {
  const response = await ask(input, user, conversationId, model)

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk)
    },
  })

  return response.pipeThrough(transformStream)
}
