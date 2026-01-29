import { NextResponse } from 'next/server'
import { getActiveLimitedDrop } from '@/lib/sanity'
import { unstable_cache } from 'next/cache'

// Cache for 10 seconds - balances freshness with API usage
const getCachedLimitedDrop = unstable_cache(
  async () => getActiveLimitedDrop(),
  ['limited-drop'],
  { revalidate: 10 }
)

// GET - Fetch active limited drop
export async function GET() {
  try {
    const drop = await getCachedLimitedDrop()

    if (!drop) {
      return NextResponse.json(
        { drop: null },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    // Return only the fields needed for the timer
    return NextResponse.json(
      {
        drop: {
          dropName: drop.dropName,
          isActive: drop.isActive,
          manualSoldOut: drop.manualSoldOut ?? false,
          startedAt: drop.startedAt,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching limited drop:', error)
    return NextResponse.json(
      { error: 'Failed to fetch limited drop' },
      { status: 500 }
    )
  }
}
