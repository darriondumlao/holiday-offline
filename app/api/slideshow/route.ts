import { NextResponse } from 'next/server'
import { holiday4nickClient } from '@/lib/sanity'

// Cache for 1 hour, revalidated on-demand via webhook
export const revalidate = 3600

export async function GET() {
  try {
    // Fetch offline slideshow 1 images from holiday4nick project
    const slideshowItems = await holiday4nickClient.fetch(
      `*[_type == "offlineSlideshow1" && isActive == true] | order(order asc) {
        _id,
        title,
        images[] {
          asset-> {
            _id,
            url
          },
          alt,
          caption
        }
      }`
    )

    if (!slideshowItems || slideshowItems.length === 0) {
      return NextResponse.json({ images: [] })
    }

    // Flatten all images from all slideshow items into a single array
    const allImages = slideshowItems.flatMap((item: any) =>
      item.images.map((img: any) => ({
        url: img.asset?.url || '',
        alt: img.alt || img.caption || `${item.title || 'Slideshow'} image`,
      }))
    )

    return NextResponse.json(
      { images: allImages },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    )
  } catch (error) {
    console.error('Error fetching slideshow images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch slideshow images' },
      { status: 500 }
    )
  }
}
