'use client'

import { useState, useEffect } from 'react'

interface Overlay {
  _id: string
  name: string
  imageUrl: string
  order: number
}

interface UsePhotoBoothOverlaysReturn {
  overlays: Overlay[]
  loading: boolean
  error: string | null
}

export default function usePhotoBoothOverlays(): UsePhotoBoothOverlaysReturn {
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverlays = async () => {
      try {
        const response = await fetch('/api/photo-booth/overlays')
        if (!response.ok) {
          throw new Error('Failed to fetch overlays')
        }
        const data = await response.json()
        setOverlays(data.overlays || [])
      } catch (err) {
        console.error('Error fetching overlays:', err)
        setError('Failed to load overlays')
      } finally {
        setLoading(false)
      }
    }

    fetchOverlays()
  }, [])

  return { overlays, loading, error }
}
