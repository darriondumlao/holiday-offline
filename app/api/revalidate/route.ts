import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

export async function POST(request: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody(
      request,
      process.env.SANITY_WEBHOOK_SECRET
    )

    if (!isValidSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    // Revalidate all cached API routes
    revalidatePath('/api/ticker')
    revalidatePath('/api/site-audio')
    revalidatePath('/api/downloadable-content')
    revalidatePath('/api/slideshow')

    return Response.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Error revalidating:', error)
    return new Response('Error revalidating', { status: 500 })
  }
}
