'use client'

import { useState } from 'react'
import ImageScroller from './ImageScroller'
import Lightbox from './Lightbox'
import { Product, ProductVariant } from '@/lib/shopify'

interface PasswordProductCardProps {
  title: string
  onClose: () => void
  product?: Product | null
  onAddToCart?: (product: { name: string; price: number; size: string; variantId: string }) => void
}

export default function PasswordProductCard({ title, onClose, product, onAddToCart }: PasswordProductCardProps) {
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [showError, setShowError] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setShowError(false)
  }

  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
        setShowError(false)
      } else {
        setIsShaking(true)
        setShowError(true)
        setTimeout(() => setIsShaking(false), 500)
        setTimeout(() => setShowError(false), 2000)
      }
    } catch {
      setShowError(true)
      setTimeout(() => setShowError(false), 2000)
    } finally {
      setIsVerifying(false)
    }
  }

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

  return (
    <div className='w-full select-none'>
      {/* Yellow Header */}
      <div className='bg-yellow-500 px-3 py-1.5 flex items-center justify-between rounded-t-sm'>
        <h2 className='text-black font-bold text-sm lowercase'>
          {isUnlocked && product ? `${product.name} ($${product.variants[0]?.price || 0})` : title}
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

      {/* Content Area */}
      <div className='bg-white px-4 md:px-6 py-4 md:py-6 flex flex-col items-center justify-center h-[120px] md:h-[216px] relative overflow-hidden'>
        {/* Password Entry - Fades out when unlocked */}
        <div
          className={`flex flex-col items-center justify-center w-full transition-all duration-500 ${
            isUnlocked ? 'opacity-0 scale-95 absolute pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          <span className='text-black text-sm md:text-xl font-bold lowercase mb-0.5 md:mb-1'>enter code</span>
          <span className='text-black text-sm md:text-xl font-bold lowercase mb-2 md:mb-4'>for private item</span>

          <div className='w-full max-w-[160px] md:max-w-[180px]'>
            <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
              <input
                type='text'
                value={password}
                onChange={handlePasswordChange}
                placeholder='enter here.'
                className={`w-full bg-white border-2 text-center py-1.5 md:py-2 px-3 md:px-4 text-xs md:text-sm focus:outline-none transition-colors ${
                  showError
                    ? 'border-red-500 text-red-500 placeholder:text-red-300'
                    : 'border-black text-black focus:border-blue-500 placeholder:text-gray-400'
                }`}
                autoComplete='off'
                autoCorrect='off'
                autoCapitalize='off'
                spellCheck='false'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
            </div>
            {showError && (
              <p className='text-red-500 text-[10px] md:text-xs mt-1 md:mt-2 text-center animate-fade-in'>
                incorrect password
              </p>
            )}
          </div>
        </div>

        {/* Product Content - Fades in when unlocked */}
        {isUnlocked && product ? (
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              isUnlocked ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
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
        ) : isUnlocked ? (
          <div
            className={`flex flex-col items-center justify-center transition-all duration-500 ${
              isUnlocked ? 'opacity-100 scale-100' : 'opacity-0 scale-105 absolute pointer-events-none'
            }`}
          >
            <span className='text-black text-xl md:text-3xl font-bold lowercase mb-2'>secret item</span>
            <span className='text-black text-2xl md:text-4xl font-bold'>$99</span>
          </div>
        ) : null}
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && product && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Size Selector - Shows when unlocked with product data, clicking a size directly adds to cart */}
      {isUnlocked && product && (
        <div className='bg-yellow-500 px-2 py-2 rounded-b-sm'>
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
              <span className='text-black text-xs'>sold out</span>
            )}
          </div>
        </div>
      )}

      {/* Button Row - Only shows when unlocked without product data (fallback) */}
      {isUnlocked && !product && (
        <div className='bg-yellow-500 px-2 py-2 flex items-center justify-center gap-2 rounded-b-sm'>
          <button
            onClick={handleOffline}
            className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all border-2 border-black text-black font-bold cursor-pointer px-3 py-2 text-xs'
          >
            go
          </button>
          <button
            onClick={handleOffline}
            className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all border-2 border-black text-black font-bold cursor-pointer px-3 py-2 text-xs'
          >
            to
          </button>
          <button
            onClick={handleOffline}
            className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all border-2 border-black text-black font-bold cursor-pointer px-3 py-2 text-xs'
          >
            offline
          </button>
        </div>
      )}

      {/* Submit button in footer when locked */}
      {!isUnlocked && (
        <div className='bg-yellow-500 px-2 py-2 flex items-center justify-center gap-2 rounded-b-sm'>
          <button
            onClick={() => handleSubmit()}
            className='flex-1 bg-gray-200 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all border-2 border-black text-black font-bold cursor-pointer px-3 py-2 text-xs'
          >
            submit
          </button>
        </div>
      )}
    </div>
  )
}
