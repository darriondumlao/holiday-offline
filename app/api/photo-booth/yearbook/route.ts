import { NextRequest, NextResponse } from 'next/server'
import { getApprovedYearbookPhotos, getApprovedYearbookCount } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const start = (page - 1) * limit
    const end = start + limit

    const [photos, total] = await Promise.all([
      getApprovedYearbookPhotos(start, end),
      getApprovedYearbookCount(),
    ])

    return NextResponse.json(
      {
        photos,
        total,
        hasMore: end < total,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
