import { NextResponse } from 'next/server'
import { getActiveOverlays } from '@/lib/sanity'

export async function GET() {
  try {
    const overlays = await getActiveOverlays()

    return NextResponse.json(
      { overlays },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching photo booth overlays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overlays' },
      { status: 500 }
    )
  }
}
