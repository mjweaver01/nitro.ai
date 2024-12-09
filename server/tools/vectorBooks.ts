import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import { compiledBooksToolPrompt } from '../prompts'
import langfuse from '../clients/langfuse'

const openai = new OpenAI()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Vector store functions
export async function initVectorStore() {
  // Note: Assumes you've already run the SQL setup commands
  console.log('[vectorBooks] Initialized vector store')
}

export async function clearVectorStore() {
  await supabase.from('books_vector_store').delete().neq('id', 0)
  console.log('[vectorBooks] Cleared vector store')
}

export async function seedVectorStore(onProgress?: (message: string) => void) {
  try {
    const booksDir = path.join(process.cwd(), 'books')
    const files = await fs.readdir(booksDir)
    let chunkCount = 0

    onProgress?.('[vectorBooks] Starting vector store seeding...')

    for (const file of files) {
      if (!file.endsWith('.txt')) continue

      onProgress?.(`[vectorBooks] Processing ${file}...`)

      const content = await fs.readFile(path.join(booksDir, file), 'utf-8')
      const title = file.replace('.txt', '')

      const sections = content.split(/\n\n+/).filter((section) => section.trim().length > 0)

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim()

        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: section,
        })

        await supabase.from('books_vector_store').insert({
          title,
          content: section,
          page_number: Math.floor(i / 2) + 1,
          embedding: embedding.data[0].embedding,
        })

        chunkCount++

        if (i % 10 === 0) {
          onProgress?.(`[vectorBooks] Processed ${chunkCount} chunks...`)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    onProgress?.(`[vectorBooks] Completed seeding with ${chunkCount} chunks`)
  } catch (error) {
    console.error('[vectorBooks] Error seeding vector store:', error)
    throw error
  }
}

async function vectorSearch(query: string): Promise<any[]> {
  try {
    // Get embedding for the query
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    // Search in Supabase
    const { data: results, error } = await supabase.rpc('match_books', {
      query_embedding: embedding.data[0].embedding,
      match_threshold: 0.7,
      match_count: 3,
    })

    if (error) throw error

    return results.map((result) => ({
      content: result.content,
      source: `Book: ${result.title}${result.page_number ? ` (Page ${result.page_number})` : ''}`,
      type: 'book_content',
      score: result.similarity,
    }))
  } catch (error) {
    console.error('[vectorBooks] Search error:', error)
    throw error
  }
}

// The vector books tool definition
export const vectorBooksTool = {
  name: 'vector_books',
  type: 'function',
  description: compiledBooksToolPrompt,
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
      name: 'vector_books_tool',
      input: JSON.stringify(question),
      model: 'vector_books',
    })

    await generation.update({
      completionStartTime: new Date(),
    })

    try {
      const results = await vectorSearch(question)

      if (results.length > 0) {
        console.log(`[vectorBooks] found ${results.length} relevant passages`)
        await generation.end({
          output: JSON.stringify(results[0]),
          level: 'DEFAULT',
        })
        return results
      } else {
        const noResultsResponse = {
          content:
            "I couldn't find any specific information about this in our books. " +
            'Would you like me to recommend some relevant Westside Barbell books on this topic instead?',
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
          "I apologize, but I'm having trouble searching through the book content right now. " +
          'Would you like to ask about something else?',
        source: 'error',
        type: 'error',
      }

      await generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })
      console.error('[vectorBooks] error in vector books tool:', error)
      return [errorResponse]
    } finally {
      await langfuse.shutdownAsync()
    }
  },
}

/*
-- Enable the vector extension
create extension if not exists vector;

-- Create the books vector store table
create table if not exists books_vector_store (
  id bigint generated by default as identity primary key,
  title text,
  content text,
  page_number integer,
  embedding vector(1536)
);

-- Create a function to match books
create or replace function match_books (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  content text,
  page_number integer,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    books_vector_store.id,
    books_vector_store.title,
    books_vector_store.content,
    books_vector_store.page_number,
    1 - (books_vector_store.embedding <=> query_embedding) as similarity
  from books_vector_store
  where 1 - (books_vector_store.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
*/
