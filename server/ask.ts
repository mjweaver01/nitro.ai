import { supabase } from './clients/supabase'
import { systemPromptTemplate } from './prompts'
import { defaultQuestion } from './constants'
import random from './idGenerator'
import { saveToCache } from './cache'
import { saveToZep } from './clients/zep'
import { createChatCompletion } from './clients/openai'
import { oOneModel, fourOModel, threeModel } from './constants'
import { tools } from './tools'

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

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const completion = await createChatCompletion(
          messages,
          model === 'gpt-4o' ? fourOModel : model === 'o1-preview' ? oOneModel : threeModel,
          true,
        )

        let outputCache = ''

        for await (const chunk of completion as AsyncIterable<any>) {
          const content = chunk.choices[0]?.delta?.content
          const toolCalls = chunk.choices[0]?.delta?.tool_calls

          if (content) {
            controller.enqueue(encoder.encode(content))
            outputCache += content
          }

          if (toolCalls) {
            for (const toolCall of toolCalls) {
              if (toolCall.function) {
                const toolName = toolCall.function.name
                const toolArgs = JSON.parse(toolCall.function.arguments)

                // Execute the tool
                const tool = tools.find((t) => t.name === toolName)
                if (tool) {
                  const question = Array.isArray(toolArgs.question)
                    ? toolArgs.question.join(' ')
                    : toolArgs.question

                  const result = await tool.function(question)
                  const resultString = Array.isArray(result) ? result.join(' ') : result
                  controller.enqueue(encoder.encode(resultString))
                  outputCache += resultString
                }
              }
            }
          }
        }

        // Save conversation in background
        Promise.all([
          supabase.from('conversations').upsert({
            id: parseInt(sessionId),
            conversationId: parseInt(sessionId),
            model,
            user,
            messages: [
              ...messages,
              { role: 'user', content: input },
              { role: 'assistant', content: outputCache },
            ],
          }),
          saveToCache(Date.now(), input, outputCache, model, user),
          saveToZep(sessionId, [
            { role: 'user', content: input },
            { role: 'assistant', content: outputCache },
          ]),
        ]).catch(console.error) // Handle errors but don't wait
      } catch (error) {
        console.error('Streaming error:', error)
        controller.enqueue(encoder.encode('An error occurred while processing your request.'))
      } finally {
        controller.close()
      }
    },
    cancel() {
      // Handle cancellation if needed
      console.log('Stream cancelled by client')
    },
  })
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
