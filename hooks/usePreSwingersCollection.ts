'use client'

import { useState, useEffect } from 'react'
import { Product, fetchCollectionClient } from '@/lib/shopify'

interface PreSwingersCollectionData {
  products: Product[]
  loading: boolean
  error: string | null
}

export function usePreSwingersCollection(): PreSwingersCollectionData {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true)
        const collectionProducts = await fetchCollectionClient('pre-swingers')
        setProducts(collectionProducts)
        setError(null)
      } catch (err) {
        console.error('Error fetching pre-swingers collection:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch collection')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [])

  return { products, loading, error }
}
