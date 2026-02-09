'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/lib/shopify'
import ProductDetailsLightbox from './ProductDetailsLightbox'

interface MobileProductCardProps {
  product: Product | null
  onAddToCart?: (product: { name: string; price: number; size: string; variantId: string }) => void
  onClose: () => void
}

export default function MobileProductCard({ product, onAddToCart, onClose }: MobileProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!product) return null

  const images = product.images.map(img => img.url)
  const price = product.variants[0]?.price || 0

  return (
    <div className='w-full select-none overflow-hidden bg-black rounded-sm'>
      {/* Header */}
      <div className='relative rounded-t-sm bg-cover bg-center overflow-hidden' style={{ backgroundImage: 'url(/swingers-1.png)' }}>
        {/* Dark overlay to dim the pattern */}
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative px-3 py-1.5 flex items-center justify-between gap-2'>
          <h2
            className='text-white font-bold text-[10px] lowercase truncate flex-1 min-w-0'
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}
          >
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
      </div>

      {/* Image Area - tap to open lightbox */}
      <div
        className='relative h-[200px] bg-[#1a1a1a]'
        onClick={() => {
          if (images.length > 0) {
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
          <div className='flex items-center justify-center h-full'>
            <span className='text-white text-lg font-bold lowercase'>{product.name}</span>
          </div>
        )}
      </div>

      {/* Product Details Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <ProductDetailsLightbox
          images={images}
          alt={product.name}
          description={product.description}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* See Details Link - centered below image */}
      {images.length > 0 && (
        <div className='bg-[#1a1a1a] py-1'>
          <button
            onClick={() => setLightboxOpen(true)}
            className='text-white/50 hover:text-white/80 text-[10px] tracking-wide w-full text-center transition-colors'
          >
            see details
          </button>
        </div>
      )}

      {/* Footer - Available date (matches desktop ProductCard) */}
      <div className='relative rounded-b-sm bg-cover bg-center overflow-hidden' style={{ backgroundImage: 'url(/swingers-1.png)' }}>
        {/* Dark overlay to dim the pattern */}
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative px-2 py-2 flex justify-center'>
          <span
            className='text-white font-bold text-xs tracking-wide'
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}
          >
            Available 2/14 @ 11AM
          </span>
        </div>
      </div>
    </div>
  )
}
