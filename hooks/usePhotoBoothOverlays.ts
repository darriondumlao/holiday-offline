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

// Local overlays for testing — swap back to Sanity fetch when ready
const LOCAL_OVERLAYS: Overlay[] = [
  {
    _id: 'local-filterwork',
    name: 'Filter Work',
    imageUrl: '/opact.png',
    order: 0,
  },
]

export default function usePhotoBoothOverlays(): UsePhotoBoothOverlaysReturn {
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Use local overlays for now instead of fetching from Sanity
    setOverlays(LOCAL_OVERLAYS)
    setLoading(false)
  }, [])

  return { overlays, loading, error }
}
