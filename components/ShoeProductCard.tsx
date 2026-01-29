'use client'

import { useState } from 'react'
import ImageScroller from './ImageScroller'
import ProductDetailsLightbox from './ProductDetailsLightbox'
import LimitedDropTimer from './LimitedDropTimer'
import { useLimitedDrop } from '@/hooks/useLimitedDrop'
import { Product, ProductVariant } from '@/lib/shopify'

interface ShoeProductCardProps {
  title: string
  onClose: () => void
  onAddToCart?: (product: { name: string; price: number; size: string; variantId: string }) => void
  product?: Product | null
}

export default function ShoeProductCard({ title, onClose, onAddToCart, product }: ShoeProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [timerSoldOut, setTimerSoldOut] = useState(false)
  const { isActive, manualSoldOut, startedAt } = useLimitedDrop()

  // Show "sold out" if:
  // 1. Manual sold out is enabled (instant override), OR
  // 2. Drop is active AND timer hit zero
  // When drop is inactive, fall back to Shopify's availableForSale
  const isSoldOut = (isActive && manualSoldOut) || (isActive && timerSoldOut)

  const handleOffline = () => {
    window.open('https://holidaybrand.co', '_blank', 'noopener,noreferrer')
  }

  const handleSizeSelect = (variant: ProductVariant) => {
    // Directly add to cart when size is clicked
    if (product && onAddToCart) {
      onAddToCart({
        name: product.name,
        price: variant.price,
        size: variant.size,
        variantId: variant.id,
      })
    }
  }

  // Get all variants
  const allVariants = product?.variants || []
  const images = product?.images.map(img => img.url) || []

  // If we have product data, show the product with images (or title fallback) and size selector
  if (product) {
    return (
      <div className='w-full select-none'>
        {/* Blue Header */}
        <div className='bg-blue-600 px-3 py-1.5 flex items-center justify-between rounded-t-sm'>
          <h2 className='text-white font-bold text-sm lowercase'>{product.name} (${product.variants[0]?.price || 0})</h2>
          <button
            onClick={onClose}
            className='bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-0.5 cursor-pointer'
            aria-label='Close'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='white'
              className='w-3.5 h-3.5'
            >
              <path
                fillRule='evenodd'
                d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>

        {/* Content Area - Image Scroller or Title Fallback */}
        <div className='relative h-[120px] md:h-[216px]'>
          {images.length > 0 ? (
            <ImageScroller
              images={images}
              alt={product.name}
              className='h-full'
              onImageClick={(index) => {
                setLightboxIndex(index)
                setLightboxOpen(true)
              }}
            />
          ) : (
            <div className='flex flex-col items-center justify-center text-center w-full h-full bg-[#1a1a1a]'>
              <span className='text-white text-lg md:text-2xl font-bold lowercase px-4'>{product.name}</span>
            </div>
          )}
          <LimitedDropTimer
            startedAt={startedAt}
            isActive={isActive}
            manualSoldOut={manualSoldOut}
            onSoldOut={() => setTimerSoldOut(true)}
          />
        </div>

        {/* Product Details Lightbox */}
        {lightboxOpen && images.length > 0 && (
          <ProductDetailsLightbox
            images={images}
            initialIndex={lightboxIndex}
            alt={product.name}
            description={product.description}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {/* See Details Link - centered below image */}
        {images.length > 0 && (
          <div className='bg-[#1a1a1a] py-1'>
            <button
              onClick={() => {
                setLightboxIndex(0)
                setLightboxOpen(true)
              }}
              className='text-white/50 hover:text-white/80 text-[10px] tracking-wide w-full text-center transition-colors'
            >
              see details
            </button>
          </div>
        )}

        {/* Size Selector - horizontal scroll single row */}
        <div className='bg-blue-600 px-2 py-2 rounded-b-sm'>
          <div
            className='flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 scroll-smooth'
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {allVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => variant.availableForSale && !isSoldOut && handleSizeSelect(variant)}
                disabled={!variant.availableForSale || isSoldOut}
                className={`flex-shrink-0 border-2 border-black font-bold px-2.5 py-1.5 text-[11px] transition-colors ${
                  variant.availableForSale && !isSoldOut
                    ? 'bg-gray-200 hover:bg-white active:bg-gray-300 text-black cursor-pointer'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                {variant.size}
              </button>
            ))}
            {(allVariants.length === 0 || isSoldOut) && (
              <span className='text-white text-xs'>sold out</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Fallback: Original placeholder UI
  return (
    <div className='w-full select-none'>
      {/* Blue Header */}
      <div className='bg-blue-600 px-3 py-1.5 flex items-center justify-between rounded-t-sm'>
        <h2 className='text-white font-bold text-sm lowercase'>{title}</h2>
        <button
          onClick={onClose}
          className='bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-0.5 cursor-pointer'
          aria-label='Close'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='white'
            className='w-3.5 h-3.5'
          >
            <path
              fillRule='evenodd'
              d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className='bg-[#1a1a1a] px-6 py-6 flex flex-col items-center justify-center h-[120px] md:h-[216px]'>
        <span className='text-white text-3xl md:text-5xl font-bold lowercase mb-2'>shoe</span>
        <span className='text-white text-4xl md:text-6xl font-bold'>$99</span>
      </div>

      {/* Button Row */}
      <div className='bg-blue-600 px-2 py-2 flex items-center justify-center gap-2 rounded-b-sm'>
        <button
          onClick={handleOffline}
          className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all border-2 border-black text-black font-bold cursor-pointer px-3 py-2 text-xs'
        >
          go to offline
        </button>
      </div>
    </div>
  )
}
