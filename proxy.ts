/**
 * Next.js 16 Proxy - Rate Limiting & Shop Password Protection
 *
 * This file replaces the deprecated middleware.ts convention.
 * It runs at the network boundary before requests reach your application.
 */

import { NextResponse, NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiters for different endpoints
// Using sliding window for smoother rate limiting

// Strict limit for checkout (prevent bot abuse)
const checkoutLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 checkouts per minute per IP
  analytics: true,
  prefix: 'ratelimit:checkout',
})

// Moderate limit for form submissions
const formLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 submissions per minute per IP
  analytics: true,
  prefix: 'ratelimit:form',
})

// Relaxed limit for general API calls
const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute per IP
  analytics: true,
  prefix: 'ratelimit:api',
})

// Cookie name for shop authentication
const SHOP_AUTH_COOKIE = 'shop_authenticated'

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return '127.0.0.1'
}

/**
 * Apply rate limiting and return response if limited
 */
async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string,
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    return null // Not rate limited
  } catch {
    // If Redis fails, allow the request (fail open for availability)
    return null
  }
}

/**
 * Check if shop password is required and validate
 */
function checkShopAuth(request: NextRequest): NextResponse | null {
  const shopPassword = process.env.SHOP_PASSWORD

  // If no password is set, shop is open
  if (!shopPassword) {
    return null
  }

  // Check if already authenticated via cookie
  const authCookie = request.cookies.get(SHOP_AUTH_COOKIE)
  if (authCookie?.value === 'true') {
    return null
  }

  // Not authenticated - return 401 with instructions
  return NextResponse.json(
    {
      error: 'Shop access requires authentication',
      requiresPassword: true
    },
    { status: 401 }
  )
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method
  const clientIP = getClientIP(request)

  // =========================================
  // RATE LIMITING FOR API ROUTES
  // =========================================

  // Checkout endpoint - strictest limits
  if (pathname === '/api/shopify/checkout' && method === 'POST') {
    const rateLimitResponse = await applyRateLimit(checkoutLimiter, `checkout:${clientIP}`, request)
    if (rateLimitResponse) return rateLimitResponse
  }

  // Form submission endpoints - moderate limits
  if (
    (pathname === '/api/subscribe' && method === 'POST') ||
    (pathname === '/api/submit-answer' && method === 'POST')
  ) {
    const rateLimitResponse = await applyRateLimit(formLimiter, `form:${clientIP}`, request)
    if (rateLimitResponse) return rateLimitResponse
  }

  // General API endpoints - relaxed limits
  // Exclude limited-drop from rate limiting (high-frequency polling, low-risk endpoint)
  if (pathname.startsWith('/api/') && method === 'GET' && pathname !== '/api/limited-drop') {
    const rateLimitResponse = await applyRateLimit(apiLimiter, `api:${clientIP}`, request)
    if (rateLimitResponse) return rateLimitResponse
  }

  // =========================================
  // SHOP PASSWORD PROTECTION
  // =========================================

  // Only protect the 'offline' collection (the shop) - other collections are public
  if (pathname === '/api/shopify/collection') {
    const handle = request.nextUrl.searchParams.get('handle')
    // Only protect the 'offline' collection which is the shop
    if (handle === 'offline') {
      const authResponse = checkShopAuth(request)
      if (authResponse) return authResponse
    }
  }

  // Protect checkout endpoint (requires shop access)
  if (pathname === '/api/shopify/checkout') {
    const authResponse = checkShopAuth(request)
    if (authResponse) return authResponse
  }

  // Continue to the application
  return NextResponse.next()
}

// Configure which paths the proxy runs on
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}
