'use client'

import { useState, useRef, useEffect } from 'react'
import ImageScroller from './ImageScroller'
import ProductDetailsLightbox from './ProductDetailsLightbox'
import { Product, ProductVariant } from '@/lib/shopify'

interface PreSwingersProductCardProps {
  product: Product | null
  onClose: () => void
  onAddToCart?: (product: { name: string; price: number; size: string; variantId: string; quantityAvailable?: number }) => void
}

export default function PreSwingersProductCard({
  product,
  onClose,
  onAddToCart
}: PreSwingersProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isBellPlaying, setIsBellPlaying] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const bellAudioRef = useRef<HTMLAudioElement | null>(null)

  if (!product) return null

  const images = product.images.map(img => img.url)
  const allVariants = product.variants || []

  // Check if product is completely sold out
  const isSoldOut = allVariants.length === 0 || allVariants.every(v => !v.availableForSale)

  const playBellSound = () => {
    if (isBellPlaying) return

    // Pause the main music
    window.dispatchEvent(new CustomEvent('pauseForBell'))

    setIsBellPlaying(true)

    // Create and play the bell sound
    const audio = new Audio('/swingers-bell.mp3')
    bellAudioRef.current = audio

    audio.play().catch(console.error)

    // When the bell sound ends, resume music and re-enable
    audio.onended = () => {
      setIsBellPlaying(false)
      window.dispatchEvent(new CustomEvent('resumeAfterBell'))
    }
  }

  const handleSizeSelect = (variant: ProductVariant) => {
    if (!variant.availableForSale) return

    // Play the bell sound
    playBellSound()

    if (onAddToCart) {
      onAddToCart({
        name: product.name,
        price: variant.price,
        size: variant.size,
        variantId: variant.id,
        quantityAvailable: variant.quantityAvailable,
      })
    }
  }

  return (
    <div ref={cardRef} className='w-full select-none'>
      {/* Header */}
      <div className='relative rounded-t-sm bg-cover bg-center overflow-hidden' style={{ backgroundImage: 'url(/swingers-1.png)' }}>
        {/* Dark overlay to dim the pattern */}
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative px-3 py-1.5 flex items-center justify-between gap-2'>
          <h2
            className='text-white font-bold text-sm lowercase truncate flex-1'
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}
          >
            {product.name} {/* (${product.variants[0]?.price || 0}) */}
          </h2>
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
      </div>

      {/* Image Area - Fixed height of 216px to match product cards */}
      <div className='relative h-[216px] bg-[#1a1a1a]'>
        {/* Sold Out Pill */}
        {isSoldOut && (
          <div className='absolute top-2 right-2 z-10 rounded-full px-2 py-1 md:px-3 md:py-1.5 font-bold text-[10px] md:text-sm shadow-lg bg-red-600 text-white animate-pulse'>
            SOLD OUT
          </div>
        )}

        {images.length > 0 ? (
          <ImageScroller
            images={images}
            alt={product.name}
            className='h-full'
            onImageClick={(index) => {
              setLightboxIndex(index)
              setLightboxOpen(true)
            }}
            scale={1.1}
          />
        ) : (
          <div className='flex flex-col items-center justify-center text-center w-full h-full bg-[#1a1a1a]'>
            <span className='text-white text-lg md:text-2xl font-bold lowercase px-4'>{product.name}</span>
          </div>
        )}
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

      {/* See Details Link */}
      {images.length > 0 && (
        <div className='bg-[#1a1a1a] py-1'>
          <button
            onClick={() => setLightboxOpen(true)}
            className='text-white/50 hover:text-white/80 text-[10px] tracking-wide w-full text-center cursor-pointer transition-colors'
          >
            see details
          </button>
        </div>
      )}

      {/* Size Selector Footer */}
      <div className='relative rounded-b-sm bg-cover bg-center overflow-hidden' style={{ backgroundImage: 'url(/swingers-1.png)' }}>
        {/* Dark overlay to dim the pattern */}
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative px-2 py-2'>
          {isSoldOut ? (
            <div className='flex justify-center'>
              <span
                className='text-white font-bold text-xs tracking-wide border border-white/60 rounded px-3 py-1 bg-red-600/60'
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}
              >
                Sold Out
              </span>
            </div>
          ) : (
            <div className='flex flex-wrap justify-center gap-1'>
              {allVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleSizeSelect(variant)}
                  disabled={!variant.availableForSale}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                    variant.availableForSale
                      ? 'bg-black/40 text-white border border-white/60 hover:bg-white/20 active:scale-95 cursor-pointer'
                      : 'bg-black/20 text-white/30 border border-white/20 cursor-not-allowed line-through'
                  }`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                >
                  {variant.size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
