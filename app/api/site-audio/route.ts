import { NextResponse } from 'next/server'
import { getActiveSiteAudio } from '@/lib/sanity'

// Cache for 1 hour, revalidated on-demand via webhook
export const revalidate = 3600

export async function GET() {
  try {
    const audio = await getActiveSiteAudio()

    if (!audio) {
      return NextResponse.json({ audio: null })
    }

    return NextResponse.json(
      { audio },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    )
  } catch (error) {
    console.error('Error fetching site audio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site audio' },
      { status: 500 }
    )
  }
}
