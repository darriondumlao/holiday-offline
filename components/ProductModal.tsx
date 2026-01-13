'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import RetroLoader from './RetroLoader'

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

interface SizeTimer {
  _key: string
  size: string
  intervalSeconds: number
  startValue: number
  currentValue?: number
  soldOut: boolean
}

interface LimitedDrop {
  _id: string
  dropName: string
  isActive: boolean
  startedAt?: string
  sizeTimers: SizeTimer[]
  allSoldOut?: boolean
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
  const [limitedDrop, setLimitedDrop] = useState<LimitedDrop | null>(null)
  const [countdowns, setCountdowns] = useState<Record<string, number>>({})
  const timerIntervalsRef = useRef<NodeJS.Timeout[]>([])

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

  // Clear all intervals on cleanup
  useEffect(() => {
    return () => {
      timerIntervalsRef.current.forEach(clearInterval)
      timerIntervalsRef.current = []
    }
  }, [])

  // Fetch product and limited drop data
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)

      // Fetch product
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
      }

      // Fetch limited drop
      try {
        const response = await fetch('/api/limited-drop')
        const data = await response.json()

        if (data.drop && data.drop.sizeTimers) {
          setLimitedDrop(data.drop)

          // Initialize countdowns from the API response
          const initialCountdowns: Record<string, number> = {}
          data.drop.sizeTimers.forEach((timer: SizeTimer) => {
            initialCountdowns[timer.size.toLowerCase()] = timer.currentValue ?? timer.startValue
          })
          setCountdowns(initialCountdowns)

          // Clear existing intervals
          timerIntervalsRef.current.forEach(clearInterval)
          timerIntervalsRef.current = []

          // Start countdown intervals for each size
          data.drop.sizeTimers.forEach((timer: SizeTimer) => {
            if (timer.soldOut || (timer.currentValue !== undefined && timer.currentValue <= 0)) return

            const interval = setInterval(() => {
              setCountdowns(prev => {
                const key = timer.size.toLowerCase()
                const currentVal = prev[key] ?? 0
                const newVal = Math.max(0, currentVal - 1)
                return { ...prev, [key]: newVal }
              })
            }, timer.intervalSeconds * 1000)

            timerIntervalsRef.current.push(interval)
          })
        }
      } catch (err) {
        console.error('Error fetching limited drop:', err)
      }

      setLoading(false)
    }

    fetchData()

    // Cleanup intervals when modal closes
    return () => {
      timerIntervalsRef.current.forEach(clearInterval)
      timerIntervalsRef.current = []
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

  // Check if a size is sold out (countdown reached 0)
  const isSizeSoldOut = (size: string): boolean => {
    if (!limitedDrop) return false
    const sizeKey = size.toLowerCase()
    const countdownValue = countdowns[sizeKey]

    if (countdownValue !== undefined) {
      return countdownValue <= 0
    }

    // Fall back to checking the limitedDrop data
    const timer = limitedDrop.sizeTimers?.find(t => t.size.toLowerCase() === sizeKey)
    if (timer) {
      return timer.soldOut || (timer.currentValue !== undefined && timer.currentValue <= 0)
    }

    return false
  }

  // Get countdown value for a size
  const getCountdownValue = (size: string): number | null => {
    if (!limitedDrop) return null

    const sizeKey = size.toLowerCase()
    const countdownValue = countdowns[sizeKey]

    if (countdownValue !== undefined) {
      return countdownValue
    }

    const timer = limitedDrop.sizeTimers?.find(t => t.size.toLowerCase() === sizeKey)
    if (timer) {
      return timer.currentValue ?? timer.startValue
    }

    return null
  }

  // Check if all sizes are sold out
  const allSizesSoldOut = (): boolean => {
    if (!product?.variants || !limitedDrop) return false
    return product.variants.every(v => isSizeSoldOut(v.size))
  }

  const handleCheckout = () => {
    if (!product || !selectedSize) return

    // Check if selected size is sold out
    if (isSizeSoldOut(selectedSize)) {
      return
    }

    const variant = product.variants.find(v => v.size === selectedSize)
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
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RetroLoader size="lg" />
              <span className="text-black font-mono tracking-wider">Loading product...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500 font-mono tracking-wider">
              {error}
            </div>
          ) : allSizesSoldOut() ? (
            // All sizes sold out view
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[360px] aspect-square bg-[#e7e0d6] border-2 border-[#bfb6a6] shadow-inner opacity-50 grayscale">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="text-center py-8">
                <div className="text-4xl font-mono text-red-600 mb-4">SOLD OUT</div>
                <p className="text-black/60 font-mono text-sm">
                  This limited edition drop has ended.
                </p>
                <p className="text-black/40 font-mono text-xs mt-2">
                  All sizes are no longer available.
                </p>
              </div>
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

              {/* Limited Drop Banner */}
              {limitedDrop && (
                <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 text-center font-mono text-sm rounded">
                  <span className="animate-pulse">LIMITED DROP</span> - Act fast, quantities are running out!
                </div>
              )}

              {/* Inventory by size */}
              <div className="space-y-4">
                {product.variants.map((variant, idx) => {
                  const blocks = getBlocks(variant)
                  const countdownValue = getCountdownValue(variant.size)
                  const soldOut = isSizeSoldOut(variant.size)

                  const sold = variant.sold || 0
                  const total = blocks.length
                  const availableColor =
                    variant.color || colorPalette[idx % colorPalette.length]

                  return (
                    <div key={variant.size} className={`space-y-2 ${soldOut ? 'opacity-50' : ''}`}>
                      {/* Inventory blocks (if available) */}
                      {blocks.length > 0 && (
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
                      )}

                      {/* Size button with countdown */}
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => !soldOut && setSelectedSize(variant.size)}
                          disabled={soldOut}
                          className={`flex-1 px-4 py-2 border-2 border-black text-lg font-mono lowercase shadow-[2px_2px_0_#bfb6a6] transition-all ${
                            soldOut
                              ? 'bg-gray-300 cursor-not-allowed line-through text-gray-500'
                              : selectedSize === variant.size
                              ? 'bg-white'
                              : 'bg-[#e7e0d6] hover:bg-white'
                          }`}
                        >
                          {variant.size}
                          {soldOut && <span className="ml-2 text-red-600 no-underline">(SOLD OUT)</span>}
                        </button>
                      </div>

                      {/* Countdown number - always show if limitedDrop exists */}
                      {limitedDrop && (
                        <div className="flex justify-center">
                          <div
                            className={`font-mono text-2xl font-bold transition-all duration-300 ${
                              soldOut || countdownValue === 0
                                ? 'text-red-600'
                                : countdownValue !== null && countdownValue <= 10
                                ? 'text-red-500 animate-pulse'
                                : countdownValue !== null && countdownValue <= 30
                                ? 'text-orange-500'
                                : 'text-green-600'
                            }`}
                          >
                            {countdownValue ?? 0}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Checkout */}
              <div className="pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={!selectedSize || isSizeSoldOut(selectedSize)}
                  className={`w-full border-2 border-black font-mono text-lg py-3 shadow-[3px_3px_0_#bfb6a6] transition-all ${
                    !selectedSize || isSizeSoldOut(selectedSize)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#e7e0d6] hover:bg-white active:translate-y-[1px] text-black'
                  }`}
                >
                  {isSizeSoldOut(selectedSize) ? 'Size unavailable' : 'Add to cart & checkout'}
                </button>
                <p className="text-center text-xs text-black/60 font-mono mt-2">
                  {limitedDrop ? 'Hurry! Numbers are counting down in real-time.' : 'Checkout opens a new tab'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
