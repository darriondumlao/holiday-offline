import { NextResponse } from 'next/server'
import { getActiveSiteAudio } from '@/lib/sanity'

export async function GET() {
  try {
    const audio = await getActiveSiteAudio()

    if (!audio) {
      return NextResponse.json({ audio: null })
    }

    return NextResponse.json({ audio })
  } catch (error) {
    console.error('Error fetching site audio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site audio' },
      { status: 500 }
    )
  }
}
