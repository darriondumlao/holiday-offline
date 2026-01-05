'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface VariantAvailability {
  id?: string
  size: string
  available: number | null
  sold?: number
  color?: string
}

interface ProductData {
  title: string
  price: number
  imageUrl: string
  variants: VariantAvailability[]
  shopifyCheckoutUrl?: string
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProductModal({ isOpen, onClose }: ProductModalProps) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const colorPalette = ['#ef4444', '#f59e0b', '#fbbf24', '#22c55e', '#10b981', '#0ea5e9']

  const fallbackProduct: ProductData = {
    title: 'new item available',
    price: 30,
    imageUrl: '/h.png',
    shopifyCheckoutUrl: '',
    variants: [
      { size: 'small', available: 8, sold: 2, color: colorPalette[0] },
      { size: 'medium', available: 6, sold: 1, color: colorPalette[3] },
      { size: 'large', available: 4, sold: 0, color: colorPalette[5] },
    ],
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('/api/product')
        const data = await response.json()

        if (data.product) {
          const mappedProduct: ProductData = {
            title: data.product.title || data.product.name || fallbackProduct.title,
            price: Number(data.product.price) || fallbackProduct.price,
            imageUrl:
              data.product.imageUrl ||
              data.product.images?.[0]?.url ||
              fallbackProduct.imageUrl,
            shopifyCheckoutUrl: data.product.shopifyCheckoutUrl || '',
            variants:
              data.product.variants ||
              data.product.sizes?.map((size: string, idx: number) => ({
                size,
                available: null,
                sold: 0,
                color: colorPalette[idx % colorPalette.length],
              })) ||
              fallbackProduct.variants,
          }

          setProduct(mappedProduct)
          if (mappedProduct.variants && mappedProduct.variants.length > 0) {
            setSelectedSize(mappedProduct.variants[0].size)
          }
        } else {
          setProduct(fallbackProduct)
          setSelectedSize(fallbackProduct.variants[0].size)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setProduct(fallbackProduct)
        setSelectedSize(fallbackProduct.variants[0].size)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchProduct()
    }
  }, [isOpen])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleCheckout = () => {
    if (!product || !selectedSize) return
    const variant = product.variants.find((v) => v.size === selectedSize)
    const checkoutUrl = product.shopifyCheckoutUrl
      ? `${product.shopifyCheckoutUrl}?variant=${variant?.id || selectedSize}`
      : '#'
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }

  const formatPrice = (price: number) => {
    if (!price && price !== 0) return ''
    const dollars = Math.floor(price)
    return `$${dollars}`
  }

  const getBlocks = (variant: VariantAvailability) => {
    if (variant.available == null) return []
    const sold = variant.sold || 0
    const total = Math.max(variant.available + sold, 0)
    return Array.from({ length: total }, (_, idx) => idx < sold ? 'sold' : 'available')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Dark Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-[#f2ede6] border-4 border-[#1565d8] shadow-[0_12px_0_#0a3c99,0_-4px_0_#0a3c99] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-b from-[#3490ff] to-[#0a54c1] text-black px-4 py-3 border-b-4 border-[#0a3c99]">
            <div className="text-xl md:text-2xl font-mono tracking-wide lowercase">
              {product?.title || 'new item'} ({formatPrice(product?.price || 0)})
            </div>
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 active:translate-y-[1px] text-white rounded-sm px-2 py-1 border-2 border-white shadow-[2px_2px_0_#0a3c99]"
              aria-label="Close modal"
            >
              X
            </button>
          </div>

          {/* Content */}
          {loading || !product ? (
            <div className="flex items-center justify-center py-16 text-black font-mono tracking-wider">
              Loading product...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500 font-mono tracking-wider">
              {error}
            </div>
          ) : (
            <div className="p-6 md:p-8 space-y-6">
              {/* Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[360px] aspect-square bg-[#e7e0d6] border-2 border-[#bfb6a6] shadow-inner">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Inventory by size */}
              <div className="space-y-4">
                {product.variants
                  .filter((v) => v.available != null)
                  .map((variant, idx) => {
                    const blocks = getBlocks(variant)
                    if (blocks.length === 0) return null

                    const sold = variant.sold || 0
                    const total = blocks.length
                    const availableColor =
                      variant.color || colorPalette[idx % colorPalette.length]

                    return (
                      <div key={variant.size} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 flex items-center gap-1 flex-wrap">
                            {blocks.map((status, blockIdx) => (
                              <div
                                key={blockIdx}
                                className="w-5 h-4 border border-black/30"
                                style={{
                                  backgroundColor:
                                    status === 'sold' ? '#d1d5db' : availableColor,
                                }}
                              />
                            ))}
                          </div>
                          <div className="text-xs font-mono text-black/70 min-w-[68px] text-right">
                            {sold}/{total} SOLD
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedSize(variant.size)}
                            className={`flex-1 px-4 py-2 border-2 border-black text-lg font-mono lowercase shadow-[2px_2px_0_#bfb6a6] transition-all ${
                              selectedSize === variant.size
                                ? 'bg-white'
                                : 'bg-[#e7e0d6] hover:bg-white'
                            }`}
                          >
                            {variant.size}
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Checkout */}
              <div className="pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={!selectedSize}
                  className="w-full bg-[#e7e0d6] hover:bg-white active:translate-y-[1px] border-2 border-black text-black font-mono text-lg py-3 shadow-[3px_3px_0_#bfb6a6] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to cart & checkout
                </button>
                <p className="text-center text-xs text-black/60 font-mono mt-2">
                  Checkout opens a new tab
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
