'use client'

import { useState, useRef } from 'react'

interface ImageScrollerProps {
  images: string[]
  alt?: string
  className?: string
  onImageClick?: (index: number) => void
}

export default function ImageScroller({ images, alt = 'Product image', className = '', onImageClick }: ImageScrollerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index)
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.offsetWidth
      scrollRef.current.scrollLeft = scrollWidth * index
    }
  }

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.offsetWidth
      const scrollLeft = scrollRef.current.scrollLeft
      const newIndex = Math.round(scrollLeft / scrollWidth)
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex)
      }
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      scrollToIndex(currentIndex + 1)
    }
  }

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-[#1a1a1a] ${className}`}>
        <span className='text-gray-500 text-sm'>No images</span>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Image Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className='flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full'
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {images.map((src, index) => (
          <div
            key={index}
            className='flex-shrink-0 w-full h-full snap-center flex items-center justify-center bg-[#1a1a1a]'
            onClick={() => onImageClick?.(index)}
          >
            <img
              src={src}
              alt={`${alt} ${index + 1}`}
              className='max-w-full max-h-full object-contain'
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all ${
              currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
            }`}
            aria-label='Previous image'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
              <path fillRule='evenodd' d='M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z' clipRule='evenodd' />
            </svg>
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === images.length - 1}
            className={`absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all ${
              currentIndex === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
            }`}
            aria-label='Next image'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
              <path fillRule='evenodd' d='M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z' clipRule='evenodd' />
            </svg>
          </button>
        </>
      )}

    </div>
  )
}
