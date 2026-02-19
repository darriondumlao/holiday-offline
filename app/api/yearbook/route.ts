import { NextResponse } from 'next/server'
import { getApprovedYearbookPhotos } from '@/lib/sanity'

// Cache for 1 hour, revalidated on-demand via webhook
export const revalidate = 3600

export async function GET() {
  try {
    const photos = await getApprovedYearbookPhotos()

    const images = photos.map((photo) => ({
      url: photo.imageUrl,
      alt: 'Yearbook photo',
    }))

    return NextResponse.json(
      { images },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching yearbook photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch yearbook photos' },
      { status: 500 }
    )
  }
}
