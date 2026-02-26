/**
 * Next.js 16 Proxy
 *
 * Runs at the network boundary before requests reach your application.
 * Gates ALL API routes behind site-auth cookie, except the auth endpoint itself.
 */

import { NextResponse, NextRequest } from 'next/server'

const COOKIE_NAME = 'site-auth'

async function validateCookie(cookieValue: string): Promise<boolean> {
  try {
    const secret = process.env.SITE_AUTH_SECRET || 'hldy-site-auth-key'
    const password = process.env.SITE_PASSWORD || 'h0lid4yv26pt2'

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(password))
    const expected = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (cookieValue.length !== expected.length) return false
    let mismatch = 0
    for (let i = 0; i < cookieValue.length; i++) {
      mismatch |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return mismatch === 0
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the auth endpoint through without a cookie
  if (pathname === '/api/site-auth') {
    return NextResponse.next()
  }

  // Gate all other API routes
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await validateCookie(token))) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
