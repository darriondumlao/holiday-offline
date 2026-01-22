'use client'

import { useState, useEffect, ReactNode } from 'react'

interface ModalWrapperProps {
  title: string
  onClose: () => void
  children: ReactNode
  buttons?: Array<{
    label: string
    onClick?: () => void
    isDisplay?: boolean
    small?: boolean
  }>
}

export default function ModalWrapper({
  title,
  onClose,
  children,
  buttons = [],
}: ModalWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  return (
    <div
      className={`w-full select-none transform transition-all duration-500 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Blue Header */}
      <div className='bg-blue-600 px-3 py-1.5 flex items-center justify-between rounded-t-sm'>
        <h2 className='text-white font-bold text-sm lowercase'>{title}</h2>
        <button
          onClick={handleClose}
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
      <div className='bg-gray-200 px-2 py-3 flex items-center justify-center min-h-[200px]'>
        {children}
      </div>

      {/* Button Row */}
      {buttons.length > 0 && (
        <div className='bg-blue-600 px-2 py-2 flex items-center justify-center gap-2 rounded-b-sm'>
          {buttons.map((button, index) => {
            // Single button gets max-width, multiple buttons use flex-1
            const sizeClass = buttons.length === 1
              ? 'w-[45%]'
              : 'flex-1'

            return button.isDisplay ? (
              <div
                key={index}
                className={`${sizeClass} bg-gray-400 px-3 py-2 border-2 border-black text-black font-bold text-xs text-center`}
              >
                {button.label}
              </div>
            ) : (
              <button
                key={index}
                onClick={button.onClick}
                className={`${sizeClass} bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all border-2 border-black text-black font-bold cursor-pointer px-3 py-2 text-xs`}
              >
                {button.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
