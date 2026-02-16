'use client'

import { useState, useEffect } from 'react'
import { Product, fetchCollectionClient } from '@/lib/shopify'

interface ShopifyCollectionData {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useShopifyCollection(
  handle: string,
  sortFn?: (products: Product[]) => Product[]
): ShopifyCollectionData {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true)
        const collectionProducts = await fetchCollectionClient(handle)
        const finalProducts = sortFn ? sortFn(collectionProducts) : collectionProducts
        setProducts(finalProducts)
        setError(null)
      } catch (err) {
        console.error(`Error fetching ${handle} collection:`, err)
        setError(err instanceof Error ? err.message : 'Failed to fetch collection')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [handle])

  return { products, loading, error }
}

// Swingers collection sort order
const SWINGERS_PRODUCT_ORDER = [
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

export function sortSwingersProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()

    const aIndex = SWINGERS_PRODUCT_ORDER.findIndex(keyword => aName.includes(keyword.toLowerCase()))
    const bIndex = SWINGERS_PRODUCT_ORDER.findIndex(keyword => bName.includes(keyword.toLowerCase()))

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })
}
