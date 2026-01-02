import { NextResponse } from 'next/server'
import { getDownloadableContent } from '@/lib/sanity'

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

    return NextResponse.json({
      content: {
        title: content.title,
        questionText: content.questionText,
        fileUrl,
        downloadFileName: content.downloadFileName,
        fileExtension: extension,
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
