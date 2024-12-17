import { tools } from './tools'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { createChatCompletion } from './clients/openai'
import { openai } from './clients/openai'
import { compiledDistillQueryPrompt } from './prompts'
import { threeModel } from './constants'
import langfuse from './clients/langfuse'

const distillModel = threeModel

async function distillQuery(
  question: string,
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const generation = await langfuse.generation({
    name: 'distill_query',
    input: JSON.stringify(question),
    model: distillModel,
  })

  await generation.update({
    completionStartTime: new Date(),
  })

  try {
    const completion = await openai.chat.completions.create({
      model: distillModel,
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

    const content = completion.choices[0]?.message?.content?.toLowerCase() ?? question

    await generation.end({
      output: JSON.stringify(content),
      level: 'DEFAULT',
    })

    console.log('[distillQuery]', content)

    return content
  } catch (error) {
    await generation.end({
      output: JSON.stringify(error),
      level: 'ERROR',
    })
    console.error('[distillQuery] Error:', error)
    return question
  } finally {
    await langfuse.shutdownAsync()
  }
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

      // Format messages based on model type
      const isGemini = model.includes('gemini')
      
      if (!isGemini) {
        // OpenAI format
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
      }

      messages.push({
        role: 'tool',
        content: JSON.stringify(isGemini ? result : result.slice(0, 10000)),
        tool_call_id: toolCall.id,
      })

      return result
    } catch (error) {
      console.error('Error executing tool:', error)
      return null
    }
  })

  // Wait for all tool calls to complete
  await Promise.all(toolCallPromises)

  // Create final chat completion with all tool results
  try {
    const completion = await createChatCompletion(
      [...messages, {
        role: 'user',
        content: 'Please provide a helpful response based on the information above.',
      }],
      model,
      true
    )
    return completion
  } catch (error) {
    console.error('Error in final chat completion:', error)
    throw error
  }
}
