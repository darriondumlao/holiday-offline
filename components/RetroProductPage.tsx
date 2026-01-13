'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchCollectionClient, createCheckoutClient, Product, ProductVariant } from '@/lib/shopify'
import RetroLoader from './RetroLoader'

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

interface RetroProductPageProps {
  onClose: () => void
}

export default function RetroProductPage({ onClose }: RetroProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [checkingOutSize, setCheckingOutSize] = useState<string | null>(null)

  // Limited drop state
  const [limitedDrop, setLimitedDrop] = useState<LimitedDrop | null>(null)
  const [countdowns, setCountdowns] = useState<Record<string, number> | null>(null)
  const timerIntervalsRef = useRef<NodeJS.Timeout[]>([])

  // Fetch product with minimum 1.5s loading time
  useEffect(() => {
    const fetchData = async () => {
      const startTime = Date.now()

      try {
        // Fetch products from the 'offline' collection
        const products = await fetchCollectionClient('offline')
        console.log('[RetroProductPage] Products fetched:', products?.length || 0)

        if (products && products.length > 0) {
          setProduct(products[0])
          console.log('[RetroProductPage] Product set:', products[0].name)
          console.log('[RetroProductPage] Variants:', products[0].variants.map(v => v.size))
        } else {
          setError('No products available')
        }
      } catch (err) {
        console.error('[RetroProductPage] Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        // Ensure minimum 1.5s loading time
        const elapsed = Date.now() - startTime
        const remainingTime = Math.max(0, 1500 - elapsed)
        setTimeout(() => {
          setLoading(false)
        }, remainingTime)
      }
    }

    fetchData()
  }, [])

  // Fetch limited drop data
  useEffect(() => {
    const fetchLimitedDrop = async () => {
      try {
        const response = await fetch('/api/limited-drop')
        const data = await response.json()

        if (data.drop && data.drop.sizeTimers) {
          setLimitedDrop(data.drop)

          // Initialize countdowns from the API response
          const initialCountdowns: Record<string, number> = {}
          data.drop.sizeTimers.forEach((timer: SizeTimer) => {
            const key = timer.size.toLowerCase()
            initialCountdowns[key] = timer.currentValue ?? timer.startValue
          })
          setCountdowns(initialCountdowns)

          // Clear existing intervals
          timerIntervalsRef.current.forEach(clearInterval)
          timerIntervalsRef.current = []

          // Start countdown intervals for each size
          data.drop.sizeTimers.forEach((timer: SizeTimer) => {
            if (timer.soldOut || (timer.currentValue !== undefined && timer.currentValue <= 0)) {
              return
            }

            const interval = setInterval(() => {
              setCountdowns(prev => {
                if (!prev) return prev
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
    }

    fetchLimitedDrop()

    // Cleanup intervals on unmount
    return () => {
      timerIntervalsRef.current.forEach(clearInterval)
      timerIntervalsRef.current = []
    }
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const nextImage = useCallback(() => {
    if (!product) return
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }, [product])

  const prevImage = useCallback(() => {
    if (!product) return
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }, [product])

  // Normalize size to abbreviation for matching (S, M, L, XL, XXL)
  const normalizeSizeKey = (size: string): string => {
    const lower = size.toLowerCase()
    if (lower === 'small' || lower === 's') return 's'
    if (lower === 'medium' || lower === 'm') return 'm'
    if (lower === 'large' || lower === 'l') return 'l'
    if (lower === 'extra large' || lower === 'x-large' || lower === 'xl') return 'xl'
    if (lower === 'extra extra large' || lower === 'xx-large' || lower === 'xxl' || lower === '2xl') return 'xxl'
    if (lower === 'extra small' || lower === 'x-small' || lower === 'xs') return 'xs'
    return lower
  }

  // Get countdown value for a size
  const getCountdownValue = (size: string): number | null => {
    if (!limitedDrop || !countdowns) return null

    const sizeKey = normalizeSizeKey(size)
    const countdownValue = countdowns[sizeKey]

    if (countdownValue !== undefined) {
      return countdownValue
    }

    const timer = limitedDrop.sizeTimers?.find(t => normalizeSizeKey(t.size) === sizeKey)
    if (timer) {
      return timer.currentValue ?? timer.startValue
    }

    return null
  }

  // Check if a size's countdown has reached zero
  const isCountdownZero = (size: string): boolean => {
    if (!limitedDrop || !countdowns) return false
    const sizeKey = normalizeSizeKey(size)
    const countdownValue = countdowns[sizeKey]

    if (countdownValue !== undefined) {
      return countdownValue <= 0
    }

    const timer = limitedDrop.sizeTimers?.find(t => normalizeSizeKey(t.size) === sizeKey)
    if (timer) {
      return timer.soldOut || (timer.currentValue !== undefined && timer.currentValue <= 0)
    }

    return false
  }

  // Handle size click - immediately checkout
  const handleSizeClick = async (variant: ProductVariant) => {
    // Check if countdown has reached zero
    if (isCountdownZero(variant.size)) {
      console.log('[RetroProductPage] Cannot checkout - countdown zero for', variant.size)
      return
    }

    if (!variant.availableForSale || checkingOutSize) return

    setCheckingOutSize(variant.size)
    try {
      const checkout = await createCheckoutClient([
        { variantId: variant.id, quantity: 1 },
      ])
      window.open(checkout.webUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Error creating checkout:', err)
      setError('Failed to create checkout')
    } finally {
      setCheckingOutSize(null)
    }
  }

  const formatPrice = (price: number) => {
    return `$${Math.floor(price)}`
  }

  // Get the lowest price from variants for display
  const getDisplayPrice = () => {
    if (!product) return '$0'
    const prices = product.variants.map((v) => v.price)
    const lowestPrice = Math.min(...prices)
    return formatPrice(lowestPrice)
  }

  // Convert size names to abbreviations
  const sizeAbbrev = (size: string) => {
    const lower = size.toLowerCase()
    if (lower === 'small') return 'S'
    if (lower === 'medium') return 'M'
    if (lower === 'large') return 'L'
    if (lower === 'extra large' || lower === 'x-large' || lower === 'xl') return 'XL'
    if (lower === 'extra extra large' || lower === 'xx-large' || lower === 'xxl' || lower === '2xl') return 'XXL'
    if (lower === 'extra small' || lower === 'x-small' || lower === 'xs') return 'XS'
    return size.toUpperCase()
  }

  // Check if all sizes have countdown zero
  const allCountdownsZero = (): boolean => {
    if (!product?.variants || !limitedDrop || !countdowns) return false
    return product.variants.every(v => isCountdownZero(v.size))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <RetroLoader size="lg" />
            <span className="text-white text-sm tracking-widest">LOADING...</span>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm tracking-widest"
          >
            {error}
          </motion.div>
        ) : product ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mac OS Window */}
            <div className="bg-[#c0c0c0] rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_#333,inset_0_1px_0_#fff]">
              {/* Title Bar - Blue Gradient */}
              <div className="bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] px-3 py-2 flex items-center justify-between border-b-2 border-[#1e40af]">
                <h2 className="text-black font-mono text-lg tracking-wide lowercase">
                  {product.name} ({getDisplayPrice()})
                </h2>
                <button
                  onClick={onClose}
                  className="bg-[#f97316] hover:bg-[#ea580c] active:scale-95 text-white rounded-sm w-6 h-6 flex items-center justify-center border border-white/50 shadow-sm transition-all"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Content Area - Beige/Cream */}
              <div className="bg-[#e8e4dc] p-4 space-y-4">
                {/* All Sold Out State */}
                {allCountdownsZero() ? (
                  <div className="text-center py-8">
                    <div className="relative aspect-square max-w-[200px] mx-auto mb-4 opacity-50 grayscale">
                      <Image
                        src={product.images[0]?.url || product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="text-3xl font-mono text-red-600 mb-2">SOLD OUT</div>
                    <p className="text-black/60 font-mono text-sm">
                      This limited edition drop has ended.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Limited Drop Banner */}
                    {limitedDrop && (
                      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1.5 text-center font-mono text-xs rounded">
                        <span className="animate-pulse">LIMITED DROP</span> - Act fast!
                      </div>
                    )}

                    {/* Product Image with External Arrows */}
                    <div className="flex items-center gap-2">
                      {/* Left Arrow */}
                      {product.images.length > 1 && (
                        <button
                          onClick={prevImage}
                          className="flex-shrink-0 bg-[#c0c0c0] hover:bg-[#d0d0d0] active:bg-[#a0a0a0] border border-[#808080] shadow-[1px_1px_0_#fff_inset,-1px_-1px_0_#404040_inset] px-2 py-3 transition-all"
                          aria-label="Previous image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Image Container */}
                      <div className="flex-1 relative bg-[#d4d0c8] rounded border border-[#808080] shadow-inner">
                        <div className="relative aspect-square">
                          {product.images.length > 0 && (
                            <Image
                              src={product.images[currentImageIndex]?.url || product.image_url}
                              alt={product.images[currentImageIndex]?.altText || product.name}
                              fill
                              className="object-contain p-4"
                              sizes="(max-width: 768px) 100vw, 400px"
                              priority
                            />
                          )}
                        </div>
                      </div>

                      {/* Right Arrow */}
                      {product.images.length > 1 && (
                        <button
                          onClick={nextImage}
                          className="flex-shrink-0 bg-[#c0c0c0] hover:bg-[#d0d0d0] active:bg-[#a0a0a0] border border-[#808080] shadow-[1px_1px_0_#fff_inset,-1px_-1px_0_#404040_inset] px-2 py-3 transition-all"
                          aria-label="Next image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Size Buttons with Countdowns */}
                    <div className="grid grid-cols-5 gap-2">
                      {product.variants.map((variant) => {
                        const isAvailable = variant.availableForSale
                        const isLoading = checkingOutSize === variant.size
                        const countdownValue = getCountdownValue(variant.size)
                        const countdownZero = isCountdownZero(variant.size)
                        const isDisabled = !isAvailable || isLoading || countdownZero

                        return (
                          <div key={variant.id} className="flex flex-col items-center">
                            <button
                              onClick={() => handleSizeClick(variant)}
                              disabled={isDisabled}
                              className={`
                                w-full h-12 font-mono text-base uppercase
                                border-2 border-black
                                transition-all
                                flex items-center justify-center
                                ${
                                  isDisabled
                                    ? 'bg-[#c0c0c0] text-gray-500 cursor-not-allowed line-through'
                                    : 'bg-[#e0dcd4] hover:bg-white active:translate-y-[1px] shadow-[2px_2px_0_#808080]'
                                }
                              `}
                            >
                              {isLoading ? (
                                <RetroLoader size="sm" />
                              ) : (
                                sizeAbbrev(variant.size)
                              )}
                            </button>
                            {/* Countdown number below button */}
                            {limitedDrop && countdowns && countdownValue !== null && (
                              <div
                                className={`font-mono text-lg font-bold mt-1 transition-all duration-300 ${
                                  countdownZero
                                    ? 'text-red-600'
                                    : countdownValue <= 10
                                    ? 'text-red-500 animate-pulse'
                                    : countdownValue <= 30
                                    ? 'text-orange-500'
                                    : 'text-green-600'
                                }`}
                              >
                                {countdownValue}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Countdown helper text */}
                    {limitedDrop && countdowns && (
                      <p className="text-center text-xs text-black/60 font-mono">
                        Numbers counting down - when a size hits 0, it&apos;s gone!
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Border Effect */}
              <div className="h-2 bg-gradient-to-b from-[#1d4ed8] to-[#1e40af]" />
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  )
}
