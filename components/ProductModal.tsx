'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ProductData {
  name: string
  images: Array<{ url: string; alt?: string }>
  sizes: string[]
  shopifyCheckoutUrl: string
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('/api/product')
        const data = await response.json()

        if (data.product) {
          setProduct(data.product)
          if (data.product.sizes && data.product.sizes.length > 0) {
            setSelectedSize(data.product.sizes[0])
          }
        } else {
          setError('Product not found')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
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
    const checkoutUrl = `${product.shopifyCheckoutUrl}?variant=${selectedSize}`
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }

  const nextImage = () => {
    if (!product) return
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    if (!product) return
    setCurrentImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    )
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
          className="relative bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-300 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white text-sm tracking-widest animate-pulse">
                Loading...
              </div>
            </div>
          ) : error || !product ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-red-400 text-sm tracking-widest">{error}</div>
            </div>
          ) : (
            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Image Gallery */}
                <div className="relative">
                  <div className="aspect-square relative bg-gray-900/50 rounded-lg overflow-hidden">
                    {product.images.length > 0 && (
                      <Image
                        src={product.images[currentImageIndex].url}
                        alt={
                          product.images[currentImageIndex].alt || product.name
                        }
                        fill
                        className="object-cover"
                        priority
                      />
                    )}

                    {/* Image Navigation */}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all"
                          aria-label="Previous image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6"
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
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all"
                          aria-label="Next image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? 'bg-white w-6'
                                  : 'bg-white/50'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex flex-col justify-center space-y-6">
                  <h1 className="text-white text-3xl md:text-4xl font-bold tracking-wider">
                    {product.name}
                  </h1>

                  {/* Size Selection */}
                  <div className="space-y-3">
                    <label className="text-white text-sm tracking-widest uppercase">
                      Select Size
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 px-4 border-2 transition-all text-sm font-medium tracking-wider ${
                            selectedSize === size
                              ? 'bg-white text-black border-white'
                              : 'bg-transparent text-white border-gray-600 hover:border-white'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={!selectedSize}
                    className="w-full bg-white hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-4 px-8 text-black font-bold text-lg tracking-widest uppercase"
                  >
                    Pay Now
                  </button>

                  <p className="text-gray-400 text-xs text-center tracking-wider">
                    You will be redirected to secure Shopify checkout
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
