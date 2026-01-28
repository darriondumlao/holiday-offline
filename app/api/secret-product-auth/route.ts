/**
 * API Route: /api/secret-product-auth
 *
 * Handles secret product password verification.
 * The password is never exposed to the client.
 */

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

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

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const correctPassword = process.env.SECRET_PRODUCT_PASSWORD

    // If no password is configured, use default
    if (!correctPassword) {
      // Fallback password if env var not set
      if (password === 'holiday') {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ success: false }, { status: 401 })
    }

    // Validate password using timing-safe comparison
    if (!password || !secureCompare(password, correctPassword)) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
