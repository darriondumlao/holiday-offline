'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import RetroLoader from './RetroLoader'

interface SlideImage {
  url: string
  alt?: string
}

interface ImageSlideshowProps {
  title?: string
}

export default function ImageSlideshow({
  title = 'Slideshow 1 Offline',
}: ImageSlideshowProps) {
  const [images, setImages] = useState<SlideImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    skipSnaps: false,
    align: 'center',
  })

  // Fetch images from API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/slideshow')
        const data = await response.json()

        if (data.images && data.images.length > 0) {
          setImages(data.images)
        } else {
          setError('No images found')
        }
      } catch (err) {
        console.error('Error fetching slideshow images:', err)
        setError('Failed to load images')
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollPrev()
      } else if (e.key === 'ArrowRight') {
        scrollNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scrollPrev, scrollNext])

  if (loading) {
    return (
      <div className='w-full min-h-screen bg-black flex flex-col items-center justify-center gap-4'>
        <RetroLoader size='lg' />
        <div className='text-white text-sm tracking-widest'>
          Loading slideshow...
        </div>
      </div>
    )
  }

  if (error || images.length === 0) {
    return (
      <div className='w-full min-h-screen bg-black flex items-center justify-center'>
        <div className='text-gray-500 text-sm tracking-widest'>
          {error || 'No images available'}
        </div>
      </div>
    )
  }

  return (
    <div className='w-full min-h-screen bg-black flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-5xl mx-auto'>
        {/* Embla Carousel Container */}
        <div className='relative'>
          <div className='overflow-hidden' ref={emblaRef}>
            <div className='flex items-center'>
              {images.map((image, index) => (
                <div key={index} className='flex-[0_0_100%] min-w-0 px-4 flex justify-center'>
                  <Image
                    src={image.url}
                    alt={image.alt || `Slide ${index + 1}`}
                    width={1200}
                    height={800}
                    className='max-h-[80vh] w-auto h-auto object-contain rounded-lg'
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={scrollPrev}
            className='absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 md:p-4 transition-all z-10'
            aria-label='Previous image'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='w-6 h-6 md:w-8 md:h-8'
            >
              <path
                fillRule='evenodd'
                d='M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z'
                clipRule='evenodd'
              />
            </svg>
          </button>
          <button
            onClick={scrollNext}
            className='absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 md:p-4 transition-all z-10'
            aria-label='Next image'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='w-6 h-6 md:w-8 md:h-8'
            >
              <path
                fillRule='evenodd'
                d='M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
