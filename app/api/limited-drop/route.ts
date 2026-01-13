import { NextResponse } from 'next/server'
import { getActiveLimitedDrop, updateLimitedDropTimers, sanityClient } from '@/lib/sanity'

// Calculate the current countdown value based on elapsed time
function calculateCurrentValue(
  startValue: number,
  intervalSeconds: number,
  startedAt: string
): number {
  const now = Date.now()
  const started = new Date(startedAt).getTime()
  const elapsedMs = now - started

  if (elapsedMs < 0) {
    return startValue
  }

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const ticksElapsed = Math.floor(elapsedSeconds / intervalSeconds)
  const currentValue = Math.max(0, startValue - ticksElapsed)
  return currentValue
}

// GET - Fetch active limited drop with calculated current values
export async function GET() {
  try {
    const drop = await getActiveLimitedDrop()

    if (!drop) {
      return NextResponse.json({ drop: null })
    }

    // If drop has started, calculate current values based on elapsed time
    if (drop.startedAt && drop.sizeTimers) {
      const updatedTimers = drop.sizeTimers.map((timer) => {
        const currentValue = calculateCurrentValue(
          timer.startValue,
          timer.intervalSeconds,
          drop.startedAt!
        )
        return {
          ...timer,
          currentValue,
          soldOut: currentValue <= 0,
        }
      })

      const allSoldOut = updatedTimers.every((t) => t.soldOut)

      return NextResponse.json({
        drop: {
          ...drop,
          sizeTimers: updatedTimers,
          allSoldOut,
        },
      })
    }

    return NextResponse.json({ drop })
  } catch (error) {
    console.error('Error fetching limited drop:', error)
    return NextResponse.json(
      { error: 'Failed to fetch limited drop' },
      { status: 500 }
    )
  }
}
