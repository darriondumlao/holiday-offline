'use client'

import { useEffect, useState, useRef } from 'react'
import AudioPlayer, { AudioPlayerHandle } from './AudioPlayer'

interface CountdownTimerProps {
  showProductsView?: boolean
  onToggleView?: (showProducts: boolean) => void
  showAfterSpotlight?: boolean
  onOpenCoyoteBag?: () => void
}

export default function CountdownTimer({ showProductsView = true, onToggleView, showAfterSpotlight = false, onOpenCoyoteBag }: CountdownTimerProps) {
  const [showContent, setShowContent] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false) // Toggle state
  const [isAnimating, setIsAnimating] = useState(false) // Debounce clicks during animation
  const audioPlayerRef = useRef<AudioPlayerHandle>(null)

  // Fade in after spotlight completes (slight stagger after ticker)
  useEffect(() => {
    if (showAfterSpotlight) {
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [showAfterSpotlight])

  // Set mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTimerClick = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setShowWelcome(!showWelcome)
    // Reset animation state after transition completes
    setTimeout(() => setIsAnimating(false), 700)
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div
        className="fixed left-0 right-0 z-40 bg-black py-3 opacity-0"
        style={{ top: 'var(--ticker-height, 40px)' }}
      >
        <div className="h-6" />
      </div>
    )
  }

  return (
    <div
      id="countdown-timer"
      className={`fixed left-0 right-0 z-[65] py-3 transition-all duration-500 bg-black ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ top: 'var(--ticker-height, 40px)' }}
    >
      {/* View Toggle Switch - positioned absolute on left */}
      {onToggleView && (
        <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-50">
          <button
            onClick={() => onToggleView(!showProductsView)}
            className="flex items-center gap-1 md:gap-2 group"
            aria-label={showProductsView ? 'Switch to main view' : 'Switch to products view'}
          >
            {/* Toggle Track */}
            <div
              className={`relative w-8 h-4 md:w-10 md:h-5 rounded-full transition-colors duration-300 ${
                showProductsView ? 'bg-blue-600' : 'bg-gray-400'
              }`}
            >
              {/* Toggle Knob */}
              <div
                className={`absolute top-0.5 w-3 h-3 md:w-4 md:h-4 rounded-full shadow transition-transform duration-300 ${
                  showProductsView ? 'translate-x-4 md:translate-x-5 bg-white' : 'translate-x-0.5 bg-black'
                }`}
              />
            </div>
            {/* Label */}
            <span className="hidden sm:block text-xs tracking-wider transition-colors text-gray-400 group-hover:text-white">
              {showProductsView ? 'shop' : 'offline'}
            </span>
          </button>
        </div>
      )}

      {/* Right side controls - Bag icon and Audio Player */}
      <div className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-50 flex items-center gap-0 md:gap-3">
        {/* Coyote Bag Icon - only shows on shop view */}
        {onOpenCoyoteBag && showProductsView && (
          <button
            onClick={onOpenCoyoteBag}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-colors touch-manipulation cursor-pointer group"
            aria-label="View Coyote Bag"
          >
            <img
              src="/bagfinal5.png"
              alt="Coyote Bag"
              className="w-7 h-7 md:w-9 md:h-9 object-contain opacity-80 group-hover:opacity-100 group-active:scale-95 transition-all"
            />
          </button>
        )}
        {/* Audio Player */}
        <AudioPlayer ref={audioPlayerRef} />
      </div>

      {/* Timer Display Area - Click to toggle */}
      <div
        className="relative cursor-pointer select-none overflow-hidden"
        onClick={handleTimerClick}
        style={{ minHeight: '24px' }}
      >
        {/* Welcome Message - elegant fade with letter spacing animation */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: showWelcome ? 1 : 0,
            transform: showWelcome ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: showWelcome ? 'auto' : 'none',
          }}
        >
          <span
            className="text-white text-sm sm:text-base font-light"
            style={{
              letterSpacing: showWelcome ? '0.12em' : '0.05em',
              transition: 'letter-spacing 800ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            welcome to offline
          </span>
        </div>

        {/* Desktop Layout - Static 9 year values */}
        <div
          className="hidden sm:flex items-center justify-center gap-2 text-sm md:text-base pr-14"
          style={{
            opacity: showWelcome ? 0 : 1,
            transform: showWelcome ? 'translateY(-8px)' : 'translateY(0)',
            filter: showWelcome ? 'blur(4px)' : 'blur(0px)',
            transition: 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1), filter 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <span className="text-white tracking-widest font-light">9 years =</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[52px] text-center">
            0108
          </span>
          <span className="text-white tracking-widest font-light">months</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[52px] text-center">
            3287
          </span>
          <span className="text-white tracking-widest font-light">days</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[60px] text-center">
            78892
          </span>
          <span className="text-white tracking-widest font-light">hours</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[76px] text-center">
            4733532
          </span>
          <span className="text-white tracking-widest font-light">minutes</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[92px] text-center">
            284011920
          </span>
          <span className="text-white tracking-widest font-light">seconds</span>
        </div>

        {/* Mobile Layout - Static 9 year values */}
        <div
          className="flex sm:hidden items-center justify-center gap-1 text-[10px] px-12"
          style={{
            opacity: showWelcome ? 0 : 1,
            transform: showWelcome ? 'translateY(-8px)' : 'translateY(0)',
            filter: showWelcome ? 'blur(4px)' : 'blur(0px)',
            transition: 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1), filter 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <span className="text-white tracking-wider font-light">9y =</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[24px] text-center">
            108
          </span>
          <span className="text-white tracking-wider font-light">mo</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[28px] text-center">
            3287
          </span>
          <span className="text-white tracking-wider font-light">d</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[32px] text-center">
            78892
          </span>
          <span className="text-white tracking-wider font-light">h</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[40px] text-center">
            4733532
          </span>
          <span className="text-white tracking-wider font-light">m</span>

          <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[48px] text-center">
            284011920
          </span>
          <span className="text-white tracking-wider font-light">s</span>
        </div>
      </div>
    </div>
  )
}
