'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ProductData {
  name: string
  images: Array<{ url: string; alt?: string }>
  sizes: string[]
  shopifyCheckoutUrl: string
}

interface ProductCheckoutProps {
  productId?: string
}

export default function ProductCheckout({ productId }: ProductCheckoutProps) {
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
          // Set first size as default
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

    fetchProduct()
  }, [productId])

  const handleCheckout = () => {
    if (!product || !selectedSize) return

    // Construct Shopify checkout URL with variant based on size
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-sm tracking-widest animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-sm tracking-widest">{error}</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-square relative bg-gray-900 rounded-lg overflow-hidden">
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
              <div className="grid grid-cols-4 gap-2">
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

            <p className="text-gray-500 text-xs text-center tracking-wider">
              You will be redirected to secure Shopify checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
