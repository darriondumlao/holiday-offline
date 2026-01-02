'use client'

import { useState, useEffect, useRef } from 'react'

interface BouncingDownloadModalProps {
  title: string
  questionText: string
  imageUrl: string
  downloadFileName: string
  onClose: () => void
}

export default function BouncingDownloadModal({
  title,
  questionText,
  imageUrl,
  downloadFileName,
  onClose,
}: BouncingDownloadModalProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [velocity, setVelocity] = useState({ x: 2, y: 1.5 })
  const [isPaused, setIsPaused] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (isPaused) return

    const animate = () => {
      setPosition((prev) => {
        if (!modalRef.current) return prev

        const modalWidth = modalRef.current.offsetWidth
        const modalHeight = modalRef.current.offsetHeight
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let newX = prev.x + velocity.x
        let newY = prev.y + velocity.y
        let newVelocityX = velocity.x
        let newVelocityY = velocity.y

        // Bounce off right or left edge
        if (newX + modalWidth >= viewportWidth) {
          newX = viewportWidth - modalWidth
          newVelocityX = -Math.abs(velocity.x)
        } else if (newX <= 0) {
          newX = 0
          newVelocityX = Math.abs(velocity.x)
        }

        // Bounce off bottom or top edge
        if (newY + modalHeight >= viewportHeight) {
          newY = viewportHeight - modalHeight
          newVelocityY = -Math.abs(velocity.y)
        } else if (newY <= 0) {
          newY = 0
          newVelocityY = Math.abs(velocity.y)
        }

        // Update velocity if it changed
        if (newVelocityX !== velocity.x || newVelocityY !== velocity.y) {
          setVelocity({ x: newVelocityX, y: newVelocityY })
        }

        return { x: newX, y: newY }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [velocity, isPaused])

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${downloadFileName}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  return (
    <div
      ref={modalRef}
      className="fixed z-50 w-[320px] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Blue Header */}
      <div className="bg-blue-600 px-2 py-1 flex items-center justify-between rounded-t-sm">
        <h2 className="text-white font-bold text-xs">{title}</h2>
        <button
          onClick={onClose}
          className="bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-0.5 cursor-pointer"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-gray-200 px-3 py-6 flex items-center justify-center min-h-[140px]">
        <p className="text-black text-base font-medium text-center leading-snug">
          {questionText}
        </p>
      </div>

      {/* Button Row */}
      <div className="bg-blue-600 px-1.5 py-1.5 flex items-center justify-between gap-1.5 rounded-b-sm">
        <button
          onClick={handleDownload}
          className="flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer"
        >
          <span className="underline">D</span>ownload
        </button>
        <button className="flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer">
          <span className="underline">W</span>ho Am I
        </button>
        <button className="flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer">
          <span className="underline">O</span>ffline
        </button>
      </div>
    </div>
  )
}
