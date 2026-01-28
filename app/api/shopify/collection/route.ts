/**
 * API Route: /api/shopify/collection
 *
 * Fetches products from a specific Shopify collection by handle.
 * Usage: GET /api/shopify/collection?handle=offline
 *
 * Caching: 5 minute cache with stale-while-revalidate for optimal performance
 */

import { fetchProductsByCollection } from '@/lib/shopify'
import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

// Cache collection data for 5 minutes, revalidate in background
const getCachedCollection = unstable_cache(
  async (handle: string) => {
    return fetchProductsByCollection(handle)
  },
  ['shopify-collection'],
  {
    revalidate: 300, // 5 minutes
    tags: ['shopify', 'collection'],
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const handle = searchParams.get('handle')

    if (!handle) {
      return NextResponse.json(
        { error: 'Missing collection handle parameter' },
        { status: 400 }
      )
    }

    const products = await getCachedCollection(handle)

    // Add cache headers for CDN/browser caching
    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('[API/collection] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    )
  }
}
