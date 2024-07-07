import langfuse from './langfuse'
import { supabase } from './supabase'
import { kbTools } from './llm/tools'
import { kbSystemPromptTemplate } from './llm/prompts'
import { kbModelWithFunctions } from './llm/openai'
import { llm as anthropicLlm, kbModelWithTools as anthropicKbModelWithTools } from './llm/anthropic'
import { defaultQuestion } from './constants'
import random from './idGenerator'

// langchain stuff
import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor, createToolCallingAgent, type AgentStep } from 'langchain/agents'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'
import { Runnable } from '@langchain/core/runnables'

export const ask = async (
  input: string,
  user: string,
  conversationId?: string,
  model?: string,
): Promise<Answer> => {
  console.log(`[ask] Asking ${model || 'openai'}: ${JSON.stringify(input).substring(0, 100)}`)
  const isAnthropic = model === 'anthropic'
  const currentPromptTemplate = kbSystemPromptTemplate(isAnthropic)
  const currentModelWithFunctions = isAnthropic ? anthropicKbModelWithTools : kbModelWithFunctions

  let query = supabase.from('conversations').select('*').eq('id', conversationId).eq('user', user)
  if (user && user !== 'anonymous') {
    query = query.eq('user', user)
  }
  const { data } = await query
  const messages = data?.[0]?.messages ?? []
  const chatHistory: BaseMessage[] = messages.map((message: { role: string; content: string }) => {
    if (message.role === 'ai') {
      return new AIMessage(JSON.stringify(message.content))
    } else {
      return new HumanMessage(JSON.stringify(message.content))
    }
  })

  const runnableAgent = isAnthropic
    ? createToolCallingAgent({ llm: anthropicLlm(), tools: kbTools, prompt: currentPromptTemplate })
    : RunnableSequence.from([
        {
          input: (i: { input: string; steps: AgentStep[] }) => i.input,
          agent_scratchpad: (i: { input: string; steps: AgentStep[] }) =>
            formatToOpenAIFunctionMessages(i.steps),
          chat_history: (i: any) => i.chat_history,
        },
        currentPromptTemplate,
        currentModelWithFunctions as Runnable,
        new OpenAIFunctionsAgentOutputParser(),
      ])

  const executor = isAnthropic
    ? new AgentExecutor({ agent: runnableAgent, tools: kbTools })
    : AgentExecutor.fromAgentAndTools({
        agent: runnableAgent,
        tools: kbTools,
      })
  const invokee = await executor.invoke(
    {
      input,
      chat_history: chatHistory,
    },
    {
      configurable: { sessionId: conversationId, isAnthropic: isAnthropic },
    },
  )

  // save to supabase
  const { error } = await supabase.from('conversations').upsert({
    id: conversationId,
    model,
    user,
    messages: [
      ...messages,
      { role: 'user', content: invokee.input },
      { role: 'ai', content: invokee.output },
    ],
  })

  if (error) {
    console.error(error.message)
  }

  return {
    ...(invokee as any),
    conversationId,
    model,
  }
}

export async function askQuestion(
  input: string = defaultQuestion,
  user: string,
  conversationId?: string,
  model?: string,
): Promise<Answer> {
  const sessionId = conversationId || random()
  const trace = langfuse.trace({
    name: `ask`,
    input: JSON.stringify(input),
    sessionId,
    metadata: {
      model,
    },
  })

  const response = await ask(input, user, sessionId, model)

  trace.update({
    output: JSON.stringify(response?.output ?? response),
  })

  await langfuse.shutdownAsync()

  return response
}
