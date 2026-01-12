import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  // Verify the webhook secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  try {
    // Revalidate the ticker API route
    revalidatePath('/api/ticker')

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Error revalidating:', error)
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
