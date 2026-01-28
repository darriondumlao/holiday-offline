'use client'

import { useState, useEffect, useRef, ReactNode, isValidElement, cloneElement } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [velocity, setVelocity] = useState({ x: speed, y: speed })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

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
      // Specified direction
      switch (initialDirection) {
        case 'ne': // northeast (right and up)
          vx = effectiveSpeed
          vy = -effectiveSpeed
          break
        case 'nw': // northwest (left and up)
          vx = -effectiveSpeed
          vy = -effectiveSpeed
          break
        case 'se': // southeast (right and down)
          vx = effectiveSpeed
          vy = effectiveSpeed
          break
        case 'sw': // southwest (left and down)
          vx = -effectiveSpeed
          vy = effectiveSpeed
          break
      }
    } else {
      // Random direction
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
    if (!isInitialized || dimensions.width === 0 || isPaused || isExpanded) return

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
  }, [isInitialized, velocity, dimensions, isPaused, topBoundary, isExpanded])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })

      // Ensure position is still valid after resize
      setPosition((prev) => ({
        x: Math.min(Math.max(0, prev.x), window.innerWidth - rect.width),
        y: Math.min(Math.max(topBoundary, prev.y), window.innerHeight - rect.height),
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [topBoundary])

  // Close expanded modal when clicking outside
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.expanded-modal-content')) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isExpanded])

  // Clone children with modified onClose to collapse instead of close completely
  const renderChildren = () => {
    if (isValidElement(children)) {
      return cloneElement(children as React.ReactElement<{ onClose?: () => void }>, {
        onClose: () => setIsExpanded(false),
      })
    }
    return children
  }

  // Mobile: Show just title chip that bounces, click to expand
  if (isMobile) {
    return (
      <>
        {/* Bouncing title chip */}
        <div
          ref={containerRef}
          className={`fixed ${className}`}
          style={{
            left: position.x,
            top: position.y,
            opacity: isInitialized && !isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? 'none' : 'auto',
            transition: isInitialized ? 'opacity 0.2s' : 'opacity 0.3s',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(true)
            }}
            className="bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider py-2 px-3 rounded-md shadow-lg hover:bg-blue-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            {title}
          </button>
        </div>

        {/* Expanded modal overlay */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
            style={{ paddingTop: topBoundary }}
          >
            <div
              className="expanded-modal-content w-[90vw] max-w-[360px] max-h-[80vh] overflow-auto animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {renderChildren()}
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop: Full modal bouncing
  return (
    <div
      ref={containerRef}
      className={`fixed w-[320px] sm:w-[360px] ${className}`}
      style={{
        left: position.x,
        top: position.y,
        opacity: isInitialized ? 1 : 0,
        transition: isInitialized ? 'none' : 'opacity 0.3s',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {children}
    </div>
  )
}
