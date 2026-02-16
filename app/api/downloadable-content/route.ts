import { NextResponse } from 'next/server'
import { getDownloadableContent } from '@/lib/sanity'

// Cache for 1 hour, revalidated on-demand via webhook
export const revalidate = 3600

export async function GET() {
  try {
    const content = await getDownloadableContent()

    if (!content) {
      return NextResponse.json({ content: null })
    }

    // Get the file URL from Sanity
    const fileUrl = content.downloadableFile?.asset?.url || null

    // Get the original filename and extension
    const originalFilename = content.downloadableFile?.asset?.originalFilename || null
    const extension = originalFilename ? originalFilename.split('.').pop() : null

    return NextResponse.json(
      {
        content: {
          title: content.title,
          questionText: content.questionText,
          fileUrl,
          downloadFileName: content.downloadFileName,
          fileExtension: extension,
          delaySeconds: content.delaySeconds,
        },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    )
  } catch (error) {
    console.error('Error fetching downloadable content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch downloadable content' },
      { status: 500 }
    )
  }
}
