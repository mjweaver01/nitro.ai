import langfuse from '../clients/langfuse'
import { compiledKbToolPrompt } from '../prompts'
import { searchShopify } from '../clients/shopify'

export const knowledgeBaseTool = {
  name: 'knowledge_base',
  type: 'function',
  description: compiledKbToolPrompt,
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The question to search for in the knowledge base',
      },
    },
    required: ['question'],
  },
  function: async (question: string, meta?: any) => {
    const generation = await langfuse.generation({
      name: 'knowledge_base',
      input: JSON.stringify(question),
      model: 'knowledge_base',
    })

    await generation.update({
      completionStartTime: new Date(),
    })

    try {
      const results = await searchShopify(question, false)

      if (results.length > 0) {
        console.log(
          `[knowledge_base] found ${results.length} result${results.length !== 1 ? 's' : ''}`,
        )
        await generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })
        return results
      } else {
        const noResultsResponse = {
          content:
            "I couldn't find any specific information about this in our knowledge base. " +
            "However, I can provide some general context based on what I know about Westside Barbell's " +
            'training philosophy. Would you like me to explain more about that?',
          source: 'fallback',
          type: 'no_results',
        }

        await generation.end({
          output: JSON.stringify(noResultsResponse),
          level: 'DEFAULT',
        })

        return [noResultsResponse]
      }
    } catch (error) {
      const errorResponse = {
        content:
          "I apologize, but I'm having trouble accessing the knowledge base right now. " +
          'Would you like to rephrase your question or ask about something else?',
        source: 'error',
        type: 'error',
      }

      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })
      console.log('[knowledge_base] error in kb tool')
      return [errorResponse]
    } finally {
      await langfuse.shutdownAsync()
    }
  },
}
