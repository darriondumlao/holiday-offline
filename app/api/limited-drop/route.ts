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
  const startTime = Date.now()

  try {
    const drop = await getCachedLimitedDrop()
    const duration = Date.now() - startTime

    if (!drop) {
      // Only log occasionally to avoid spam (roughly 1 in 20 requests)
      if (Math.random() < 0.05) {
        console.log(`[API/limited-drop] No active drop (${duration}ms)`)
      }
      return NextResponse.json(
        { drop: null },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      )
    }

    // Log when drop is active (more important to track)
    if (drop.isActive && Math.random() < 0.1) {
      console.log(`[API/limited-drop] Active drop: ${drop.dropName}, manualSoldOut: ${drop.manualSoldOut}, startedAt: ${drop.startedAt ? 'yes' : 'no'} (${duration}ms)`)
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
    const duration = Date.now() - startTime
    console.error(`[API/limited-drop] Error after ${duration}ms:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch limited drop' },
      { status: 500 }
    )
  }
}
