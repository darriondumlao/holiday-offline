'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Product, fetchCollectionClient } from '@/lib/shopify'

interface CoyoteBagModalProps {
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: {
    name: string
    price: number
    size: string
    variantId: string
  }) => void
}

export default function CoyoteBagModal({ isOpen, onClose, onAddToCart }: CoyoteBagModalProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const isMountedRef = useRef(true)

  // Fetch the coyote bag product from Shopify nine-year collection when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (product) return // Already fetched

    isMountedRef.current = true

    const fetchCoyoteBag = async () => {
      try {
        setLoading(true)
        const products = await fetchCollectionClient('nine-year')

        if (!isMountedRef.current) return

        // Find the coyote bag product by name
        const coyoteBag = products.find(p =>
          p.title.toLowerCase().includes('coyote bag')
        )

        if (coyoteBag) {
          setProduct(coyoteBag)
        }
      } catch (error) {
        console.error('Error fetching coyote bag:', error)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchCoyoteBag()

    return () => {
      isMountedRef.current = false
    }
  }, [isOpen, product])

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const nextImage = useCallback(() => {
    if (!product) return
    setCurrentImageIndex((prev) =>
      (prev + 1) % product.images.length
    )
  }, [product])

  const prevImage = useCallback(() => {
    if (!product) return
    setCurrentImageIndex((prev) =>
      (prev - 1 + product.images.length) % product.images.length
    )
  }, [product])

  const handleAddToCart = async () => {
    if (!onAddToCart || isAdding || !product) return

    const selectedVariant = product.variants[selectedVariantIndex]
    if (!selectedVariant || !selectedVariant.availableForSale) return

    setIsAdding(true)

    onAddToCart({
      name: product.name,
      price: selectedVariant.price,
      size: selectedVariant.size,
      variantId: selectedVariant.id,
    })

    // Brief delay for feedback
    setTimeout(() => {
      setIsAdding(false)
      onClose()
    }, 300)
  }

  if (!isOpen) return null

  const selectedVariant = product?.variants[selectedVariantIndex]
  const displayPrice = selectedVariant?.price ?? 200
  const images = product?.images ?? [{ url: '/bagfinal5.png', altText: 'Coyote Bag' }]
  const currentImage = images[currentImageIndex] ?? images[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
                className="relative bg-white rounded-lg overflow-hidden shadow-2xl w-full max-w-[75vw] md:max-w-lg max-h-[65vh] md:max-h-[85vh] pointer-events-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >

              {loading ? (
                // Loading state
                <div className="flex items-center justify-center h-32 md:h-64">
                  <div className="text-gray-500 text-xs md:text-sm animate-pulse">Loading...</div>
                </div>
              ) : (
                <>
                  {/* Image Section - Fixed height, doesn't scroll */}
                  <div className="relative bg-neutral-100 flex-shrink-0">
                    <div className="relative aspect-[4/3] md:aspect-[4/3]">
                      <Image
                        src={currentImage.url || '/bagfinal5.png'}
                        alt={currentImage.altText || 'Coyote Bag'}
                        fill
                        className="object-contain p-1 md:p-4"
                        sizes="(max-width: 768px) 75vw, 512px"
                        priority
                      />
                    </div>

                    {/* Image Navigation Arrows - only show if multiple images */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                          aria-label="Previous image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                          aria-label="Next image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {/* Image Dots */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === currentImageIndex
                                  ? 'bg-amber-700'
                                  : 'bg-gray-400 hover:bg-gray-600'
                              }`}
                              aria-label={`Go to image ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Product Info - Scrollable */}
                  <div className="p-2 md:p-5 space-y-1.5 md:space-y-3 overflow-y-auto flex-1">
                    {/* Title and Price */}
                    <div className="flex items-start justify-between gap-2 md:gap-4">
                      <h2 className="text-sm md:text-xl font-bold text-gray-900 uppercase tracking-wide">
                        {product?.title || 'Coyote Bag'}
                      </h2>
                      <span className="text-sm md:text-xl font-bold text-amber-700 flex-shrink-0">
                        ${displayPrice}
                      </span>
                    </div>

                    {/* Size/Variant Selection - only show if multiple variants */}
                    {product && product.variants.length > 1 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                          Size
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {product.variants.map((variant, idx) => (
                            <button
                              key={variant.id}
                              onClick={() => variant.availableForSale && setSelectedVariantIndex(idx)}
                              disabled={!variant.availableForSale}
                              className={`px-4 py-2 border-2 font-medium text-sm transition-all ${
                                selectedVariantIndex === idx
                                  ? 'border-amber-700 bg-amber-50 text-amber-900'
                                  : variant.availableForSale
                                    ? 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              }`}
                            >
                              {variant.size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isAdding || !selectedVariant?.availableForSale}
                      className={`w-full py-1.5 md:py-3 px-3 md:px-6 text-white text-xs md:text-base font-bold uppercase tracking-wider transition-all ${
                        isAdding
                          ? 'bg-green-600 cursor-wait'
                          : !selectedVariant?.availableForSale
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-amber-700 hover:bg-amber-800 active:scale-[0.98]'
                      }`}
                    >
                      {isAdding ? 'Added!' : !selectedVariant?.availableForSale ? 'Sold Out' : 'Add to Cart'}
                    </button>

                    {/* Description */}
                    {product?.description && (
                      <p className="text-gray-600 text-[10px] md:text-sm leading-relaxed pt-1 md:pt-2 border-t border-gray-100">
                        {product.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
