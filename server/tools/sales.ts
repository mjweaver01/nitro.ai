import langfuse from '../clients/langfuse'
import { compiledSalesPrompt } from '../prompts'
import { searchShopify } from '../clients/shopify'

export const salesTool = {
  name: 'sales',
  type: 'function',
  description: compiledSalesPrompt,
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The question about products or services',
      },
    },
    required: ['question'],
  },
  function: async (question: string, meta?: any) => {
    const generation = await langfuse.generation({
      name: 'sales',
      input: JSON.stringify(question),
      model: 'sales',
    })

    await generation.update({
      completionStartTime: new Date(),
    })

    try {
      const results = await searchShopify(question, true)

      if (results.length > 0) {
        console.log(
          `[sales] found ${results.length} result${results.length !== 1 ? 's' : ''}`,
        )
        await generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })
        return results
      } else {
        const noResultsResponse = {
          content: "I couldn't find any specific products or services matching your request. " +
                  "Would you like to browse our main product categories, or can I help you find something similar?",
          source: 'fallback',
          type: 'no_results'
        }
        
        await generation.end({
          output: JSON.stringify(noResultsResponse),
          level: 'DEFAULT',
        })
        
        return [noResultsResponse]
      }
    } catch (error) {
      const errorResponse = {
        content: "I apologize, but I'm having trouble accessing our product information right now. " +
                "Please try again in a moment, or I can help you with something else.",
        source: 'error',
        type: 'error'
      }
      
      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })
      console.log('[sales] error in sales tool')
      return [errorResponse]
    } finally {
      await langfuse.shutdownAsync()
    }
  },
} 