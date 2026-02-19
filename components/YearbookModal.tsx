'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import RetroLoader from './RetroLoader'
import ModalWrapper from './ModalWrapper'

interface SlideImage {
  url: string
  alt?: string
}

interface YearbookModalProps {
  onClose: () => void
  title?: string
}

export default function YearbookModal({ onClose, title = 'yearbook' }: YearbookModalProps) {
  const [images, setImages] = useState<SlideImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    skipSnaps: false,
    align: 'center',
  })

  // Fetch approved yearbook photos from API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/yearbook')
        const data = await response.json()

        if (data.images && data.images.length > 0) {
          // Shuffle photos into random order
          const shuffled = [...data.images].sort(() => Math.random() - 0.5)
          setImages(shuffled)
        } else {
          setError('no photos yet')
        }
      } catch (err) {
        console.error('Error fetching yearbook photos:', err)
        setError('failed to load photos')
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

  // Track current slide index
  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on('select', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'prev', onClick: scrollPrev },
        { label: `${currentIndex + 1}/${images.length}`, isDisplay: true },
        { label: 'next', onClick: scrollNext },
      ]}
    >
      {loading ? (
        <div className='flex flex-col items-center gap-2'>
          <RetroLoader size='sm' />
          <span className='text-gray-600 text-xs'>Loading...</span>
        </div>
      ) : error || images.length === 0 ? (
        <span className='text-gray-500 text-xs'>{error || 'no photos yet'}</span>
      ) : (
        <div className='w-full'>
          <div className='relative'>
            <div className='overflow-hidden' ref={emblaRef}>
              <div className='flex items-center'>
                {images.map((image, index) => (
                  <div key={index} className='flex-[0_0_100%] min-w-0 flex justify-center items-center'>
                    <Image
                      src={image.url}
                      alt={image.alt || `Yearbook photo ${index + 1}`}
                      width={600}
                      height={500}
                      className='w-full h-auto object-contain max-h-[200px]'
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalWrapper>
  )
}
