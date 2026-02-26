import { NextResponse } from 'next/server'
import { timingSafeEqual, createHmac } from 'crypto'

const COOKIE_NAME = 'site-auth'
const COOKIE_MAX_AGE = 60 * 60 // 1 hour

function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) {
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

export function generateAuthToken(password: string): string {
  const secret = process.env.SITE_AUTH_SECRET || 'hldy-site-auth-key'
  return createHmac('sha256', secret).update(password).digest('hex')
}

function getPassword(): string {
  return process.env.SITE_PASSWORD || 'h0lid4yv26pt2'
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const correctPassword = getPassword()

    if (!password || !secureCompare(password, correctPassword)) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const token = generateAuthToken(correctPassword)
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return response
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
    const token = match?.[1]

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const expected = generateAuthToken(getPassword())
    if (secureCompare(token, expected)) {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
