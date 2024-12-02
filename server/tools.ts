import langfuse from './clients/langfuse'
import { compiledKbToolPrompt, compiledSalesPrompt, compiledPersonalizationPrompt } from './prompts'
import { vector } from './vector/vector'

export const tools = [
  {
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
        const results = await vector(question, isAnthropic)

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
            content: "I couldn't find any specific information about this in our knowledge base. " +
                    "However, I can provide some general context based on what I know about Westside Barbell's " +
                    "training philosophy. Would you like me to explain more about that?",
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
          content: "I apologize, but I'm having trouble accessing the knowledge base right now. " +
                  "Would you like to rephrase your question or ask about something else?",
          source: 'error',
          type: 'error'
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
  },
  {
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
        const results = await vector(question, false, true)

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
  },
  {
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
        const results = await vector(question)

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
            content: "I don't have any specific personalized information about that yet. " +
                    "As we continue our conversation, I'll learn more about your preferences and training goals. " +
                    "Would you like to tell me more about what you're looking to achieve?",
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
          content: "I apologize, but I'm having trouble accessing your personalized information right now. " +
                  "Would you like to continue our conversation about something else?",
          source: 'error',
          type: 'error'
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
]
