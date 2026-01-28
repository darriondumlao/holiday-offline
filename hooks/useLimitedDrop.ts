'use client'

import { useState, useEffect } from 'react'

interface LimitedDropData {
  isActive: boolean
  startedAt: string | null
  dropName?: string
}

export function useLimitedDrop() {
  const [dropData, setDropData] = useState<LimitedDropData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLimitedDrop() {
      try {
        const response = await fetch('/api/limited-drop')
        if (!response.ok) {
          throw new Error('Failed to fetch limited drop')
        }
        const data = await response.json()

        if (data.drop) {
          setDropData({
            isActive: data.drop.isActive ?? false,
            startedAt: data.drop.startedAt ?? null,
            dropName: data.drop.dropName,
          })
        } else {
          setDropData(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setDropData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLimitedDrop()

    // Poll every 60 seconds to check for updates from Sanity
    // Reduced from 30s to minimize API calls and improve performance
    const interval = setInterval(fetchLimitedDrop, 60000)

    return () => clearInterval(interval)
  }, [])

  return {
    isActive: dropData?.isActive ?? false,
    startedAt: dropData?.startedAt ?? null,
    dropName: dropData?.dropName,
    loading,
    error,
  }
}
