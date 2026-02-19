import { createClient } from '@sanity/client'

// Sanity client (for holiday4nick project - ticker, lookbooks, radio, etc.)
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'uq9s8one',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-12-04',
  useCdn: true, // Serve from edge cache; updates propagate via /api/revalidate webhook
  token: process.env.SANITY_API_TOKEN,
})

// Alias for clarity when using holiday4nick data
export const holiday4nickClient = sanityClient

// Write client for mutations (uploads, document creation)
// useCdn must be false for write operations
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'uq9s8one',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-12-04',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Ticker Message Interface
export interface TickerMessage {
  _id: string
  text: string
  isActive: boolean
  order: number
  _createdAt: string
  _updatedAt: string
}

// Downloadable Content Interface
export interface DownloadableContent {
  _id: string
  title: string
  questionText: string
  downloadableFile: any
  downloadFileName: string
  isActive: boolean
  delaySeconds: number
}

// Holiday4Nick Schema Interfaces
export interface Lookbook {
  _id: string
  title: string
  slug: { current: string }
  coverImage: any
  description?: string
  season?: string
  year?: number
  photos?: any[]
  _createdAt: string
}

export interface Radio {
  _id: string
  title: string
  slug: { current: string }
  coverImage?: any
  description?: string
  audioUrl?: string
  audioFile?: any
  duration?: string
  genre?: string
  artist?: string
  _createdAt: string
}

export interface YouTube {
  _id: string
  title: string
  slug: { current: string }
  thumbnail?: any
  videoUrl: string
  videoId?: string
  description?: string
  duration?: string
  episodeNumber?: number
  category?: string
  _createdAt: string
}

export interface Staff {
  _id: string
  name: string
  tagline: string
  location: string
  image?: any
  url?: string
  _createdAt: string
}

export interface Collab {
  _id: string
  name: string
  slug: { current: string }
  coverImage?: any
  collectionHandle?: string
  description?: string
  _createdAt: string
}

export interface Press {
  _id: string
  title: string
  url: string
  image?: any
  publishedAt?: string
  _createdAt: string
}

export interface Archive {
  _id: string
  title: string
  images?: any[]
  year?: number
  season?: string
  order?: number
  _createdAt: string
}

// Holiday4Nick Query Functions
export async function getLookbooks(): Promise<Lookbook[]> {
  return holiday4nickClient.fetch(
    `*[_type == "lookbook"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      coverImage,
      description,
      season,
      year,
      "photoCount": count(photos),
      _createdAt
    }`
  )
}

export async function getRadioMixes(): Promise<Radio[]> {
  return holiday4nickClient.fetch(
    `*[_type == "radio"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      coverImage,
      description,
      audioUrl,
      audioFile,
      duration,
      genre,
      artist,
      _createdAt
    }`
  )
}

export async function getYouTubeVideos(): Promise<YouTube[]> {
  return holiday4nickClient.fetch(
    `*[_type == "youtube"] | order(episodeNumber asc) {
      _id,
      title,
      slug,
      thumbnail,
      videoUrl,
      videoId,
      description,
      duration,
      episodeNumber,
      category,
      _createdAt
    }`
  )
}

export async function getStaff(): Promise<Staff[]> {
  return holiday4nickClient.fetch(
    `*[_type == "staff"] | order(name asc) {
      _id,
      name,
      tagline,
      location,
      image,
      url,
      _createdAt
    }`
  )
}

export async function getCollabs(): Promise<Collab[]> {
  return holiday4nickClient.fetch(
    `*[_type == "collab"] | order(publishedAt desc) {
      _id,
      name,
      slug,
      coverImage,
      collectionHandle,
      description,
      _createdAt
    }`
  )
}

export async function getPressItems(): Promise<Press[]> {
  return holiday4nickClient.fetch(
    `*[_type == "press"] | order(_createdAt desc) {
      _id,
      title,
      url,
      image,
      publishedAt,
      _createdAt
    }`
  )
}

export async function getArchiveItems(): Promise<Archive[]> {
  return holiday4nickClient.fetch(
    `*[_type == "archive"] | order(order asc, year desc) {
      _id,
      title,
      images,
      year,
      season,
      order,
      _createdAt
    }`
  )
}

// Get ticker messages from holiday4nick project
export async function getTickerMessages(): Promise<TickerMessage[]> {
  return holiday4nickClient.fetch(
    `*[_type == "ticker" && isActive == true] | order(order asc) {
      _id,
      text,
      isActive,
      order,
      _createdAt,
      _updatedAt
    }`
  )
}

// Get active downloadable content modal
export async function getDownloadableContent(): Promise<DownloadableContent | null> {
  const results = await sanityClient.fetch(
    `*[_type == "downloadableContent" && isActive == true] | order(_createdAt desc) [0] {
      _id,
      title,
      questionText,
      downloadableFile {
        asset-> {
          _ref,
          originalFilename,
          url
        }
      },
      downloadFileName,
      isActive,
      delaySeconds
    }`
  )
  return results || null
}

// Site Audio Interface
export interface SiteAudio {
  _id: string
  title: string
  audioUrl: string
  isActive: boolean
}

// Get active site background audio
export async function getActiveSiteAudio(): Promise<SiteAudio | null> {
  const results = await sanityClient.fetch(
    `*[_type == "siteAudio" && isActive == true] | order(_createdAt desc) [0] {
      _id,
      title,
      "audioUrl": audioFile.asset->url,
      isActive
    }`
  )
  return results || null
}

// Yearbook Photo Interface
export interface YearbookPhoto {
  _id: string
  imageUrl: string
  _createdAt: string
}

// Get approved yearbook photos
export async function getApprovedYearbookPhotos(): Promise<YearbookPhoto[]> {
  return sanityClient.fetch(
    `*[_type == "yearbookPhoto" && approved == true] | order(_createdAt desc) {
      _id,
      "imageUrl": image.asset->url,
      _createdAt
    }`
  )
}
