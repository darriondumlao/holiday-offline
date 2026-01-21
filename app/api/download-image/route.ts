import { NextRequest, NextResponse } from 'next/server'

// Allowed domains for image downloads (prevent SSRF)
const ALLOWED_DOMAINS = [
  'cdn.sanity.io',
  'images.unsplash.com',
  'sanity.io',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Block private/internal IPs
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('169.254.') ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // Only allow HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Check against whitelist
    return ALLOWED_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const fileName = searchParams.get('fileName') || 'download'

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Validate URL against whitelist
    if (!isAllowedUrl(imageUrl)) {
      return NextResponse.json(
        { error: 'Invalid image source' },
        { status: 400 }
      )
    }

    // Fetch the image from allowed CDN (server-side, no CORS issues)
    const imageResponse = await fetch(imageUrl)

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: imageResponse.status }
      )
    }

    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer()

    // Return the image with proper headers for download
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}.jpg"`,
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading image:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  }
}

