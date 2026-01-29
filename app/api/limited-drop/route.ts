import { NextResponse } from 'next/server'
import { getActiveLimitedDrop } from '@/lib/sanity'
import { unstable_cache } from 'next/cache'

// Cache limited drop data for 5 seconds only
// Short cache ensures drops appear almost immediately when activated
const getCachedLimitedDrop = unstable_cache(
  async () => {
    return getActiveLimitedDrop()
  },
  ['limited-drop'],
  {
    revalidate: 5, // 5 seconds cache - fast refresh
    tags: ['sanity', 'limited-drop'],
  }
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
            'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
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
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
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
