import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import {
  systemPrompt,
  kbToolPrompt,
  salesToolPrompt,
  anthropicNudge,
  personalizationToolPrompt,
} from '../constants'
import langfuse from '../clients/langfuse'

export const generatePromptTemplate = (sentPrompt: string, isAnthropic?: boolean) => {
  return ChatPromptTemplate.fromMessages(
    isAnthropic
      ? [
          ['system', sentPrompt],
          ['placeholder', '{chat_history}'],
          ['human', anthropicNudge],
          ['placeholder', '{agent_scratchpad}'],
          ['human', '{input}'],
        ]
      : [
          ['system', sentPrompt],
          new MessagesPlaceholder('chat_history'),
          ['human', '{input}'],
          new MessagesPlaceholder('agent_scratchpad'),
        ],
  )
}

const SystemPrompt = await langfuse.getPrompt('SYSTEM_PROMPT')
const compiledSystemPrompt = SystemPrompt.prompt ? SystemPrompt.prompt : systemPrompt
export const systemPromptTemplate = (isAnthropic = false) =>
  generatePromptTemplate(compiledSystemPrompt, isAnthropic)

const KbToolPrompt = await langfuse.getPrompt('KB_TOOL_PROMPT')
export const compiledKbToolPrompt = KbToolPrompt.prompt ? KbToolPrompt.prompt : kbToolPrompt

const salesPrompt = await langfuse.getPrompt('SALES_TOOL_PROMPT')
export const compiledSalesPrompt = salesPrompt.prompt ? salesPrompt.prompt : salesToolPrompt

const personalizationPrompt = await langfuse.getPrompt('PERSONALIZATION_TOOL_PROMPT')
export const compiledPersonalizationPrompt = personalizationPrompt
  ? personalizationPrompt.prompt
  : personalizationToolPrompt
