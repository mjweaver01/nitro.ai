import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { Calculator } from '@langchain/community/tools/calculator'
import { DynamicTool } from '@langchain/community/tools/dynamic'
import langfuse from '../clients/langfuse'
import { wikipediaPrompt } from '../constants'
import { compiledKbToolPrompt, compiledSalesPrompt, compiledPersonalizationPrompt } from './prompts'
import { vector } from '../vector/vector'

const knowledgeBaseLoader = new DynamicTool({
  name: 'knowledge_base',
  description: compiledKbToolPrompt,
  func: async (question: string, runManager, meta) => {
    const sessionId = meta?.configurable?.sessionId
    const isAnthropic = meta?.configurable?.isAnthropic

    const generation = await langfuse.generation({
      name: 'knowledge_base',
      input: JSON.stringify(question),
      model: 'knowledge_base',
    })

    await generation.update({
      completionStartTime: new Date(),
    })

    try {
      try {
        const results = await vector(question, isAnthropic)

        if (results.length > 0) {
          console.log(
            `[knowledge_base] found ${results.length} result${results.length !== 1 ? 's' : ''}`,
          )
        }

        await generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })

        return JSON.stringify(results)
      } catch {
        console.log(`[knowledge_base] error in the kb tool`)
        return []
      }
    } catch (error) {
      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      console.log('[knowledge_base] error in kb tool')
      return []
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

const WikipediaQuery = new DynamicTool({
  name: 'wikipedia',
  description: wikipediaPrompt,
  func: async (question: string, runManager, meta) => {
    // const sessionId = meta?.configurable?.sessionId

    const generation = langfuse.generation({
      name: 'wikipedia',
      input: JSON.stringify(question),
      model: 'wikipedia',
    })

    try {
      await generation.update({
        completionStartTime: new Date(),
      })

      const wikipediaQuery = new WikipediaQueryRun({
        topKResults: 1,
        maxDocContentLength: 500,
      })

      const result = await wikipediaQuery.call(question)
      console.log(`[wikipedia] ${JSON.stringify(result).substring(0, 100)}`)

      await generation.end({
        output: JSON.stringify(result),
        level: 'DEFAULT',
      })

      return result
    } catch (error) {
      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      return '[wikipedia] error in wikipediaQuery'
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

const salesToolLoader = new DynamicTool({
  name: 'sales_tool',
  description: compiledSalesPrompt,
  func: async (question: string, runManager, meta) => {
    const isAnthropic = meta?.configurable?.isAnthropic
    const sessionId = meta?.configurable?.sessionId

    const generation = await langfuse.generation({
      name: 'sales_tool',
      input: JSON.stringify(question),
      model: 'sales_tool',
    })

    await generation.update({
      completionStartTime: new Date(),
    })

    try {
      try {
        const results = await vector(question, isAnthropic, true)

        if (results.length > 0) {
          console.log(
            `[sales_tool] found ${results.length} result${results.length !== 1 ? 's' : ''}`,
          )
        }

        await generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })

        return JSON.stringify(results)
      } catch (error) {
        console.error(error)
        console.log(`[sales_tool] error in the sales tool`)
        throw error
      }
    } catch (error) {
      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      console.log('[sales_tool] error in sales tool')
      return []
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

export const tools = [WikipediaQuery, new Calculator()]

export const kbTools = [knowledgeBaseLoader, salesToolLoader]
