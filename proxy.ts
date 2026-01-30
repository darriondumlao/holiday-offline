/**
 * Next.js 16 Proxy
 *
 * This file replaces the deprecated middleware.ts convention.
 * It runs at the network boundary before requests reach your application.
 *
 * Rate limiting disabled to save Redis commands.
 * Re-enable if needed by uncommenting the rate limiting code.
 */

import { NextResponse, NextRequest } from 'next/server'

export async function proxy(_request: NextRequest) {
  // Rate limiting disabled - using too many Redis commands
  // Shopify has its own rate limiting, Sanity has caching
  return NextResponse.next()
}

// Configure which paths the proxy runs on
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}
