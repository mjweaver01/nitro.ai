import type { Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  const { user } = await req.json()

  if (!user || user.email !== 'mjweaver01@gmail.com') {
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
