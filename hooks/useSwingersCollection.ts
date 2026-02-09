'use client'

import { useState, useEffect } from 'react'
import { Product, fetchCollectionClient } from '@/lib/shopify'

interface SwingersCollectionData {
  products: Product[]
  loading: boolean
  error: string | null
}

// Define the exact product order we want (9 products + cart = 10 total)
const PRODUCT_ORDER = [
  'hldy zip grey',
  'melrose swinger jean',
  'baseball raglan',
  'logo tee',
  'come together tee',
  'varsity red',
  'syrup logo thermal',
  'distressed trucker hat',
  '+ more',
]

function sortProductsByOrder(products: Product[]): Product[] {
  return products.sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()

    // Find the index in our order list (check if product name contains the keyword)
    const aIndex = PRODUCT_ORDER.findIndex(keyword => aName.includes(keyword.toLowerCase()))
    const bIndex = PRODUCT_ORDER.findIndex(keyword => bName.includes(keyword.toLowerCase()))

    // If both found, sort by order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }
    // If only a is found, a comes first
    if (aIndex !== -1) return -1
    // If only b is found, b comes first
    if (bIndex !== -1) return 1
    // If neither found, keep original order
    return 0
  })
}

export function useSwingersCollection(): SwingersCollectionData {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true)
        const collectionProducts = await fetchCollectionClient('swingers')
        const sortedProducts = sortProductsByOrder(collectionProducts)
        setProducts(sortedProducts)
        setError(null)
      } catch (err) {
        console.error('Error fetching swingers collection:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch collection')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [])

  return { products, loading, error }
}
