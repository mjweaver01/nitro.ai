import { tools } from './tools'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { createChatCompletion } from './clients/openai'

export async function handleToolCalls(
  toolCalls: any,
  messages: ChatCompletionMessageParam[],
  model: string,
) {
  if (!toolCalls || !Array.isArray(toolCalls)) return null

  // Accumulate tool calls until we have complete data
  let currentToolCall = {
    id: '',
    name: '',
    arguments: '',
  }

  for (const call of toolCalls) {
    if (call.id) currentToolCall.id = call.id
    if (call.function?.name) currentToolCall.name = call.function.name
    if (call.function?.arguments) currentToolCall.arguments += call.function.arguments
  }

  // Only proceed if we have a complete tool call
  if (currentToolCall.id && currentToolCall.name && currentToolCall.arguments) {
    try {
      const tool = tools.find((t) => t.name === currentToolCall.name)
      if (!tool) {
        throw new Error(`Tool ${currentToolCall.name} not found`)
      }

      // Parse and execute the tool
      const args = JSON.parse(currentToolCall.arguments)
      const result = await tool.function(args.question)

      // Add the tool response to messages
      messages.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id: currentToolCall.id,
      })

      // Get a new completion with the tool results
      return await createChatCompletion(messages, model, true)
    } catch (error) {
      console.error('Error executing tool:', error)
      return null
    }
  }

  return null
}
