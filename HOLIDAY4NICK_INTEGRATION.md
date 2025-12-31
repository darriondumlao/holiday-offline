# Holiday4Nick Integration Guide

## Quick Start

The holiday-landing project is now connected to your **holiday4nick-nextjs** Sanity project!

### What You Have Access To

All 7 content types from holiday4nick:
- ✅ Lookbooks (fashion collections)
- ✅ Radio (audio mixes)
- ✅ YouTube (video episodes)
- ✅ Staff (team members)
- ✅ Collabs (collaborations)
- ✅ Press (media mentions)
- ✅ Archive (historical content)

## Setup (One-Time)

1. Get an API token from the holiday4nick project:
   - Go to [manage.sanity.io](https://manage.sanity.io/)
   - Select "holiday4nick" project
   - API → Tokens → Add API token
   - Set permissions to **Viewer** (read-only is fine)
   - Copy the token

2. Add to `.env.local`:
```bash
HOLIDAY4NICK_API_TOKEN=sk_your_token_here
```

That's it! The project ID (`uq9s8one`) is already configured.

## How to Use

### Method 1: Pre-built Functions (Easiest)

```typescript
import { getLookbooks, getRadioMixes, getYouTubeVideos } from '@/lib/sanity'

// In any server component or API route
export default async function MyPage() {
  const lookbooks = await getLookbooks()
  const radio = await getRadioMixes()

  return (
    <div>
      <h1>Latest Lookbook: {lookbooks[0].title}</h1>
      <h2>Latest Radio Mix: {radio[0].title}</h2>
    </div>
  )
}
```

Available functions:
- `getLookbooks()` → All lookbooks (newest first)
- `getRadioMixes()` → All radio content (newest first)
- `getYouTubeVideos()` → All videos (by episode number)
- `getStaff()` → All staff (alphabetical)
- `getCollabs()` → All collaborations (newest first)
- `getPressItems()` → All press (newest first)
- `getArchiveItems()` → All archive (by order, then year)

### Method 2: API Endpoint

```typescript
// Client-side fetching
const response = await fetch('/api/external-data?type=lookbooks')
const { data } = await response.json()

console.log(data) // Array of lookbooks
```

Available query params:
- `?type=lookbooks`
- `?type=radio`
- `?type=youtube`
- `?type=staff`
- `?type=collabs`
- `?type=press`
- `?type=archive`

### Method 3: Custom Queries

```typescript
import { holiday4nickClient } from '@/lib/sanity'

// Write your own GROQ query
const customData = await holiday4nickClient.fetch(
  `*[_type == "lookbook" && season == "SS25"] {
    title,
    coverImage,
    photos
  }`
)
```

## Common Use Cases

### 1. Show Latest Lookbook in Ticker

```typescript
// In a server component or API route
import { getLookbooks } from '@/lib/sanity'

const lookbooks = await getLookbooks()
const latest = lookbooks[0]
const message = `NEW: ${latest.title} ${latest.season} ${latest.year}`

// Add this message to your ticker
```

### 2. Display Staff Members

```typescript
import { getStaff } from '@/lib/sanity'

export default async function StaffSection() {
  const staff = await getStaff()

  return (
    <div>
      {staff.map(person => (
        <div key={person._id}>
          <h3>{person.name}</h3>
          <p>{person.tagline}</p>
          <p>{person.location}</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. List Recent Press

```typescript
import { getPressItems } from '@/lib/sanity'

export default async function PressPage() {
  const press = await getPressItems()

  return (
    <ul>
      {press.map(item => (
        <li key={item._id}>
          <a href={item.url}>{item.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

### 4. Embed YouTube Videos

```typescript
import { getYouTubeVideos } from '@/lib/sanity'

export default async function VideosPage() {
  const videos = await getYouTubeVideos()

  return (
    <div>
      {videos.map(video => (
        <iframe
          key={video._id}
          src={`https://www.youtube.com/embed/${video.videoId}`}
          title={video.title}
        />
      ))}
    </div>
  )
}
```

## TypeScript Support

All content types have full TypeScript interfaces in `/lib/sanity.ts`:

```typescript
import type { Lookbook, Radio, YouTube, Staff, Collab, Press, Archive } from '@/lib/sanity'

// Your functions will be fully typed
const handleLookbook = (lookbook: Lookbook) => {
  // TypeScript knows all the fields!
  console.log(lookbook.title)
  console.log(lookbook.season)
  console.log(lookbook.year)
}
```

## Important Notes

1. **Read-Only**: You can only read data from holiday4nick, not write/edit
2. **Editing**: To edit content, use the holiday4nick Studio or manage.sanity.io
3. **Real-Time**: Set `useCdn: false` for real-time updates (already configured)
4. **API Token**: Keep your token in `.env.local` (never commit it!)

## Testing

Test that it works by creating a simple API route:

```typescript
// app/api/test-holiday4nick/route.ts
import { NextResponse } from 'next/server'
import { getLookbooks } from '@/lib/sanity'

export async function GET() {
  try {
    const lookbooks = await getLookbooks()
    return NextResponse.json({
      success: true,
      count: lookbooks.length,
      latest: lookbooks[0]
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
```

Then visit: `http://localhost:3000/api/test-holiday4nick`

## Need Help?

Check the existing holiday4nick project at `/Users/dios/Code/holiday4nick-nextjs` to see how queries are structured and what data is available.
