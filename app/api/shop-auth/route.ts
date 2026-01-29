/**
 * API Route: /api/shop-auth
 *
 * Handles shop password authentication.
 * Sets a session cookie when the correct password is provided.
 */

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

const SHOP_AUTH_COOKIE = 'shop_authenticated'

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)

    // If lengths differ, create same-length buffers to maintain constant time
    if (bufA.length !== bufB.length) {
      // Still do the comparison to maintain constant time
      const paddedB = Buffer.alloc(bufA.length)
      bufB.copy(paddedB, 0, 0, Math.min(bufB.length, bufA.length))
      timingSafeEqual(bufA, paddedB)
      return false
    }

    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Parse cookies from header string safely
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim()
    }
  })

  return cookies
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const { password } = await request.json()
    const correctPassword = process.env.SHOP_PASSWORD

    // If no password is configured, shop is open
    if (!correctPassword) {
      console.log('[API/shop-auth] POST - Shop is open (no password configured)')
      const response = NextResponse.json({ success: true, message: 'Shop is open' })
      return response
    }

    // Validate password using timing-safe comparison
    if (!password || !secureCompare(password, correctPassword)) {
      const duration = Date.now() - startTime
      console.log(`[API/shop-auth] POST - Incorrect password attempt (${duration}ms)`)
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Password correct - set authentication cookie
    const duration = Date.now() - startTime
    console.log(`[API/shop-auth] POST - Access granted (${duration}ms)`)
    const response = NextResponse.json({ success: true, message: 'Access granted' })

    // Set cookie that expires when browser closes (session cookie)
    // HttpOnly prevents JavaScript access, Secure ensures HTTPS only in production
    response.cookies.set(SHOP_AUTH_COOKIE, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // No maxAge = session cookie (cleared when browser closes)
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}

export async function GET(request: Request) {
  // Check if user is authenticated using proper cookie parsing
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies(cookieHeader)
  const isAuthenticated = cookies[SHOP_AUTH_COOKIE] === 'true'
  const shopPassword = process.env.SHOP_PASSWORD

  return NextResponse.json({
    isAuthenticated,
    requiresPassword: !!shopPassword,
  })
}

export async function DELETE() {
  // Logout - clear the authentication cookie
  const response = NextResponse.json({ success: true, message: 'Logged out' })

  response.cookies.set(SHOP_AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Immediately expire the cookie
  })

  return response
}
