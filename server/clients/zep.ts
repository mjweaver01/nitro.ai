import { ZepClient } from '@getzep/zep-cloud'
import { ZepMemory } from '@getzep/zep-cloud/langchain/zep_memory.js'

export const zep = new ZepClient({
  apiKey: process.env.VITE_ZEP_KEY,
})

export const zepMemory = (sessionId: string) =>
  new ZepMemory({
    apiKey: process.env.VITE_ZEP_KEY,
    sessionId,
  })

export const getZepResults = async (question: string) => {
  try {
    const { results: zepResults } = await zep.memory.searchSessions({
      text: question,
      searchType: 'similarity',
      searchScope: 'facts',
    })

    console.log(`[zep] found ${zepResults.length} result${zepResults.length !== 1 ? 's' : ''}`)

    return zepResults
  } catch (e) {
    console.log(`[zep] error with zep search`)
    console.log(JSON.stringify(e))

    return []
  }
}

export const saveToZep = async (sessionId: string, newMessages: any[]) => {
  try {
    await zep.memory.add(sessionId, {
      messages: newMessages.map((m) => ({
        ...m,
        roleType: m.role === 'ai' ? 'assistant' : 'user',
      })),
    })

    console.log(`[zep] updated zep memory on ${sessionId}`)
  } catch {
    console.log('[zep] could not save to zep')
  }
}
