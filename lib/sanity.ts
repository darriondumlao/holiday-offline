import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// Sanity client (for holiday4nick project - ticker, lookbooks, radio, etc.)
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'uq9s8one',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-12-04',
  useCdn: false, // Use false for real-time updates
  token: process.env.SANITY_API_TOKEN,
})

// Image URL builder
const builder = imageUrlBuilder(sanityClient)
export function urlFor(source: any) {
  return builder.image(source)
}

export { imageUrlBuilder }

// Alias for clarity when using holiday4nick data
export const holiday4nickClient = sanityClient

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
  downloadableImage: any
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
      downloadableImage,
      downloadFileName,
      isActive,
      delaySeconds
    }`
  )
  return results || null
}
