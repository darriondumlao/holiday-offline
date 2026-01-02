import { NextResponse } from 'next/server'
import { getDownloadableContent, urlFor } from '@/lib/sanity'

export async function GET() {
  try {
    const content = await getDownloadableContent()

    if (!content) {
      return NextResponse.json({ content: null })
    }

    // Build the image URL
    const imageUrl = content.downloadableImage
      ? urlFor(content.downloadableImage).url()
      : null

    return NextResponse.json({
      content: {
        title: content.title,
        questionText: content.questionText,
        imageUrl,
        downloadFileName: content.downloadFileName,
        delaySeconds: content.delaySeconds,
      },
    })
  } catch (error) {
    console.error('Error fetching downloadable content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch downloadable content' },
      { status: 500 }
    )
  }
}
