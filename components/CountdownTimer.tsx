'use client'

import { useEffect, useState, useRef } from 'react'
import AudioPlayer, { AudioPlayerHandle } from './AudioPlayer'

interface CountdownTimerProps {
  showProductsView?: boolean
  onToggleView?: (showProducts: boolean) => void
  showAfterSpotlight?: boolean
  onOpenCoyoteBag?: () => void
  isShopAuthenticated?: boolean
}

// 9 Year Anniversary: Thursday, January 29th, 2026 at 10:00 AM PST
// PST is UTC-8, so 10:00 AM PST = 18:00 UTC
const ANNIVERSARY_DATE = new Date('2026-01-29T18:00:00.000Z')

// Start date: January 25th, 2026 at 12:00 PM PST (when the countdown begins)
// This is the "zero point" - all values start from 0 here
const START_DATE = new Date('2026-01-25T20:00:00.000Z')

// Final values representing 9 years
// These are the target values that all counters will reach at the anniversary moment
const NINE_YEARS = {
  months: 108,        // 9 * 12
  days: 3287,         // ~9 years in days (accounting for leap years)
  hours: 78892,       // 3287 * 24 + some hours
  minutes: 4733532,   // 78892 * 60 + some minutes
  seconds: 284011920, // 4733532 * 60
}

interface TimeValues {
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

function calculateProgress(): TimeValues {
  const now = new Date()
  const totalDuration = ANNIVERSARY_DATE.getTime() - START_DATE.getTime()
  const elapsed = now.getTime() - START_DATE.getTime()

  // Before start date - show zeros
  if (elapsed <= 0) {
    return {
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isComplete: false,
    }
  }

  // After anniversary - show final values
  if (elapsed >= totalDuration) {
    return {
      months: NINE_YEARS.months,
      days: NINE_YEARS.days,
      hours: NINE_YEARS.hours,
      minutes: NINE_YEARS.minutes,
      seconds: NINE_YEARS.seconds,
      isComplete: true,
    }
  }

  // Calculate progress (0 to 1)
  const progress = elapsed / totalDuration

  // Apply progress to each value
  // Using Math.floor to get whole numbers that increment smoothly
  return {
    months: Math.floor(progress * NINE_YEARS.months),
    days: Math.floor(progress * NINE_YEARS.days),
    hours: Math.floor(progress * NINE_YEARS.hours),
    minutes: Math.floor(progress * NINE_YEARS.minutes),
    seconds: Math.floor(progress * NINE_YEARS.seconds),
    isComplete: false,
  }
}

function formatNumber(num: number, padding: number = 4): string {
  return num.toString().padStart(padding, '0')
}

export default function CountdownTimer({ showProductsView = true, onToggleView, showAfterSpotlight = false, onOpenCoyoteBag, isShopAuthenticated = false }: CountdownTimerProps) {
  const [timeValues, setTimeValues] = useState<TimeValues>({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false,
  })
  const [showContent, setShowContent] = useState(false)
  const [mounted, setMounted] = useState(false)
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

  // Update counter frequently for smooth animation
  // Using 50ms interval for smoother number changes
  useEffect(() => {
    if (!mounted) return

    // Initial calculation
    setTimeValues(calculateProgress())

    const interval = setInterval(() => {
      setTimeValues(calculateProgress())
    }, 50) // Update every 50ms for smooth counting effect

    return () => clearInterval(interval)
  }, [mounted])

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
        {/* Coyote Bag Icon - only shows on shop view AND when authenticated */}
        {onOpenCoyoteBag && showProductsView && isShopAuthenticated && (
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

      {timeValues.isComplete ? (
        // Anniversary reached message
        <div className="text-center">
          <span className="text-white text-sm sm:text-base tracking-widest font-light">
            welcome to offline
          </span>
        </div>
      ) : (
        <>
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-center gap-2 text-sm md:text-base pr-14">
            <span className="text-white tracking-widest font-light">9 years =</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[52px] text-center">
              {formatNumber(timeValues.months, 4)}
            </span>
            <span className="text-white tracking-widest font-light">months</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[52px] text-center">
              {formatNumber(timeValues.days, 4)}
            </span>
            <span className="text-white tracking-widest font-light">days</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[60px] text-center">
              {formatNumber(timeValues.hours, 5)}
            </span>
            <span className="text-white tracking-widest font-light">hours</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[76px] text-center">
              {formatNumber(timeValues.minutes, 7)}
            </span>
            <span className="text-white tracking-widest font-light">minutes</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-2 min-w-[92px] text-center">
              {formatNumber(timeValues.seconds, 9)}
            </span>
            <span className="text-white tracking-widest font-light">seconds</span>
          </div>

          {/* Mobile Layout - Compact, centered between toggle and audio */}
          <div className="flex sm:hidden items-center justify-center gap-1 text-[10px] px-12">
            <span className="text-white tracking-wider font-light">9y =</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[24px] text-center">
              {formatNumber(timeValues.months, 3)}
            </span>
            <span className="text-white tracking-wider font-light">mo</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[28px] text-center">
              {formatNumber(timeValues.days, 4)}
            </span>
            <span className="text-white tracking-wider font-light">d</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[32px] text-center">
              {formatNumber(timeValues.hours, 5)}
            </span>
            <span className="text-white tracking-wider font-light">h</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[40px] text-center">
              {formatNumber(timeValues.minutes, 7)}
            </span>
            <span className="text-white tracking-wider font-light">m</span>

            <span className="text-[#00FF00] font-mono border-b border-[#00FF00] px-0.5 min-w-[48px] text-center">
              {formatNumber(timeValues.seconds, 9)}
            </span>
            <span className="text-white tracking-wider font-light">s</span>
          </div>
        </>
      )}
    </div>
  )
}
