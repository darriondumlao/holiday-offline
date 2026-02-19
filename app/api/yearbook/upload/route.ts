import { NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity'

export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('photo') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be under 5MB' },
        { status: 400 }
      )
    }

    // Upload image asset to Sanity
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await sanityWriteClient.assets.upload('image', buffer, {
      filename: `yearbook-${Date.now()}.jpg`,
    })

    // Create unapproved yearbookPhoto document
    await sanityWriteClient.create({
      _type: 'yearbookPhoto',
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      },
      approved: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error uploading yearbook photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
