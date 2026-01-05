'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface GuitarHeroModalProps {
  onClose: () => void
  onSuccessAudioStart: () => void
  onSuccessAudioStop: () => void
}

export default function GuitarHeroModal({
  onClose,
  onSuccessAudioStart,
  onSuccessAudioStop,
}: GuitarHeroModalProps) {
  const [showForm, setShowForm] = useState(false)
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const successAudioRef = useRef<HTMLAudioElement>(null)

  const handleRegisterClick = () => {
    setShowForm(true)
  }

  const handleWhoAmI = () => {
    window.open(
      'https://youtu.be/Xkg7dp1QY9k?si=EuQIMvpoB_FmhR6d',
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    // Phone validation (numbers only)
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
          // Notify parent to mute main audio and play success audio
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
    // Stop success audio and restore main audio if it was playing
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
      {/* Success audio element */}
      <audio ref={successAudioRef} preload='metadata'>
        <source src="/Sugar, We're Goin Down.mp3" type='audio/mpeg' />
      </audio>

      {/* Modal Overlay */}
      <div className='fixed inset-0 z-[100] flex items-start justify-end pt-24 pr-8'>
        {/* Backdrop */}
        <div className='absolute inset-0 bg-black/60' />

        {/* Modal */}
        <div className='relative w-[320px] sm:w-[380px] select-none'>
          {/* Blue Header */}
          <div className='bg-blue-600 px-2 py-1 flex items-center justify-between rounded-t-sm'>
            <h2 className='text-white font-bold text-xs'>
              Guitar Hero Competition
            </h2>
            <button
              onClick={handleClose}
              className='bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-0.5 cursor-pointer'
              aria-label='Close'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='white'
                className='w-3 h-3'
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
          <div className='bg-gray-200 px-3 py-4 flex flex-col items-center justify-center min-h-[280px]'>
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
              <div className='relative w-full h-[250px]'>
                <Image
                  src={
                    isSuccess
                      ? '/finalcorrection.jpeg'
                      : '/finalcorrection.JPEG'
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
          </div>

          {/* Button Row */}
          <div className='bg-blue-600 px-1.5 py-1.5 flex items-center justify-between gap-1.5 rounded-b-sm'>
            <button
              onClick={handleRegisterClick}
              disabled={isSuccess}
              className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <span className='underline'>R</span>egister
            </button>
            <button
              onClick={handleWhoAmI}
              className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'
            >
              <span className='underline'>W</span>ho Am I
            </button>
            <button className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'>
              <span className='underline'>O</span>ffline
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
