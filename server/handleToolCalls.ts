import { tools } from './tools'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { createChatCompletion } from './clients/openai'
import { openai } from './clients/openai'
import { compiledDistillQueryPrompt } from './prompts'
import { threeModel } from './constants'

async function distillQuery(
  question: string,
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: threeModel,
    temperature: 0,
    messages: [
      ...messages,
      {
        role: 'system',
        content: compiledDistillQueryPrompt,
      },
      {
        role: 'user',
        content: question,
      },
    ],
  })

  console.log('[distillQuery]', completion.choices[0]?.message?.content)

  return completion.choices[0]?.message?.content?.toLowerCase() ?? question
}

export async function handleToolCalls(
  toolCalls: any,
  messages: ChatCompletionMessageParam[],
  model: string,
) {
  if (!toolCalls || !Array.isArray(toolCalls)) return null

  const toolCallPromises = toolCalls.map(async (call) => {
    const toolCall = {
      id: call.id || '',
      name: call.function?.name || '',
      arguments: call.function?.arguments || '',
    }

    if (!toolCall.name || !toolCall.arguments) return null

    try {
      const tool = tools.find((t) => t.name === toolCall.name)
      if (!tool) {
        throw new Error(`Tool ${toolCall.name} not found`)
      }

      let args
      try {
        args = JSON.parse(toolCall.arguments)
      } catch (e) {
        const jsonMatch = toolCall.arguments.match(/\{[^}]+\}/)?.[0]
        if (jsonMatch) {
          args = JSON.parse(jsonMatch)
        } else {
          throw new Error('Invalid JSON arguments')
        }
      }

      const distilledQuery = await distillQuery(args.question, messages)
      const result = await tool.function(distilledQuery)

      messages.push({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: toolCall.id,
            type: 'function',
            function: {
              name: toolCall.name,
              arguments: toolCall.arguments,
            },
          },
        ],
      })

      const limitedResult = result.slice(0, 10000)

      messages.push({
        role: 'tool',
        content: JSON.stringify(limitedResult),
        tool_call_id: toolCall.id,
      })

      return limitedResult
    } catch (error) {
      console.error('Error executing tool:', error)
      return null
    }
  })

  // Wait for all tool calls to complete
  await Promise.all(toolCallPromises)

  // Create final chat completion with all tool results
  return await createChatCompletion(messages, model, true)
}
