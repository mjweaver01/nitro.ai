import langfuse from '../clients/langfuse'
import { compiledPersonalizationPrompt } from '../prompts'
import { searchShopify } from '../clients/shopify'

export const personalizationTool = {
  name: 'personalization',
  type: 'function',
  description: compiledPersonalizationPrompt,
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The question about user preferences or history',
      },
    },
    required: ['question'],
  },
  function: async (question: string, meta?: any) => {
    const generation = await langfuse.generation({
      name: 'personalization',
      input: JSON.stringify(question),
      model: 'personalization',
    })

    await generation.update({
      completionStartTime: new Date(),
    })

    try {
      const results = await searchShopify(question, true)

      if (results.length > 0) {
        console.log(
          `[personalization] found ${results.length} result${results.length !== 1 ? 's' : ''}`,
        )
        await generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })
        return results
      } else {
        const noResultsResponse = {
          content:
            "I don't have any specific personalized information about that yet. " +
            "As we continue our conversation, I'll learn more about your preferences and training goals. " +
            "Would you like to tell me more about what you're looking to achieve?",
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
          "I apologize, but I'm having trouble accessing your personalized information right now. " +
          'Would you like to continue our conversation about something else?',
        source: 'error',
        type: 'error',
      }

      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })
      console.log('[personalization] error in personalization tool')
      return [errorResponse]
    } finally {
      await langfuse.shutdownAsync()
    }
  },
}
