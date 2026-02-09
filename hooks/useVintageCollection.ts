'use client'

import { useState, useEffect } from 'react'
import { Product, fetchCollectionClient } from '@/lib/shopify'

interface VintageCollectionData {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useVintageCollection(): VintageCollectionData {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true)
        const collectionProducts = await fetchCollectionClient('vintage')
        setProducts(collectionProducts)
        setError(null)
      } catch (err) {
        console.error('Error fetching vintage collection:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch collection')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [])

  return { products, loading, error }
}
