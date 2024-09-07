import { ChatAnthropic } from '@langchain/anthropic'
import { tools, kbTools } from './tools'
import { claude3Model } from '../constants'

export const llm = (newModel: boolean = false) =>
  new ChatAnthropic({
    temperature: 0.3,
    model: claude3Model,
    apiKey: process.env.VITE_ANTHROPIC_API_KEY,
    maxTokens: 1024,
    streaming: true,
  })

export const modelWithTools = llm(true)
  .bindTools(tools)
  .bind({
    stop: ['</tool_input>', '</final_answer>'],
  })

export const kbModelWithTools = llm(true)
  .bindTools(kbTools)
  .bind({
    stop: ['</tool_input>', '</final_answer>'],
  })
