import { OpenAIEmbeddings } from '@langchain/openai'
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib'
import { searchShopify } from '../clients/shopify'
import { sitemapVector } from './sitemapVector'

const OPEN_AI_LIMIT = 5
const ANTHROPIC_LIMIT = 10

export const vector = async (question: string, isAnthropic = false, isProducts = false) => {
  console.log(`[vector:${isProducts ? 'sales_tool' : 'knowledge_base'}] searching "${question}"`)
  const vectorLimit = isAnthropic ? ANTHROPIC_LIMIT : OPEN_AI_LIMIT
  let currentDocs = await searchShopify(question, isProducts)
  if (currentDocs.length <= 0) currentDocs = sitemapVector(question, isAnthropic, isProducts)

  try {
    // anthropic doesn't have it's own text embedding model
    // so we'll just use results directly
    if (isAnthropic) {
      console.log(`[vector] anthropic - skip vector & use results directly`)
      return currentDocs
    } else {
      console.log(`[vector] feeding store with ${currentDocs.length} results`)

      try {
        const hnsw = await HNSWLib.fromDocuments(
          currentDocs,
          new OpenAIEmbeddings({
            model: 'text-embedding-3-large',
            openAIApiKey: process.env.VITE_OPENAI_API_KEY,
          }),
        )
        console.log(`[vector] fed vector store`)

        const results = await hnsw.similaritySearch(question, vectorLimit)
        console.log(`[vector] queried the vector store`)

        return results
      } catch {
        return currentDocs
      }
    }
  } catch {
    console.log('[vector] error encountered while querying vector')
    return []
  }
}
