'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useVintageCollection } from '@/hooks/useVintageCollection'
import { Product, ProductVariant } from '@/lib/shopify'
import { CartItem } from './CartModal'
import ProductDetailsLightbox from './ProductDetailsLightbox'
import LimitedDropTimer from './LimitedDropTimer'
import { getOptimizedImageUrl } from '@/lib/image-utils'

interface VintageViewProps {
  isVisible: boolean
  showAfterSpotlight?: boolean
  cartItems: CartItem[]
  onAddToCart: (product: { name: string; price: number; size?: string; image?: string; variantId?: string }) => void
}

interface VintageProductCardProps {
  product: Product
  onAddToCart: (product: { name: string; price: number; size: string; variantId: string }) => void
  isRevealed: boolean
  onReveal: () => void
  onHide: () => void
}

function VintageProductCard({ product, onAddToCart, isRevealed, onReveal, onHide }: VintageProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const images = product.images.map(img => getOptimizedImageUrl(img.url))
  const allVariants = product.variants || []
  const price = product.variants[0]?.price || 0

  // Only show available variants
  const availableVariants = allVariants.filter(v => v.availableForSale)
  const isSoldOut = availableVariants.length === 0

  const handleSizeSelect = (variant: ProductVariant) => {
    if (variant.availableForSale) {
      onAddToCart({
        name: product.name,
        price: variant.price,
        size: variant.size,
        variantId: variant.id,
      })
    }
  }

  // When revealed, show product name in Holiday font
  if (isRevealed) {
    return (
      <div
        className='flex items-center justify-center bg-black rounded-sm cursor-pointer h-[288px]'
        onClick={onHide}
      >
        <span
          className='text-white text-3xl md:text-4xl leading-tight select-none hover:scale-110 transition-transform duration-300 text-center px-4 lowercase'
          style={{ fontFamily: "'Holiday Content', sans-serif" }}
        >
          {product.name}
        </span>
      </div>
    )
  }

  return (
    <div className='w-full select-none'>
      {/* Blue Header */}
      <div className='bg-blue-600 px-3 py-1.5 flex items-center justify-between rounded-t-sm'>
        <h2 className='text-white font-bold text-sm lowercase'>{product.name} (${price})</h2>
        <button
          onClick={onReveal}
          className='bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-0.5 cursor-pointer'
          aria-label='Close'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' className='w-3.5 h-3.5'>
            <path
              fillRule='evenodd'
              d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </div>

      {/* Content Area - Image */}
      <div className='h-[120px] md:h-[180px] relative bg-[#1a1a1a]'>
        {/* Sold Out Pill */}
        <LimitedDropTimer
          isActive={isSoldOut}
          manualSoldOut={isSoldOut}
          startedAt={null}
        />
        {images.length > 0 ? (
          <div
            className='w-full h-full flex items-center justify-center cursor-pointer'
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={images[0]}
              alt={product.name}
              fill
              className='object-contain p-2'
              sizes='360px'
            />
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center text-center w-full h-full'>
            <span className='text-white text-lg md:text-xl font-bold lowercase px-4'>{product.name}</span>
          </div>
        )}
      </div>

      {/* Product Details Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <ProductDetailsLightbox
          images={images}
          initialIndex={0}
          alt={product.name}
          description={product.description && product.description !== 'No description available' ? product.description : undefined}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* See Details Link */}
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

      {/* Size Selector - Only show available sizes */}
      <div className='bg-blue-600 px-2 py-2 rounded-b-sm'>
        {isSoldOut ? (
          <div className='flex justify-center'>
            <span className='text-white text-xs font-bold'>sold out</span>
          </div>
        ) : availableVariants.length === 1 && availableVariants[0].size.toLowerCase() === 'default title' ? (
          <div className='flex justify-center'>
            <button
              onClick={() => handleSizeSelect(availableVariants[0])}
              className='border-2 border-black font-bold px-3 py-1 text-xs transition-all bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 text-black cursor-pointer'
            >
              add to cart
            </button>
          </div>
        ) : (
          <div className='flex flex-wrap gap-1 justify-center'>
            {availableVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleSizeSelect(variant)}
                className='border-2 border-black font-bold px-2 py-1 text-xs transition-all bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 text-black cursor-pointer'
              >
                {variant.size}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Mobile version of vintage product card
function MobileVintageProductCard({ product, onAddToCart, isRevealed, onReveal, onHide }: VintageProductCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const images = product.images.map(img => getOptimizedImageUrl(img.url))
  const allVariants = product.variants || []
  const price = product.variants[0]?.price || 0

  // Only show available variants
  const availableVariants = allVariants.filter(v => v.availableForSale)
  const isSoldOut = availableVariants.length === 0

  const handleSizeSelect = (variant: ProductVariant) => {
    if (variant.availableForSale) {
      onAddToCart({
        name: product.name,
        price: variant.price,
        size: variant.size,
        variantId: variant.id,
      })
    }
  }

  // When revealed, show product name in Holiday font
  if (isRevealed) {
    return (
      <div
        className='flex items-center justify-center bg-black rounded-lg cursor-pointer aspect-[4/5]'
        onClick={onHide}
      >
        <span
          className='text-white text-[60px] leading-none select-none hover:scale-110 transition-transform duration-300 text-center px-4 lowercase'
          style={{ fontFamily: "'Holiday Content', sans-serif" }}
        >
          {product.name}
        </span>
      </div>
    )
  }

  return (
    <div className='w-full select-none overflow-hidden bg-black rounded-sm'>
      {/* Header */}
      <div className='bg-blue-600 px-3 py-1.5 flex items-center justify-between gap-2 rounded-t-sm'>
        <h2 className='text-white font-bold text-[10px] lowercase truncate flex-1 min-w-0'>
          {product.name} (${price})
        </h2>
        <button
          onClick={onReveal}
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

      {/* Image Area */}
      <div
        className='relative h-[200px] bg-[#1a1a1a]'
        onClick={() => images.length > 0 && setLightboxOpen(true)}
      >
        {/* Sold Out Pill */}
        <LimitedDropTimer
          isActive={isSoldOut}
          manualSoldOut={isSoldOut}
          startedAt={null}
        />
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
          description={product.description && product.description !== 'No description available' ? product.description : undefined}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* See Details Link */}
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

      {/* Footer - Size Selector */}
      <div className='bg-blue-600 px-3 py-2 rounded-b-sm'>
        {isSoldOut ? (
          <div className='flex justify-center'>
            <span className='text-white text-xs font-bold'>sold out</span>
          </div>
        ) : availableVariants.length === 1 && availableVariants[0].size.toLowerCase() === 'default title' ? (
          <div className='flex justify-center'>
            <button
              onClick={() => handleSizeSelect(availableVariants[0])}
              className='font-bold px-4 py-1.5 text-xs rounded-sm transition-all duration-150 bg-white text-black active:scale-95'
            >
              add to cart
            </button>
          </div>
        ) : (
          <div className='flex flex-wrap gap-1.5 justify-center'>
            {availableVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleSizeSelect(variant)}
                className='font-bold px-3 py-1.5 text-xs rounded-sm transition-all bg-white text-black active:scale-95'
              >
                {variant.size}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VintageView({
  isVisible,
  showAfterSpotlight = false,
  cartItems,
  onAddToCart
}: VintageViewProps) {
  const { products, loading, error } = useVintageCollection()
  const [contentVisible, setContentVisible] = useState(false)
  const [revealedProducts, setRevealedProducts] = useState<Record<string, boolean>>({})

  // Staggered animation after spotlight completes
  useEffect(() => {
    if (showAfterSpotlight && isVisible) {
      const timer = setTimeout(() => {
        setContentVisible(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showAfterSpotlight, isVisible])

  const revealProduct = (productId: string) => {
    setRevealedProducts(prev => ({ ...prev, [productId]: true }))
  }

  const hideProduct = (productId: string) => {
    setRevealedProducts(prev => ({ ...prev, [productId]: false }))
  }

  return (
    <div
      className={`fixed inset-0 z-30 flex flex-col items-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        paddingTop: 'calc(var(--ticker-height, 32px) + 52px)',
      }}
    >
      {/* Mobile Layout - Single column scroll */}
      <div className='md:hidden w-full h-full overflow-y-auto overscroll-y-contain scrollbar-hide'>
        <div
          className={`flex flex-col gap-3 w-full max-w-[280px] mx-auto px-3 pb-20 pt-1 transition-all duration-700 ease-out ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}
        >
          {loading && (
            <div className='flex items-center justify-center py-8'>
              <span className='text-white text-sm'>Loading vintage collection...</span>
            </div>
          )}
          {error && (
            <div className='flex items-center justify-center py-8'>
              <span className='text-red-500 text-sm'>Error loading collection</span>
            </div>
          )}
          {products.map((product) => (
            <div key={product.id} className='w-full'>
              <MobileVintageProductCard
                product={product}
                onAddToCart={onAddToCart}
                isRevealed={revealedProducts[product.id] || false}
                onReveal={() => revealProduct(product.id)}
                onHide={() => hideProduct(product.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Layout - Flexible grid */}
      <div className='hidden md:flex flex-col items-center justify-start w-full h-full px-8 py-4 overflow-y-auto'>
        <div
          className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl transition-all duration-700 ease-out ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}
        >
          {loading && (
            <div className='col-span-full flex items-center justify-center py-8'>
              <span className='text-white text-sm'>Loading vintage collection...</span>
            </div>
          )}
          {error && (
            <div className='col-span-full flex items-center justify-center py-8'>
              <span className='text-red-500 text-sm'>Error loading collection</span>
            </div>
          )}
          {products.map((product) => (
            <div key={product.id} className='w-full max-w-[360px]'>
              <VintageProductCard
                product={product}
                onAddToCart={onAddToCart}
                isRevealed={revealedProducts[product.id] || false}
                onReveal={() => revealProduct(product.id)}
                onHide={() => hideProduct(product.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
