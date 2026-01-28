'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product, ProductVariant } from '@/lib/shopify'
import Lightbox from './Lightbox'

interface MobilePasswordCardProps {
  product: Product | null
  onAddToCart?: (product: { name: string; price: number; size: string; variantId: string }) => void
  onClose: () => void
}

export default function MobilePasswordCard({ product, onAddToCart, onClose }: MobilePasswordCardProps) {
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [showSizes, setShowSizes] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async () => {
    if (isVerifying) return

    setIsVerifying(true)
    try {
      const response = await fetch('/api/secret-product-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setIsUnlocked(true)
      } else {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
      }
    } catch {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSizeSelect = (variant: ProductVariant) => {
    if (product && onAddToCart && variant.availableForSale) {
      onAddToCart({
        name: product.name,
        price: variant.price,
        size: variant.size,
        variantId: variant.id,
      })
      setTimeout(() => setShowSizes(false), 150)
    }
  }

  const images = product?.images.map(img => img.url) || []
  const allVariants = product?.variants || []
  const price = product?.variants[0]?.price || 0

  return (
    <div className='w-full select-none overflow-hidden bg-black rounded-sm'>
      {/* Header */}
      <div className='bg-yellow-500 px-3 py-1.5 flex items-center justify-between gap-2 rounded-t-sm'>
        <h2 className='text-black font-bold text-[10px] lowercase truncate flex-1 min-w-0'>
          {isUnlocked && product ? `${product.name} ($${price})` : 'private item'}
        </h2>
        <button
          onClick={onClose}
          className='bg-orange-500 active:scale-95 transition-all rounded-sm p-0.5 flex-shrink-0'
          aria-label='Close'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' className='w-3 h-3'>
            <path fillRule='evenodd' d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z' clipRule='evenodd' />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className='relative h-[200px] bg-white overflow-hidden'>
        {/* Password Entry */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-200 ${
            isUnlocked ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          <span className='text-black text-sm font-bold lowercase mb-1'>enter code</span>
          <span className='text-black text-sm font-bold lowercase mb-3'>for private item</span>
          <div className={`w-36 ${isShaking ? 'animate-shake' : ''}`}>
            <input
              type='text'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='enter here.'
              className='w-full bg-white border-2 border-black text-center py-1.5 px-2 text-xs focus:outline-none text-black placeholder:text-gray-400'
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {/* Unlocked Product Image - tap to dismiss size selector or open lightbox */}
        <div
          className={`absolute inset-0 bg-[#f5f5f5] transition-all duration-200 ${
            isUnlocked ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          }`}
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
              alt={product?.name || 'Product'}
              fill
              className='object-contain p-2'
              sizes='280px'
            />
          ) : (
            <div className='flex items-center justify-center h-full bg-[#1a1a1a]'>
              <span className='text-white text-lg font-bold lowercase'>{product?.name || 'Secret Item'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <Lightbox
          images={images}
          alt={product?.name || 'Product'}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Footer */}
      <div className='bg-yellow-500 px-3 py-2 relative overflow-hidden rounded-b-sm'>
        {/* Submit Button (locked state) */}
        {!isUnlocked && (
          <button
            onClick={handleSubmit}
            className='w-full bg-white text-black font-bold py-2 text-sm rounded-sm active:scale-95 transition-all'
          >
            submit
          </button>
        )}

        {/* Add to Cart / Size Selector (unlocked state) */}
        {isUnlocked && product && (
          <>
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
          </>
        )}

        {/* Fallback for unlocked but no product */}
        {isUnlocked && !product && (
          <button
            onClick={() => window.open('https://holidaybrand.co', '_blank')}
            className='w-full bg-white text-black font-bold py-2 text-sm rounded-sm'
          >
            go to offline
          </button>
        )}
      </div>
    </div>
  )
}
