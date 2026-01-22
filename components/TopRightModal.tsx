'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import ModalWrapper from './ModalWrapper'

interface TopRightModalProps {
  onClose: () => void
  onSuccessAudioStart: () => void
  onSuccessAudioStop: () => void
  title?: string
}

export default function TopRightModal({
  onClose,
  onSuccessAudioStart,
  onSuccessAudioStop,
  title = 'january 29th',
}: TopRightModalProps) {
  const [showForm, setShowForm] = useState(false)
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const successAudioRef = useRef<HTMLAudioElement>(null)

  const handleOffline = () => {
    window.open(
      'https://holidaybrand.co',
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    const phoneRegex = /^\d+$/
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/guitar-hero-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.alreadySubscribed) {
          setError("You're already registered!")
          setPhone('')
        } else {
          setIsSuccess(true)
          setShowForm(false)
          onSuccessAudioStart()
          if (successAudioRef.current) {
            successAudioRef.current.play().catch(console.error)
          }
        }
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error registering:', error)
      setError('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (successAudioRef.current) {
      successAudioRef.current.pause()
      successAudioRef.current.currentTime = 0
    }
    if (isSuccess) {
      onSuccessAudioStop()
    }
    onClose()
  }

  return (
    <>
      <audio ref={successAudioRef} preload='metadata'>
        <source src="/Sugar, We're Goin Down.mp3" type='audio/mpeg' />
      </audio>

      <ModalWrapper
        title={title}
        onClose={handleClose}
        buttons={[
          { label: 'go', onClick: handleOffline },
          { label: 'to', onClick: handleOffline },
          { label: 'offline', onClick: handleOffline },
        ]}
      >
        {showForm && !isSuccess ? (
          <form onSubmit={handleSubmit} className='w-full space-y-3 px-2'>
            <input
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='phone number'
              className='w-full bg-white border-2 border-black text-black text-center py-2 px-4 text-sm focus:outline-none focus:border-blue-600 transition-colors placeholder:text-gray-500'
              disabled={isSubmitting}
            />
            {error && (
              <p className='text-red-600 text-xs text-center'>{error}</p>
            )}
            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 text-sm transition-colors disabled:opacity-50'
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type='button'
              onClick={() => setShowForm(false)}
              className='w-full text-gray-600 hover:text-gray-800 text-xs transition-colors'
            >
              Back
            </button>
          </form>
        ) : (
          <div className='relative w-full h-[180px]'>
            <Image
              src={
                isSuccess
                  ? '/gh-sucess.jpeg'
                  : '/holiday-landing-updated.jpeg'
              }
              alt={
                isSuccess
                  ? 'Registration Success'
                  : 'Guitar Hero Competition'
              }
              fill
              className='object-contain'
            />
          </div>
        )}
      </ModalWrapper>
    </>
  )
}
