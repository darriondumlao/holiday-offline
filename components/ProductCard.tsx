'use client'

import { useState } from 'react'
import ModalWrapper from './ModalWrapper'
import ImageScroller from './ImageScroller'
import Lightbox from './Lightbox'
import { Product, ProductVariant } from '@/lib/shopify'

interface ProductCardProps {
  title: string
  productName: string
  productDetail: string
  onClose: () => void
  product?: Product | null
  onAddToCart?: (product: { name: string; price: number; size: string; variantId: string }) => void
}

export default function ProductCard({
  title,
  productName,
  productDetail,
  onClose,
  product,
  onAddToCart
}: ProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

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
        <div className='h-[120px] md:h-[216px]'>
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
        </div>

        {/* Lightbox */}
        {lightboxOpen && images.length > 0 && (
          <Lightbox
            images={images}
            initialIndex={lightboxIndex}
            alt={product.name}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {/* Size Selector - clicking a size directly adds to cart */}
        <div className='bg-blue-600 px-2 py-2 rounded-b-sm'>
          <div className='flex flex-wrap gap-1 justify-center'>
            {allVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => variant.availableForSale && handleSizeSelect(variant)}
                disabled={!variant.availableForSale}
                className={`border-2 border-black font-bold px-2 py-1 text-xs transition-all ${
                  variant.availableForSale
                    ? 'bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 text-black cursor-pointer'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                {variant.size}
              </button>
            ))}
            {allVariants.length === 0 && (
              <span className='text-white text-xs'>sold out</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Fallback: Original placeholder UI
  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'go', onClick: handleOffline },
        { label: 'to', onClick: handleOffline },
        { label: 'offline', onClick: handleOffline },
      ]}
    >
      <div className='flex flex-col items-center justify-center text-center w-full h-[120px] md:h-[216px] bg-[#1a1a1a]'>
        <span className='text-white text-2xl md:text-4xl font-bold lowercase'>{productName}</span>
        <span className='text-white text-3xl md:text-5xl font-bold'>{productDetail}</span>
      </div>
    </ModalWrapper>
  )
}
