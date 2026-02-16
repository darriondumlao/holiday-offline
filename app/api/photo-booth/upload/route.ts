import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { sanityClient } from '@/lib/sanity'

// Rate limiter: 3 uploads per 24 hours per identifier
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '24 h'),
      prefix: 'pb-upload',
    })
  : null

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

// Sanitize name input
function sanitizeName(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 50)
}

// Get identifier for rate limiting
function getIdentifier(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const cookies = request.headers.get('cookie') || ''
  const fpMatch = cookies.match(/pb_fp=([^;]+)/)
  const fingerprint = fpMatch ? fpMatch[1] : ''

  return fingerprint ? `${ip}:${fingerprint}` : ip
}

export async function POST(request: NextRequest) {
  try {
    // Check required env vars
    if (!process.env.SANITY_API_TOKEN) {
      console.error('Missing SANITY_API_TOKEN')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Rate limiting
    if (ratelimit) {
      const identifier = getIdentifier(request)
      const { success, limit, reset, remaining } = await ratelimit.limit(
        identifier
      )

      if (!success) {
        return NextResponse.json(
          { error: 'Upload limit reached. Try again in 24 hours.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            },
          }
        )
      }
    }

    // Parse multipart form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const nameRaw = (formData.get('name') as string) || ''

    // Validate image
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Only JPEG and PNG are allowed.' },
        { status: 400 }
      )
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Sanitize name
    const name = sanitizeName(nameRaw)

    // Convert file to buffer for Sanity upload
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload image asset to Sanity
    const asset = await sanityClient.assets.upload('image', buffer, {
      filename: `yearbook-${Date.now()}.jpg`,
      contentType: imageFile.type,
    })

    // Create yearbookPhoto document
    const document = await sanityClient.create({
      _type: 'yearbookPhoto',
      photo: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      },
      name: name || undefined,
      approved: false,
      submittedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      documentId: document._id,
    })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
