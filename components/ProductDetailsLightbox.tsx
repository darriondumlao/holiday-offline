'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface ProductDetailsLightboxProps {
  images: string[]
  alt: string
  description?: string
  onClose: () => void
  initialIndex?: number
}

export default function ProductDetailsLightbox({
  images,
  alt,
  description,
  onClose,
  initialIndex = 0
}: ProductDetailsLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10)

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }, [images.length])

  const prevImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }, [images.length])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, nextImage, prevImage])

  if (!mounted) return null

  return createPortal(
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 99999 }}
      onClick={handleClose}
    >
      {/* Backdrop - solid black */}
      <div className='absolute inset-0 bg-black' />

      {/* Close Button */}
      <button
        onClick={handleClose}
        className='absolute top-4 right-4 z-10 bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all rounded-sm p-1.5'
        aria-label='Close'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='white'
          className='w-5 h-5'
        >
          <path
            fillRule='evenodd'
            d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
            clipRule='evenodd'
          />
        </svg>
      </button>

      {/* Content Container */}
      <div
        className={`relative flex flex-col items-center w-full max-w-4xl px-4 transition-transform duration-200 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Area */}
        <div className='relative w-full h-[50vh] md:h-[60vh]'>
          <Image
            src={images[currentIndex]}
            alt={`${alt} - Image ${currentIndex + 1}`}
            fill
            className='object-contain'
            sizes='(max-width: 768px) 100vw, 80vw'
            priority
          />

          {/* Navigation Arrows - Only show if multiple images */}
          {images.length > 1 && (
            <>
              {/* Previous */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className='absolute left-2 md:left-4 top-1/2 -translate-y-1/2 hover:opacity-70 active:scale-95 transition-all p-1'
                aria-label='Previous image'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='white'
                  className='w-5 h-5 md:w-6 md:h-6'
                >
                  <path
                    fillRule='evenodd'
                    d='M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>

              {/* Next */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className='absolute right-2 md:right-4 top-1/2 -translate-y-1/2 hover:opacity-70 active:scale-95 transition-all p-1'
                aria-label='Next image'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='white'
                  className='w-5 h-5 md:w-6 md:h-6'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Image Counter - below the image with spacing */}
        {images.length > 1 && (
          <div className='mt-4'>
            <span className='text-white/50 text-xs font-medium tracking-wide'>
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Description Area */}
        {description && (
          <div className='mt-4 md:mt-6 w-full max-h-[20vh] overflow-y-auto'>
            <p className='text-gray-300 text-xs md:text-sm leading-relaxed text-center px-4'>
              {description}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
