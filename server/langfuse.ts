import { Langfuse } from 'langfuse'

export const langfuse = new Langfuse({
  publicKey: process.env.VITE_LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.VITE_LANGFUSE_SECRET_KEY,
  baseUrl: process.env.VITE_LANGFUSE_BASEURL ?? undefined,
})

// langfuse.debug()

export default langfuse
