'use client'

import { useState, useEffect } from 'react'
import { Product, fetchCollectionClient } from '@/lib/shopify'

// Product name mappings to modal slots
const PRODUCT_MAPPINGS = {
  hoodie01: 'campus hoodie (purdue)',
  hoodie02: 'campus hoodie (south harmon)',
  hoodie03: 'campus hoodie (baylor)',
  shoe: '"dream-on" rambo',
  passwordProduct: 'anniversary hat',
  teeShirt: 'anniversary $9 tee',
  coyoteBag: 'coyote bag',
} as const

type ProductSlot = keyof typeof PRODUCT_MAPPINGS

interface NineYearCollectionData {
  products: Record<ProductSlot, Product | null>
  loading: boolean
  error: string | null
}

export function useNineYearCollection(): NineYearCollectionData {
  const [products, setProducts] = useState<Record<ProductSlot, Product | null>>({
    hoodie01: null,
    hoodie02: null,
    hoodie03: null,
    shoe: null,
    passwordProduct: null,
    teeShirt: null,
    coyoteBag: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true)
        const collectionProducts = await fetchCollectionClient('nine-year')

        // Map products to their slots based on title matching
        const mappedProducts: Record<ProductSlot, Product | null> = {
          hoodie01: null,
          hoodie02: null,
          hoodie03: null,
          shoe: null,
          passwordProduct: null,
          teeShirt: null,
          coyoteBag: null,
        }

        for (const product of collectionProducts) {
          const titleLower = product.title.toLowerCase()

          for (const [slot, searchTerm] of Object.entries(PRODUCT_MAPPINGS)) {
            if (titleLower.includes(searchTerm.toLowerCase())) {
              mappedProducts[slot as ProductSlot] = product
              break
            }
          }
        }

        setProducts(mappedProducts)
        setError(null)
      } catch (err) {
        console.error('Error fetching nine-year collection:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch collection')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [])

  return { products, loading, error }
}
