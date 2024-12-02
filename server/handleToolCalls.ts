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

  let currentToolCall = {
    id: '',
    name: '',
    arguments: '',
  }

  for (const call of toolCalls) {
    if (call.function?.name && call.function.name.length > 0) {
      currentToolCall.name = call.function.name
    }
    if (call.id && call.id.length > 0) {
      currentToolCall.id = call.id
    }
    if (call.function?.arguments && call.function.arguments.length > 0) {
      if (currentToolCall.arguments.trim().endsWith('}')) {
        currentToolCall.arguments = call.function.arguments
      } else {
        currentToolCall.arguments += call.function.arguments
      }
    }
  }

  if (currentToolCall.name && currentToolCall.arguments) {
    try {
      const tool = tools.find((t) => t.name === currentToolCall.name)
      if (!tool) {
        throw new Error(`Tool ${currentToolCall.name} not found`)
      }

      console.log('[currentToolCall]', currentToolCall)

      let args
      try {
        args = JSON.parse(currentToolCall.arguments)
      } catch (e) {
        const jsonMatch = currentToolCall.arguments.match(/\{[^}]+\}/)?.[0]
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
            id: currentToolCall.id,
            type: 'function',
            function: {
              name: currentToolCall.name,
              arguments: currentToolCall.arguments,
            },
          },
        ],
      })

      const limitedResult = result.slice(0, 10000)

      messages.push({
        role: 'tool',
        content: JSON.stringify(limitedResult),
        tool_call_id: currentToolCall.id,
      })

      currentToolCall.id = ''
      currentToolCall.name = ''
      currentToolCall.arguments = ''

      return await createChatCompletion(messages, model, true)
    } catch (error) {
      console.error('Error executing tool:', error)
      return null
    }
  }

  return null
}
