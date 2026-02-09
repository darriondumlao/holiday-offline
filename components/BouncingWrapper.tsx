'use client'

import { useState, useEffect, useRef, useId, ReactNode, isValidElement, cloneElement } from 'react'
import { createPortal } from 'react-dom'
import { useBouncingPause } from '@/contexts/BouncingPauseContext'

interface BouncingWrapperProps {
  children: ReactNode
  speed?: number // pixels per frame
  initialX?: number
  initialY?: number
  initialDirection?: 'ne' | 'nw' | 'se' | 'sw' // northeast, northwest, southeast, southwest
  className?: string
  title?: string // Title to show on mobile collapsed state
}

// Ticker height CSS variable value (fallback to 32px)
const TICKER_HEIGHT = 32
// Countdown timer bar height
const TIMER_HEIGHT = 52

export default function BouncingWrapper({
  children,
  speed = 2,
  initialX,
  initialY,
  initialDirection,
  className = '',
  title = 'modal',
}: BouncingWrapperProps) {
  // Generate unique ID for this modal
  const modalId = useId()

  // Get global pause state from context
  const { focusedModalId, setFocused, registerModal, unregisterModal } = useBouncingPause()

  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [velocity, setVelocity] = useState({ x: speed, y: speed })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLightboxAnimating, setIsLightboxAnimating] = useState(false)

  // Visual feedback states
  const isFocused = focusedModalId === modalId
  const isOtherFocused = focusedModalId !== null && !isFocused

  // Pause bouncing when any modal is in lightbox
  const isPaused = focusedModalId !== null

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Top boundary (below ticker + timer)
  const topBoundary = TICKER_HEIGHT + TIMER_HEIGHT

  // Mobile speed is slower
  const effectiveSpeed = isMobile ? speed * 0.5 : speed

  // Initialize position and measure element
  useEffect(() => {
    if (!containerRef.current) return

    const element = containerRef.current
    const rect = element.getBoundingClientRect()
    setDimensions({ width: rect.width, height: rect.height })

    // Random starting position if not provided
    const maxX = window.innerWidth - rect.width
    const maxY = window.innerHeight - rect.height
    const minY = topBoundary

    const startX = initialX ?? Math.random() * Math.max(0, maxX)
    const startY = initialY ?? (minY + Math.random() * Math.max(0, maxY - minY))

    setPosition({ x: Math.max(0, startX), y: Math.max(minY, startY) })

    // Set initial direction - use specified direction or random
    let vx: number
    let vy: number

    if (initialDirection) {
      switch (initialDirection) {
        case 'ne':
          vx = effectiveSpeed
          vy = -effectiveSpeed
          break
        case 'nw':
          vx = -effectiveSpeed
          vy = -effectiveSpeed
          break
        case 'se':
          vx = effectiveSpeed
          vy = effectiveSpeed
          break
        case 'sw':
          vx = -effectiveSpeed
          vy = effectiveSpeed
          break
      }
    } else {
      vx = Math.random() > 0.5 ? effectiveSpeed : -effectiveSpeed
      vy = Math.random() > 0.5 ? effectiveSpeed : -effectiveSpeed
    }

    setVelocity({ x: vx, y: vy })
    setIsInitialized(true)
  }, [effectiveSpeed, initialX, initialY, initialDirection, topBoundary])

  // Update velocity when speed changes (mobile detection)
  useEffect(() => {
    if (!isInitialized) return
    setVelocity((prev) => ({
      x: prev.x > 0 ? effectiveSpeed : -effectiveSpeed,
      y: prev.y > 0 ? effectiveSpeed : -effectiveSpeed,
    }))
  }, [effectiveSpeed, isInitialized])

  // Animation loop
  useEffect(() => {
    if (!isInitialized || dimensions.width === 0 || isPaused) return

    let animationId: number

    const animate = () => {
      setPosition((prev) => {
        let newX = prev.x + velocity.x
        let newY = prev.y + velocity.y
        let newVx = velocity.x
        let newVy = velocity.y

        // Bounce off right/left edges
        if (newX + dimensions.width >= window.innerWidth) {
          newX = window.innerWidth - dimensions.width
          newVx = -Math.abs(velocity.x)
        } else if (newX <= 0) {
          newX = 0
          newVx = Math.abs(velocity.x)
        }

        // Bounce off bottom edge
        if (newY + dimensions.height >= window.innerHeight) {
          newY = window.innerHeight - dimensions.height
          newVy = -Math.abs(velocity.y)
        }
        // Bounce off top edge (ticker + timer bar)
        else if (newY <= topBoundary) {
          newY = topBoundary
          newVy = Math.abs(velocity.y)
        }

        // Update velocity if bounced
        if (newVx !== velocity.x || newVy !== velocity.y) {
          setVelocity({ x: newVx, y: newVy })
        }

        return { x: newX, y: newY }
      })

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isInitialized, velocity, dimensions, isPaused, topBoundary])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })

      setPosition((prev) => ({
        x: Math.min(Math.max(0, prev.x), window.innerWidth - rect.width),
        y: Math.min(Math.max(topBoundary, prev.y), window.innerHeight - rect.height),
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [topBoundary])

  // Register modal position with context
  useEffect(() => {
    if (!isInitialized || dimensions.width === 0) return

    registerModal(modalId, {
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height,
    })

    return () => {
      unregisterModal(modalId)
    }
  }, [modalId, position.x, position.y, dimensions.width, dimensions.height, isInitialized, registerModal, unregisterModal])

  // Randomize direction when lightbox closes
  useEffect(() => {
    if (!isOtherFocused && !isFocused && isInitialized) {
      // Small delay to let the animation complete
      const timer = setTimeout(() => {
        const newVx = (Math.random() > 0.5 ? 1 : -1) * effectiveSpeed
        const newVy = (Math.random() > 0.5 ? 1 : -1) * effectiveSpeed
        setVelocity({ x: newVx, y: newVy })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOtherFocused, isFocused, isInitialized, effectiveSpeed])

  // Open lightbox
  const openLightbox = () => {
    setIsLightboxAnimating(true)
    setIsLightboxOpen(true)
    setFocused(modalId)
  }

  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxAnimating(false)
    // Wait for animation to complete before fully closing
    setTimeout(() => {
      setIsLightboxOpen(false)
      setFocused(null)
    }, 250)
  }

  // Clone children with modified onClose
  const renderChildren = () => {
    if (isValidElement(children)) {
      return cloneElement(children as React.ReactElement<{ onClose?: () => void }>, {
        onClose: closeLightbox,
      })
    }
    return children
  }

  // Mobile mini-modal dimensions
  const MINI_MODAL_WIDTH = 160
  const MINI_MODAL_SCALE = MINI_MODAL_WIDTH / 320

  // State for dismissing (hiding) the modal
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't render if dismissed
  if (isDismissed) return null

  // Calculate lightbox center position
  const lightboxX = (typeof window !== 'undefined' ? window.innerWidth : 800) / 2 - (isMobile ? 160 : 180)
  const lightboxY = (typeof window !== 'undefined' ? window.innerHeight : 600) / 2 - 150

  // Hover state for subtle feedback
  const [isHovered, setIsHovered] = useState(false)

  // Mobile: Show mini-modal that bounces, tap to open lightbox
  if (isMobile) {
    return (
      <>
        {/* Bouncing mini-modal */}
        <div
          ref={containerRef}
          className={`fixed cursor-pointer ${className}`}
          style={{
            left: position.x,
            top: position.y,
            width: `${MINI_MODAL_WIDTH}px`,
            opacity: isInitialized ? (isLightboxOpen || isOtherFocused ? 0.15 : 1) : 0,
            pointerEvents: isLightboxOpen || isOtherFocused ? 'none' : 'auto',
            transition: 'opacity 0.25s ease-out',
          }}
          onClick={(e) => {
            e.stopPropagation()
            openLightbox()
          }}
        >
          {/* Scaled-down content container */}
          <div
            className="origin-top-left overflow-hidden rounded-sm shadow-xl"
            style={{
              width: '320px',
              transform: `scale(${MINI_MODAL_SCALE})`,
              pointerEvents: 'none',
            }}
          >
            {children}
          </div>
        </div>

        {/* Lightbox */}
        {isLightboxOpen && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ paddingTop: topBoundary }}
            onClick={closeLightbox}
          >
            {/* Backdrop - near solid black for maximum focus */}
            <div
              className="absolute inset-0 bg-black transition-opacity duration-250"
              style={{ opacity: isLightboxAnimating ? 0.95 : 0 }}
            />

            {/* Modal in lightbox */}
            <div
              className="relative w-[90vw] max-w-[360px] transition-all duration-250 ease-out"
              style={{
                opacity: isLightboxAnimating ? 1 : 0,
                transform: isLightboxAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {renderChildren()}
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  // Desktop: Full modal bouncing, click to open lightbox
  return (
    <>
      {/* Bouncing modal */}
      <div
        ref={containerRef}
        className={`fixed w-[320px] sm:w-[360px] cursor-pointer ${className}`}
        style={{
          left: position.x,
          top: position.y,
          opacity: isInitialized ? (isLightboxOpen || isOtherFocused ? 0.15 : 1) : 0,
          pointerEvents: isLightboxOpen || isOtherFocused ? 'none' : 'auto',
          transform: isHovered && !isLightboxOpen ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isHovered && !isLightboxOpen ? '0 20px 40px -10px rgba(0, 0, 0, 0.4)' : 'none',
          transition: 'opacity 0.25s ease-out, transform 0.15s ease-out, box-shadow 0.15s ease-out',
        }}
        onClick={(e) => {
          e.stopPropagation()
          openLightbox()
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ paddingTop: topBoundary }}
          onClick={closeLightbox}
        >
          {/* Backdrop - near solid black for maximum focus */}
          <div
            className="absolute inset-0 bg-black transition-opacity duration-250"
            style={{ opacity: isLightboxAnimating ? 0.95 : 0 }}
          />

          {/* Modal in lightbox */}
          <div
            className="relative w-[360px] max-w-[90vw] transition-all duration-250 ease-out"
            style={{
              opacity: isLightboxAnimating ? 1 : 0,
              transform: isLightboxAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderChildren()}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
