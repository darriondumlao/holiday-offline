import { NextResponse } from 'next/server'
import { getTickerMessages } from '@/lib/sanity'

// Cache for 1 hour, revalidated on-demand via webhook
export const revalidate = 3600

export async function GET() {
  try {
    const messages = await getTickerMessages()

    return NextResponse.json(
      { messages },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    )
  } catch (error) {
    console.error('Error fetching ticker messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticker messages' },
      { status: 500 }
    )
  }
}
