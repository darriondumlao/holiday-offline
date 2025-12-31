import { NextResponse } from 'next/server'
import {
  getLookbooks,
  getRadioMixes,
  getYouTubeVideos,
  getStaff,
  getCollabs,
  getPressItems,
  getArchiveItems
} from '@/lib/sanity'

// Fetch data from holiday4nick Sanity project
// Available endpoints:
// /api/external-data?type=lookbooks
// /api/external-data?type=radio
// /api/external-data?type=youtube
// /api/external-data?type=staff
// /api/external-data?type=collabs
// /api/external-data?type=press
// /api/external-data?type=archive

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'lookbooks'

    let data
    switch (type) {
      case 'lookbooks':
        data = await getLookbooks()
        break
      case 'radio':
        data = await getRadioMixes()
        break
      case 'youtube':
        data = await getYouTubeVideos()
        break
      case 'staff':
        data = await getStaff()
        break
      case 'collabs':
        data = await getCollabs()
        break
      case 'press':
        data = await getPressItems()
        break
      case 'archive':
        data = await getArchiveItems()
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({ data, type })
  } catch (error) {
    console.error('Error fetching holiday4nick data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from holiday4nick project' },
      { status: 500 }
    )
  }
}
