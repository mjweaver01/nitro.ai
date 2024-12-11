import { seedVectorStore } from '../server/tools/vectorBooks'
import { clearVectorStore } from '../server/tools/vectorBooks'
import type { Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  // Handle GET request (status check) first
  if (req.method === 'GET') {
    try {
      // Create a ReadableStream for SSE
      const stream = new ReadableStream({
        start(controller) {
          const send = (data: any) => {
            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
          }

          seedVectorStore((progress: string) => {
            send({ message: progress })
          }).then(() => {
            send({ message: 'Seeding complete', complete: true })
            controller.close()
          })
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    } catch (error) {
      return Response.json({ error: 'Failed to get seeding status' }, { status: 500 })
    }
  }

  // For POST requests, validate the body
  if (req.method === 'POST') {
    try {
      // Check if request has a body
      const body = await req.text()
      if (!body) {
        return Response.json({
          code: 400,
          message: 'Missing request body',
          error: true,
        })
      }

      // Parse the JSON body
      let { user, action } = JSON.parse(body)

      // Validate required fields
      if (!user) {
        return Response.json({
          code: 401,
          message: 'Unauthorized',
          error: true,
        })
      }

      if (!action) {
        return Response.json({
          code: 400,
          message: 'Missing action parameter',
          error: true,
        })
      }

      if (action === 'clear') {
        await clearVectorStore()
        return Response.json({ message: 'Vector store cleared successfully' })
      } else if (action === 'seed') {
        seedVectorStore()
        return Response.json({ message: 'Seeding process started' })
      } else {
        return Response.json({ error: 'Invalid action. Use "seed" or "clear"' }, { status: 400 })
      }
    } catch (error) {
      return Response.json({
        code: 400,
        message: 'Invalid JSON in request body',
        error: true,
      })
    }
  }

  // Handle unsupported methods
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
