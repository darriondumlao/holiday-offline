'use client'

import { useEffect, useState, useRef } from 'react'
import AudioPlayer, { AudioPlayerHandle } from './AudioPlayer'

type ViewMode = 'offline' | 'shop'

interface HeaderContentProps {
  currentView?: ViewMode
  onViewChange?: (view: ViewMode) => void
}

export default function HeaderContent({ currentView = 'shop', onViewChange }: HeaderContentProps) {
  const [mounted, setMounted] = useState(false)
  const audioPlayerRef = useRef<AudioPlayerHandle>(null)

  // Set mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
      id="header-content"
      className="fixed left-0 right-0 z-[65] py-3 bg-black"
      style={{ top: 'var(--ticker-height, 40px)' }}
    >
      {/* Desktop: View Selector - absolute positioned on left */}
      {onViewChange && (
        <div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-50">
          <div className="flex items-center bg-gray-800/80 p-0.5">
            {(['offline', 'shop'] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-3 py-1 text-[10px] tracking-wider transition-all duration-200 focus:outline-none ${
                  currentView === view
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop: Center content placeholder */}
      {/* Add center content here when needed */}

      {/* Desktop: Right side controls - Audio Player */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 items-center gap-3">
        <AudioPlayer ref={audioPlayerRef} />
      </div>

      {/* Mobile: Single row - switcher | center content | audio */}
      <div className="flex md:hidden items-center justify-between px-2">
        {/* Left: Switcher */}
        {onViewChange && (
          <div className="flex items-center bg-gray-800/80 p-[2px] flex-shrink-0">
            {(['offline', 'shop'] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-1.5 py-0.5 text-[7px] font-medium tracking-wider transition-all duration-200 touch-manipulation focus:outline-none ${
                  currentView === view
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 active:bg-gray-700/50'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        )}
        {/* Center: Content placeholder */}
        {/* Add center content here when needed */}
        {/* Right: Audio Player */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <AudioPlayer ref={audioPlayerRef} />
        </div>
      </div>
    </div>
  )
}
