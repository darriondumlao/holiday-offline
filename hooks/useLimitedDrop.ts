'use client'

import { useState, useEffect } from 'react'

interface LimitedDropData {
  isActive: boolean
  manualSoldOut: boolean
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
            manualSoldOut: data.drop.manualSoldOut ?? false,
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

    // Poll every 15 seconds to check for updates from Sanity
    // Balances responsiveness with API usage limits
    const interval = setInterval(fetchLimitedDrop, 15000)

    return () => clearInterval(interval)
  }, [])

  return {
    isActive: dropData?.isActive ?? false,
    manualSoldOut: dropData?.manualSoldOut ?? false,
    startedAt: dropData?.startedAt ?? null,
    dropName: dropData?.dropName,
    loading,
    error,
  }
}
