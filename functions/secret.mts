import type { Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  const { secret } = await req.json()

  if (!secret || secret !== process.env.VITE_SITE_SECRET) {
    return Response.json({
      code: 401,
      message: 'Unauthorized',
      error: true,
    })
  } else {
    return Response.json({
      code: 200,
      message: 'Authorized',
      error: false,
    })
  }
}
