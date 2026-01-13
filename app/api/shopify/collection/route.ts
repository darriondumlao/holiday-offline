/**
 * API Route: /api/shopify/collection
 *
 * Fetches products from a specific Shopify collection by handle.
 * Usage: GET /api/shopify/collection?handle=offline
 */

import { fetchProductsByCollection } from '@/lib/shopify'
import { NextRequest, NextResponse } from 'next/server'

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

    const products = await fetchProductsByCollection(handle)

    return NextResponse.json({ products })
  } catch (error) {
    console.error('[API/collection] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to fetch collection', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
