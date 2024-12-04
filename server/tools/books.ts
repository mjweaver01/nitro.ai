import fuzzysort from 'fuzzysort'
import fs from 'fs/promises'
import path from 'path'
import langfuse from '../clients/langfuse'

interface BookChunk {
  title: string
  content: string
  pageNumber?: number
}

let bookChunks: BookChunk[] = []

// Load and chunk books on startup
export const loadBooks = async () => {
  try {
    const booksDir = path.join(process.cwd(), 'books')
    const files = await fs.readdir(booksDir)
    
    for (const file of files) {
      if (!file.endsWith('.txt')) continue
      
      const content = await fs.readFile(path.join(booksDir, file), 'utf-8')
      const title = file.replace('.txt', '')
      
      // Split into paragraphs/sections
      const sections = content
        .split(/\n\n+/)
        .filter(section => section.trim().length > 0)
      
      // Create chunks with context
      sections.forEach((section, index) => {
        bookChunks.push({
          title,
          content: section.trim(),
          pageNumber: Math.floor(index / 2) + 1 // Rough page number estimation
        })
      })
    }
    
    console.log(`[books] Loaded ${bookChunks.length} chunks from ${files.length} books`)
  } catch (error) {
    console.error('[books] Error loading books:', error)
    bookChunks = []
  }
}

// Search function
const searchBooks = async (query: string): Promise<any[]> => {
  if (bookChunks.length === 0) {
    await loadBooks()
  }

  // Perform fuzzy search across all chunks
  const results = fuzzysort.go(query, bookChunks, {
    key: 'content',
    limit: 3,
    threshold: -10000 // Adjust this to control match sensitivity
  })

  return results.map(result => ({
    content: result.obj.content,
    source: `Book: ${result.obj.title}${result.obj.pageNumber ? ` (Page ${result.obj.pageNumber})` : ''}`,
    type: 'book_content',
    score: result.score
  }))
}

// The actual tool definition
export const booksTool = {
  name: 'books',
  type: 'function',
  description: `This tool searches through Westside Barbell's book content to find relevant information and quotes. 
                Use it when you need specific information from Louie's books or want to reference book content.`,
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The question or topic to search for in the book content',
      },
    },
    required: ['question'],
  },
  function: async (question: string) => {
    const generation = await langfuse.generation({
      name: 'books_tool',
      input: JSON.stringify(question),
      model: 'books',
    })

    await generation.update({
      completionStartTime: new Date(),
    })

    try {
      const results = await searchBooks(question)

      if (results.length > 0) {
        console.log(`[books] found ${results.length} relevant passages`)
        await generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })
        return results
      } else {
        const noResultsResponse = {
          content: "I couldn't find any specific information about this in our books. " +
                  "Would you like me to recommend some relevant Westside Barbell books on this topic instead?",
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
        content: "I apologize, but I'm having trouble searching through the book content right now. " +
                "Would you like to ask about something else?",
        source: 'error',
        type: 'error'
      }
      
      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })
      console.error('[books] error in books tool:', error)
      return [errorResponse]
    } finally {
      await langfuse.shutdownAsync()
    }
  }
} 