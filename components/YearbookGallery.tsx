'use client'

import { useState, useEffect, useCallback } from 'react'

interface YearbookPhoto {
  _id: string
  name: string | null
  imageUrl: string
  submittedAt: string
}

interface YearbookGalleryProps {
  isVisible: boolean
}

export default function YearbookGallery({ isVisible }: YearbookGalleryProps) {
  const [photos, setPhotos] = useState<YearbookPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchPhotos = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/photo-booth/yearbook?page=${pageNum}&limit=20`
      )
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()

      if (append) {
        setPhotos((prev) => [...prev, ...data.photos])
      } else {
        setPhotos(data.photos)
      }
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Error fetching yearbook photos:', err)
      setError('Failed to load yearbook photos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isVisible) {
      fetchPhotos(1)
    }
  }, [isVisible, fetchPhotos])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPhotos(nextPage, true)
  }

  if (!isVisible) return null

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h2 className="font-bebas text-white text-3xl tracking-wider text-center mb-6">
        Yearbook
      </h2>

      {error && (
        <p className="text-yellow-500 text-sm text-center mb-4">{error}</p>
      )}

      {photos.length === 0 && !loading && (
        <p className="text-gray-500 text-sm text-center">
          No photos in the yearbook yet. Be the first!
        </p>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <div key={photo._id} className="group">
            <div className="aspect-[3/4] bg-gray-900 rounded overflow-hidden border border-gray-800">
              <img
                src={photo.imageUrl}
                alt={photo.name || 'Yearbook photo'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {photo.name && (
              <p className="text-gray-400 text-xs text-center mt-1 truncate">
                {photo.name}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-6 text-sm border border-gray-600 rounded disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? 'loading...' : `load more (${total - photos.length} remaining)`}
          </button>
        </div>
      )}

      {loading && photos.length === 0 && (
        <div className="flex justify-center py-8">
          <p className="text-gray-500 text-sm">loading yearbook...</p>
        </div>
      )}
    </div>
  )
}
