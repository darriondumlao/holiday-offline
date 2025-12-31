import { NextResponse } from 'next/server'
import { getTickerMessages } from '@/lib/sanity'

export async function GET() {
  try {
    const messages = await getTickerMessages()

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching ticker messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticker messages' },
      { status: 500 }
    )
  }
}
