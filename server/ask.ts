import langfuse from './langfuse'
import { type LangfuseTraceClient, type LangfuseSpanClient } from 'langfuse'
import { CallbackHandler } from 'langfuse-langchain'
import { supabase } from './supabase'
import { kbTools } from './llm/tools'
import { kbSystemPromptTemplate } from './llm/prompts'
import { kbModelWithFunctions } from './llm/openai'
import { llm as anthropicLlm, kbModelWithTools as anthropicKbModelWithTools } from './llm/anthropic'
import { defaultQuestion } from './constants'
import random from './idGenerator'
import { saveToCache } from './cache'

// langchain stuff
import {
  AgentExecutor,
  AgentExecutorInput,
  createToolCallingAgent,
  type AgentStep,
} from 'langchain/agents'
import { RunnableSequence, type RunnableLike, Runnable } from '@langchain/core/runnables'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'
import { CreateToolCallingAgentParams } from 'langchain/agents'

export const ask = async (
  input: string,
  user: string,
  conversationId?: string,
  model?: string,
): Promise<ReadableStream> => {
  console.log(`[ask] Asking ${model || 'openai'}: ${JSON.stringify(input).substring(0, 100)}`)
  const isAnthropic = model === 'anthropic'
  const currentPromptTemplate = kbSystemPromptTemplate(isAnthropic)
  const currentModelWithFunctions = isAnthropic ? anthropicKbModelWithTools : kbModelWithFunctions
  const sessionId = (conversationId || random()).toString()

  let query = supabase.from('conversations').select('*').eq('id', parseInt(conversationId))
  if (user && user !== 'anonymous') {
    query = query.eq('user', user)
  }
  const { data } = await query
  const messages = data?.[0]?.messages ?? []
  if (messages.length > 0)
    console.log(
      `[ask] existing conversation (${messages.length} message${
        messages.length > 1 ? 's' : ''
      }) for ${sessionId}`,
    )
  const chatHistory: BaseMessage[] = messages.map((message: { role: string; content: string }) => {
    if (message.role === 'ai') {
      return new AIMessage(JSON.stringify(message.content))
    } else {
      return new HumanMessage(JSON.stringify(message.content))
    }
  })

  const trace = langfuse.trace({
    name: `ask`,
    input: JSON.stringify(input),
    sessionId,
    metadata: {
      model,
      user,
    },
  }) as LangfuseTraceClient | any

  const langfuseHandler = new CallbackHandler({ root: trace })

  const runnableAgent = isAnthropic
    ? createToolCallingAgent({
        llm: anthropicLlm(),
        prompt: currentPromptTemplate,
        tools: kbTools,
      } as unknown as CreateToolCallingAgentParams)
    : RunnableSequence.from([
        {
          input: (i: { input: string; steps: AgentStep[] }) => i.input,
          agent_scratchpad: (i: { input: string; steps: AgentStep[] }) =>
            formatToOpenAIFunctionMessages(i.steps),
          chat_history: (i: { chat_history: BaseMessage[] }) => i.chat_history,
        },
        currentPromptTemplate,
        currentModelWithFunctions as Runnable,
        new OpenAIFunctionsAgentOutputParser(),
      ] as unknown as [RunnableLike, RunnableLike])
  const executor = isAnthropic
    ? new AgentExecutor({ agent: runnableAgent, tools: kbTools } as unknown as AgentExecutorInput)
    : AgentExecutor.fromAgentAndTools({
        agent: runnableAgent,
        tools: kbTools,
      } as unknown as AgentExecutorInput)

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()
  let outputCache = ''
  let tokens = 0

  executor.invoke(
    {
      input,
      chat_history: chatHistory,
    },
    {
      configurable: { sessionId: sessionId, isAnthropic: isAnthropic },
      callbacks: [
        langfuseHandler,
        {
          handleLLMNewToken(token: string) {
            writer.write(encoder.encode(token))
            outputCache += token
            tokens += 1
          },
          async handleAgentEnd() {
            writer.write(encoder.encode(JSON.stringify({ conversationId: sessionId })))

            // need to check conversationId exists here, not sessionId
            if (conversationId && messages.length > 0) {
              const { error } = await supabase
                .from('conversations')
                .update([
                  {
                    messages: [
                      ...messages,
                      { role: 'user', content: input },
                      { role: 'ai', content: outputCache },
                    ],
                  },
                ])
                .eq('id', parseInt(conversationId))
                .eq('user', user)

              if (error) {
                console.error(error.message)
              }
            } else {
              const { error } = await supabase.from('conversations').upsert({
                id: parseInt(sessionId),
                conversationId: parseInt(sessionId),
                model,
                user,
                messages: [
                  ...messages,
                  { role: 'user', content: input },
                  { role: 'ai', content: outputCache },
                ],
              })
              if (error) {
                console.error(error.message)
              }
            }

            console.log('[vector] updated conversation', sessionId)

            await saveToCache(Date.now(), input, outputCache, model, user)

            trace.update({
              output: JSON.stringify(outputCache),
              sessionId,
              metadata: {
                model,
                user,
                tokens,
              },
            })
            langfuse.shutdownAsync()

            writer.close()
          },
        },
      ],
    },
  )

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
