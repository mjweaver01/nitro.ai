import { embeddings } from '../clients/openai'
import { searchShopify } from '../clients/shopify'
// import { sitemapVector } from './sitemapVector'

const OPEN_AI_LIMIT = 5
const ANTHROPIC_LIMIT = 10

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

export const vector = async (question: string, isAnthropic = false, isProducts = false) => {
  console.log(`[vector:${isProducts ? 'sales_tool' : 'knowledge_base'}] searching "${question}"`)
  const vectorLimit = isAnthropic ? ANTHROPIC_LIMIT : OPEN_AI_LIMIT

  try {
    let currentDocs = await searchShopify(question, isProducts)
    if (!Array.isArray(currentDocs) || currentDocs.length === 0) {
      console.warn('[vector] No valid documents returned from search')
      return []
    }

    // Get embeddings for the question
    const questionEmbedding = await embeddings(question)
    if (!Array.isArray(questionEmbedding)) {
      console.error('[vector] Invalid question embedding format')
      return []
    }

    // Get embeddings for documents
    const docEmbeddings = await Promise.all(
      currentDocs.map(async (doc) => {
        try {
          const embedding = await embeddings(doc.pageContent)
          return {
            ...doc,
            embedding,
          }
        } catch (err) {
          console.error('[vector] Error getting document embedding:', err)
          return null
        }
      }),
    )

    // Filter out failed embeddings and calculate similarity
    const results = docEmbeddings
      .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
      .map((doc) => ({
        ...doc,
        similarity: cosineSimilarity(questionEmbedding, doc.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, vectorLimit)

    return results
  } catch (error) {
    console.error('[vector] error:', error)
    return []
  }
}
