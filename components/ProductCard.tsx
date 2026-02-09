'use client'

import { useState, useRef, useEffect } from 'react'
import ModalWrapper from './ModalWrapper'
import ImageScroller from './ImageScroller'
import ProductDetailsLightbox from './ProductDetailsLightbox'
import LimitedDropTimer from './LimitedDropTimer'
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
  const [isBellPlaying, setIsBellPlaying] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const bellAudioRef = useRef<HTMLAudioElement | null>(null)

  const playBellSound = () => {
    if (isBellPlaying) return

    // Pause the main music
    window.dispatchEvent(new CustomEvent('pauseForBell'))

    setIsBellPlaying(true)

    // Create and play the bell sound
    const audio = new Audio('/swingers-bell.mp3')
    bellAudioRef.current = audio

    audio.play().catch(console.error)

    // When the bell sound ends, resume music and re-enable button
    audio.onended = () => {
      setIsBellPlaying(false)
      window.dispatchEvent(new CustomEvent('resumeAfterBell'))
    }
  }

  useEffect(() => {
    if (product && cardRef.current) {
      console.log(`[ProductCard: ${product.name}]`)
      console.log(`  Total height: ${cardRef.current.offsetHeight}px`)
      console.log(`  Header: ${headerRef.current?.offsetHeight}px`)
      console.log(`  Content: ${contentRef.current?.offsetHeight}px`)
      console.log(`  Details row: ${detailsRef.current?.offsetHeight}px`)
      console.log(`  Footer: ${footerRef.current?.offsetHeight}px`)
    }
  }, [product])

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

  // Check if product is sold out (no variants available for sale)
  const isSoldOut = allVariants.length === 0 || allVariants.every(v => !v.availableForSale)

  // If we have product data, show the product with images (or title fallback) and size selector
  if (product) {
    return (
      <div ref={cardRef} className='w-full select-none'>
        {/* Header */}
        <div ref={headerRef} className='relative rounded-t-sm bg-cover bg-center overflow-hidden' style={{ backgroundImage: 'url(/swingers-1.png)' }}>
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

        {/* Content Area - Image Scroller or Title Fallback */}
        <div ref={contentRef} className='h-[120px] md:h-[216px] relative'>
          {/* Sold Out Pill - Temporarily hidden for pre-launch */}
          {/* <LimitedDropTimer
            isActive={isSoldOut}
            manualSoldOut={isSoldOut}
            startedAt={null}
          /> */}
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

        {/* See Details Link - always shown to maintain consistent height */}
        <div ref={detailsRef} className='bg-[#1a1a1a] py-1'>
          <button
            onClick={() => {
              if (images.length > 0) {
                setLightboxIndex(0)
                setLightboxOpen(true)
              }
            }}
            disabled={images.length === 0}
            className={`text-[10px] tracking-wide w-full text-center transition-colors ${
              images.length > 0
                ? 'text-white/50 hover:text-white/80 cursor-pointer'
                : 'text-transparent cursor-default'
            }`}
          >
            see details
          </button>
        </div>

        {/* Size Selector - Temporarily showing "Available 2/14 @ 11AM" */}
        <div ref={footerRef} className='relative rounded-b-sm bg-cover bg-center overflow-hidden' style={{ backgroundImage: 'url(/swingers-1.png)' }}>
          {/* Dark overlay to dim the pattern */}
          <div className='absolute inset-0 bg-black/40' />
          <div className='relative px-2 py-2 flex justify-center'>
            <button
              className={`text-white font-bold text-xs tracking-wide border border-white/60 rounded px-3 py-1 bg-black/40 transition-all ${
                isBellPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:bg-black/60'
              }`}
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}
              onClick={playBellSound}
              disabled={isBellPlaying}
            >
              Available 2/14 @ 11AM
            </button>
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
