import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  // Verify the webhook secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  try {
    // Revalidate all cached API routes
    revalidatePath('/api/ticker')
    revalidatePath('/api/site-audio')
    revalidatePath('/api/downloadable-content')
    revalidatePath('/api/slideshow')

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Error revalidating:', error)
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
