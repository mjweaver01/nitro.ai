import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { Calculator } from '@langchain/community/tools/calculator'
import { DynamicTool } from '@langchain/community/tools/dynamic'
import langfuse from '../langfuse'
import { wikipediaPrompt } from '../constants'
import { compiledKbToolPrompt } from './prompts'
import { vector, rag } from '../vector'

const knowledgeBaseLoader = new DynamicTool({
  name: 'knowledge_base',
  description: compiledKbToolPrompt,
  func: async (question: string, runManager, meta) => {
    // const sessionId = meta?.configurable?.sessionId
    const isAnthropic = meta?.configurable?.isAnthropic

    const generation = langfuse.generation({
      name: 'knowledge_base',
      input: JSON.stringify(question),
      model: 'knowledge_base',
    })

    generation.update({
      completionStartTime: new Date(),
    })

    try {
      try {
        const results = await vector(question, isAnthropic)
        // const results = await rag(question)

        if (results.length > 0) {
          console.log(
            `[knowledge_base] found ${results.length} result${results.length !== 1 ? 's' : ''}`,
          )
        }

        generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })

        return JSON.stringify(results)
      } catch (error) {
        console.error(error)
        console.log(`[knowledge_base] error in the sitemap`)
        throw error
      }
    } catch (error) {
      generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      return '[knowledge_base] error in sitemap'
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
      generation.update({
        completionStartTime: new Date(),
      })

      const wikipediaQuery = new WikipediaQueryRun({
        topKResults: 1,
        maxDocContentLength: 500,
      })

      const result = await wikipediaQuery.call(question)
      console.log(`[wikipedia] ${JSON.stringify(result).substring(0, 100)}`)

      generation.end({
        output: JSON.stringify(result),
        level: 'DEFAULT',
      })

      return result
    } catch (error) {
      generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      return '[wikipedia] error in wikipediaQuery'
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

export const tools = [WikipediaQuery, new Calculator()]

export const kbTools = [knowledgeBaseLoader]
