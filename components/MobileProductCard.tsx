'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product, ProductVariant } from '@/lib/shopify'
import Lightbox from './Lightbox'

interface MobileProductCardProps {
  product: Product | null
  onAddToCart?: (product: { name: string; price: number; size: string; variantId: string }) => void
  onClose: () => void
}

export default function MobileProductCard({ product, onAddToCart, onClose }: MobileProductCardProps) {
  const [showSizes, setShowSizes] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!product) return null

  const images = product.images.map(img => img.url)
  const allVariants = product.variants || []
  const price = product.variants[0]?.price || 0

  const handleSizeSelect = (variant: ProductVariant) => {
    if (onAddToCart && variant.availableForSale) {
      onAddToCart({
        name: product.name,
        price: variant.price,
        size: variant.size,
        variantId: variant.id,
      })
      // Reset back to add to cart button after selection
      setTimeout(() => setShowSizes(false), 150)
    }
  }

  return (
    <div className='w-full select-none overflow-hidden bg-black rounded-sm'>
      {/* Header */}
      <div className='bg-blue-600 px-3 py-1.5 flex items-center justify-between gap-2 rounded-t-sm'>
        <h2 className='text-white font-bold text-[10px] lowercase truncate flex-1 min-w-0'>
          {product.name} (${price})
        </h2>
        <button
          onClick={onClose}
          className='bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all rounded-sm p-0.5 flex-shrink-0'
          aria-label='Close'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' className='w-3 h-3'>
            <path
              fillRule='evenodd'
              d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </div>

      {/* Image Area - tap to dismiss size selector or open lightbox */}
      <div
        className='relative h-[200px] bg-[#f5f5f5]'
        onClick={() => {
          if (showSizes) {
            setShowSizes(false)
          } else if (images.length > 0) {
            setLightboxOpen(true)
          }
        }}
      >
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={product.name}
            fill
            className='object-contain p-2'
            sizes='280px'
          />
        ) : (
          <div className='flex items-center justify-center h-full bg-[#1a1a1a]'>
            <span className='text-white text-lg font-bold lowercase'>{product.name}</span>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <Lightbox
          images={images}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Footer - Add to Cart / Size Selector */}
      <div className='bg-blue-600 px-3 py-2 relative overflow-hidden rounded-b-sm'>
        {/* Add to Cart Button */}
        <button
          onClick={() => setShowSizes(true)}
          className={`w-full bg-white text-black font-bold py-2 text-sm rounded-sm transition-all duration-150 ${
            showSizes ? 'opacity-0 scale-95 absolute inset-x-3' : 'opacity-100 scale-100'
          }`}
        >
          add to cart
        </button>

        {/* Size Selector - no back button, tap image to dismiss */}
        <div
          className={`transition-all duration-150 ${
            showSizes ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-x-3 pointer-events-none'
          }`}
        >
          <div className='flex flex-wrap gap-1.5 justify-center'>
            {allVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleSizeSelect(variant)}
                disabled={!variant.availableForSale}
                className={`font-bold px-3 py-1.5 text-xs rounded-sm transition-all ${
                  variant.availableForSale
                    ? 'bg-white text-black active:scale-95'
                    : 'bg-gray-500 text-gray-400 cursor-not-allowed'
                }`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
