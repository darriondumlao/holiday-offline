'use client'

import { useState, useEffect, useRef } from 'react'

interface OfflineModalProps {
  onUnlock: () => void
}

export default function OfflineModal({ onUnlock }: OfflineModalProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [velocity, setVelocity] = useState({ x: 0, y: 3.2 })
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [topBoundary, setTopBoundary] = useState(0)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  // Measure header height so modal never overlaps it
  useEffect(() => {
    const header = document.getElementById('ticker-header')
    if (!header) return

    const updateBoundary = () =>
      setTopBoundary(header.getBoundingClientRect().height)
    updateBoundary()

    const resizeObserver = new ResizeObserver(updateBoundary)
    resizeObserver.observe(header)

    return () => resizeObserver.disconnect()
  }, [])

  // Bouncing animation
  useEffect(() => {
    if (isPaused || isUnlocking) return

    const animate = () => {
      setPosition((prev) => {
        if (!modalRef.current) return prev

        const modalWidth = modalRef.current.offsetWidth
        const modalHeight = modalRef.current.offsetHeight
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Keep X fixed (clamp within viewport in case of resize)
        let newX = Math.min(
          Math.max(prev.x, 0),
          Math.max(viewportWidth - modalWidth, 0)
        )
        let newY = prev.y + velocity.y
        let newVelocityY = velocity.y

        // Bounce off bottom or top edge (vertical only)
        if (newY + modalHeight >= viewportHeight) {
          newY = viewportHeight - modalHeight
          newVelocityY = -Math.abs(velocity.y)
        } else if (newY <= topBoundary) {
          newY = topBoundary
          newVelocityY = Math.abs(velocity.y)
        }

        // Update velocity if changed
        if (newVelocityY !== velocity.y) {
          setVelocity({ x: 0, y: newVelocityY })
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
  }, [velocity, isPaused, topBoundary, isUnlocking])

  const handleUnlock = () => {
    setIsUnlocking(true)
    // Wait for fade out animation, then trigger scroll
    setTimeout(() => {
      onUnlock()
    }, 500)
  }

  const handleMouseEnter = () => {
    setIsPaused(true)
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
    setIsHovered(false)
  }

  const handleTouchStart = () => {
    setIsPaused(true)
    setIsHovered(true)
  }

  return (
    <div
      ref={modalRef}
      className={`fixed z-50 w-[320px] sm:w-[380px] select-none transition-opacity duration-500 ${
        isUnlocking ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      {/* Modal Container */}
      <div
        className={`bg-black border-4 border-white rounded-lg overflow-hidden transition-all duration-300 ${
          isHovered ? 'blur-none' : 'blur-md'
        }`}
      >
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b-4 border-black">
          <h2 className="text-black font-bold text-xl tracking-widest text-center">
            OFFLINE
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-12 flex flex-col items-center justify-center min-h-[200px] space-y-8">
          <p className="text-white text-center text-sm tracking-wider opacity-70">
            This content is currently offline
          </p>

          {/* Unlock Button */}
          <button
            onClick={handleUnlock}
            className="bg-white hover:bg-gray-200 active:scale-95 transition-all px-8 py-3 border-2 border-white text-black font-bold text-sm tracking-widest cursor-pointer uppercase"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  )
}
