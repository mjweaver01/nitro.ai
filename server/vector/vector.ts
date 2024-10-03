import fuzzysort from 'fuzzysort'
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
    const d = fuzzysort
      .go(question, currentDocs, {
        threshold: 0,
        all: true,
        keys: [
          'pageContent',
          'metadata.image.title',
          'metadata.image.loc',
          'metadata.loc',
          'title',
          'description',
          'body',
        ],
      })
      .map((x) => ({ score: x.score, ...x }))
      .slice(0, vectorLimit)

    const sortedResults = d
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, vectorLimit)
      .map((v) => {
        const { score, obj } = v
        return obj
      })

    // anthropic doesn't have it's own text embedding model
    // so we'll just use fuzzysort directly
    if (isAnthropic) {
      console.log(`[vector] anthropic - skip vector & use fuzzysort directly`)
      return sortedResults
    } else {
      console.log(`[vector] feeding store with ${sortedResults.length} results`)

      const documents = sortedResults.map((result: any) => ({
        pageContent: JSON.stringify(
          result.description || result.body || result.pageContent || result,
        ).substring(0, 5000),
        metadata: result.metadata || result,
      }))

      try {
        const hnsw = await HNSWLib.fromDocuments(
          documents,
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
        return sortedResults
      }
    }
  } catch {
    console.log('[vector] error encountered while querying vector')
    return []
  }
}
