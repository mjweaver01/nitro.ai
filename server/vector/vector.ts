import { embeddings } from '../clients/openai'
import { searchShopify } from '../clients/shopify'
import { sitemapVector } from './sitemapVector'

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
  let currentDocs = await searchShopify(question, isProducts)

  if (currentDocs.length <= 0) {
    currentDocs = sitemapVector(question, isAnthropic, isProducts)
  }

  try {
    // Get embeddings for the question
    const questionEmbedding = await embeddings(question)

    // Get embeddings for documents
    const docEmbeddings = await Promise.all(
      currentDocs.map(async (doc) => ({
        ...doc,
        embedding: await embeddings(doc.pageContent),
      })),
    )

    // Calculate similarity
    const results = docEmbeddings
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
