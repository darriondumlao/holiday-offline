# Ticker Header Setup Guide

## Overview
The ticker header is a stock exchange-style scrolling text component that displays messages from the **holiday4nick Sanity project**. It updates in real-time and allows admins to manage content easily.

## Setup Instructions

### 1. Get Your Sanity API Token
The ticker messages are stored in the **holiday4nick** Sanity project (Project ID: `uq9s8one`).

1. Go to [manage.sanity.io](https://manage.sanity.io/)
2. Select the **holiday4nick** project
3. Go to **API** → **Tokens**
4. Click **Add API token**
5. Name it (e.g., "Holiday Landing Ticker Access")
6. Set permissions to **Viewer** (read-only is sufficient)
7. Copy the token (you won't see it again!)

### 2. Configure Environment Variables
Add this to your `.env.local` file:

```bash
SANITY_API_TOKEN=your-api-token-here
```

The project ID (`uq9s8one`) and dataset (`production`) are already configured in the code.

**Note:** If you already have an API token for the holiday4nick project, you can use the same one!

### 3. Access the Sanity Studio
The ticker content type is managed in the **holiday4nick** project:

1. Navigate to the holiday4nick project: `cd /Users/dios/Code/holiday4nick-nextjs`
2. Start the dev server: `npm run dev`
3. Go to: `http://localhost:3000/studio`
4. Sign in with your Sanity account
5. You'll see the **Ticker** content type

### 4. Add Ticker Messages
1. In the Studio, click **Ticker**
2. Click **Create new Ticker**
3. Fill in:
   - **Ticker Text**: Your ticker text (max 200 characters)
   - **Active**: Toggle on to display (off to hide)
   - **Display Order**: Lower numbers appear first (e.g., 0, 1, 2)
   - **Published at**: Auto-filled with current date/time
4. Click **Publish**

### 5. Managing Content
- **Add messages**: Create new ticker messages in the Studio
- **Edit messages**: Click any message to edit
- **Reorder messages**: Change the "Display Order" number
- **Hide messages**: Toggle "Active" off (keeps message but hides it)
- **Delete messages**: Click the menu (•••) → Delete

## Features

### Ticker Animation
- Smooth infinite scroll animation
- Automatically loops through all active messages
- Pauses on hover for easy reading
- Scrolls at 30 seconds per full cycle

### Real-time Updates
- Fetches new content every 30 seconds
- No page refresh needed
- Seamless content updates

### Message Management
- Multiple messages supported
- Separator: " • " between messages
- Order control via "Display Order" field
- Active/inactive toggle

## Giving Admin Access

To give someone admin access to update the ticker:

1. Go to [manage.sanity.io](https://manage.sanity.io/)
2. Select the **holiday4nick** project
3. Go to **Members**
4. Click **Invite members**
5. Enter their email
6. Set role to **Editor** or **Administrator**
7. They'll receive an email invitation

They can then:
- Access the studio by running the holiday4nick project locally and going to `/studio`
- Or use [manage.sanity.io](https://manage.sanity.io/) to access the studio directly

## Customization

### Change Animation Speed
Edit `/app/globals.css` line 202:
```css
animation: ticker-scroll 30s linear infinite; /* Change 30s to your desired speed */
```

### Change Ticker Style
Edit `/components/TickerHeader.tsx`:
- Colors: Change `bg-black`, `border-gray-800`, `text-white`
- Font size: Change `text-sm`
- Padding: Change `py-2`

### Change Polling Interval
Edit `/components/TickerHeader.tsx` line 28:
```typescript
const interval = setInterval(fetchMessages, 30000) // Change 30000 (30s) to your desired interval in ms
```

## Troubleshooting

### Ticker not showing
1. Check you have active messages in Sanity Studio
2. Verify environment variables are set correctly
3. Check browser console for errors

### Studio won't load
1. Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` is correct
2. Make sure you're logged into Sanity in your browser
3. Clear browser cache and reload

### Messages not updating
1. Check API token has Editor permissions
2. Verify messages are marked as "Active" in Studio
3. Check browser console for API errors

## API Endpoint

The ticker fetches data from: `/api/ticker`

Returns:
```json
{
  "messages": [
    {
      "_id": "message-id",
      "text": "Your message here",
      "isActive": true,
      "order": 0,
      "_createdAt": "2024-01-01T00:00:00Z",
      "_updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Using Holiday4Nick Sanity Project

This project is connected to the **holiday4nick** Sanity project (Project ID: `uq9s8one`), giving you access to all its content types.

### Available Content from Holiday4Nick

1. **Lookbooks** - Fashion lookbook collections with photos
2. **Radio** - Audio mixes and radio episodes
3. **YouTube** - Video content organized by episode
4. **Staff** - Team member profiles
5. **Collabs** - Collaboration projects with Shopify integration
6. **Press** - Press mentions and features
7. **Archive** - Historical content organized by year/season

### Setup

1. **Add environment variable** for the API token in `.env.local`:
```bash
HOLIDAY4NICK_API_TOKEN=your-holiday4nick-api-token
```

2. **Get the API token**:
   - Go to [manage.sanity.io](https://manage.sanity.io/)
   - Select the "holiday4nick" project
   - Go to **API** → **Tokens**
   - Create a new token with **Viewer** permissions (read-only)
   - Copy the token to your `.env.local`

### Using the Data

**Option 1: Use the pre-built query functions** (recommended):

```typescript
import {
  getLookbooks,
  getRadioMixes,
  getYouTubeVideos,
  getStaff,
  getCollabs,
  getPressItems,
  getArchiveItems
} from '@/lib/sanity'

// In your component or API route
const lookbooks = await getLookbooks()
const radio = await getRadioMixes()
const videos = await getYouTubeVideos()
```

**Option 2: Use the API endpoint**:

```typescript
// Fetch from the API route
const response = await fetch('/api/external-data?type=lookbooks')
const { data } = await response.json()
```

Available types: `lookbooks`, `radio`, `youtube`, `staff`, `collabs`, `press`, `archive`

**Option 3: Direct client queries**:

```typescript
import { holiday4nickClient } from '@/lib/sanity'

// Custom GROQ query
const data = await holiday4nickClient.fetch(
  `*[_type == "lookbook"] | order(publishedAt desc) {
    title,
    slug,
    coverImage
  }`
)
```

### Example: Display Latest Lookbook in Ticker

You could dynamically update the ticker with the latest lookbook title:

```typescript
// In an API route or server component
import { getLookbooks } from '@/lib/sanity'

const lookbooks = await getLookbooks()
const latest = lookbooks[0]
const tickerMessage = `New Lookbook: ${latest.title} - ${latest.season} ${latest.year}`
```

### Note on Editing

- The `/studio` route only edits **ticker messages** (this project's schema)
- To edit holiday4nick content (lookbooks, radio, etc.):
  - Use the holiday4nick Studio at `holiday4nick-nextjs/studio`
  - Or go to [manage.sanity.io](https://manage.sanity.io/) and select the holiday4nick project

### Content Types Reference

**Lookbook**:
```typescript
{
  _id: string
  title: string
  slug: { current: string }
  coverImage: SanityImage
  description?: string
  season?: string
  year?: number
  photos?: SanityImage[]
}
```

**Radio**:
```typescript
{
  _id: string
  title: string
  artist?: string
  genre?: string
  audioUrl?: string
  duration?: string
}
```

**YouTube**:
```typescript
{
  _id: string
  title: string
  videoUrl: string
  videoId?: string
  episodeNumber?: number
  category?: string
}
```

See `/lib/sanity.ts` for complete TypeScript interfaces for all content types.
