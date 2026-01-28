import { NextResponse } from 'next/server'
import { getActiveLimitedDrop } from '@/lib/sanity'
import { unstable_cache } from 'next/cache'

// Cache limited drop data for 30 seconds
// This reduces Sanity API calls while still being responsive to drop activations
const getCachedLimitedDrop = unstable_cache(
  async () => {
    return getActiveLimitedDrop()
  },
  ['limited-drop'],
  {
    revalidate: 30, // 30 seconds cache
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
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
          startedAt: drop.startedAt,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
