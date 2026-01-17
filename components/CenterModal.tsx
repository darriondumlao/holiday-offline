'use client'

import { useState, useEffect } from 'react'

interface CenterModalProps {
  onClose: () => void
}

export default function CenterModal({ onClose }: CenterModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Small delay to trigger the fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  const handlePress = () => {
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLSf5688hipF8wVTQS69nzC9zeDeH-3jggDWAro0lkr_tqJ57_A/viewform',
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleClose = () => {
    setIsVisible(false)
    // Wait for fade-out animation before calling onClose
    setTimeout(() => {
      onClose()
    }, 300)
  }

  return (
    <div className='fixed z-[200] left-4 bottom-80 sm:bottom-96'>
      {/* Modal */}
      <div
        className={`relative w-[280px] sm:w-[320px] select-none transform transition-all duration-500 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Blue Header */}
        <div className='bg-blue-600 px-2 py-1 flex items-center justify-between rounded-t-sm'>
          <h2 className='text-white font-bold text-xs'>click the buttons</h2>
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
        <div className='bg-gray-200 px-3 py-6 flex items-center justify-center min-h-[140px]'>
          <p className='text-black text-base font-medium text-center leading-snug'>
            LEAD THE CONVERSATION.<br />
            FILMING BEGINS MONDAY.
          </p>
        </div>

        {/* Button Row */}
        <div className='bg-blue-600 px-1.5 py-1.5 flex items-center justify-between gap-1.5 rounded-b-sm'>
          <button
            onClick={handlePress}
            className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'
          >
press
          </button>
          <button
            onClick={handlePress}
            className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'
          >
press
          </button>
          <button
            onClick={handlePress}
            className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'
          >
press
          </button>
        </div>
      </div>
    </div>
  )
}
