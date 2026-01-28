'use client'

import { useState, useRef, useEffect, memo, useImperativeHandle, forwardRef } from 'react'

export interface AudioPlayerHandle {
  mute: () => void
  unmute: () => void
  isCurrentlyPlaying: () => boolean
}

const AudioPlayer = forwardRef<AudioPlayerHandle>(function AudioPlayer(_, ref) {
  const [isOpen, setIsOpen] = useState(false)
  const [volume, setVolume] = useState(0.3)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [wasPlayingBeforeMute, setWasPlayingBeforeMute] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch audio URL from Sanity
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const response = await fetch('/api/site-audio')
        const data = await response.json()
        if (data.audio?.audioUrl) {
          setAudioUrl(data.audio.audioUrl)
        }
      } catch (error) {
        console.error('Error fetching site audio:', error)
      }
    }
    fetchAudio()
  }, [])

  useImperativeHandle(ref, () => ({
    mute: () => {
      if (audioRef.current) {
        setWasPlayingBeforeMute(isPlaying)
        audioRef.current.pause()
        setIsPlaying(false)
      }
    },
    unmute: () => {
      if (audioRef.current && wasPlayingBeforeMute) {
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
      }
    },
    isCurrentlyPlaying: () => isPlaying,
  }))

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    // Unmute and apply volume immediately when the user drags the slider
    setIsMuted(false)
    if (audioRef.current) {
      audioRef.current.muted = false
      audioRef.current.volume = newVolume
      // Start playback if not already playing so volume changes are audible
      if (!isPlaying) {
        audioRef.current.play().catch(() => {
          /* ignore autoplay block; user interaction already occurred */
        })
        setIsPlaying(true)
      }
    }
  }

  // Don't render audio player if no audio URL
  if (!audioUrl) {
    return null
  }

  return (
    <>
      <audio ref={audioRef} loop preload="metadata" src={audioUrl} />

      <div
        ref={containerRef}
        className="relative"
      >
        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex items-center gap-2">
          {/* Volume Slider - appears when open (horizontal on desktop) */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen ? 'w-24 opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer volume-slider"
              style={{
                background: `linear-gradient(to right, #ffffff ${volume * 100}%, #4b5563 ${volume * 100}%)`,
              }}
            />
          </div>

          {/* Speaker Button */}
          <button
            onClick={() => {
              if (isOpen) {
                setIsMuted(!isMuted)
              } else {
                setIsOpen(true)
                if (!isPlaying) togglePlay()
              }
            }}
            className="w-10 h-10 flex items-center justify-center transition-colors touch-manipulation cursor-pointer text-gray-400 hover:text-white"
            aria-label="Audio controls"
          >
            {isMuted || !isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile: Vertical layout */}
        <div className="flex md:hidden flex-col items-center">
          {/* Speaker Button */}
          <button
            onClick={() => {
              if (isOpen) {
                setIsMuted(!isMuted)
              } else {
                setIsOpen(true)
                if (!isPlaying) togglePlay()
              }
            }}
            className="w-8 h-8 flex items-center justify-center transition-colors touch-manipulation cursor-pointer text-gray-400 hover:text-white"
            aria-label="Audio controls"
          >
            {isMuted || !isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
              </svg>
            )}
          </button>

          {/* Volume Slider - vertical on mobile, appears below button */}
          <div
            className={`absolute top-full right-0 mt-1 overflow-hidden transition-all duration-300 ease-in-out bg-black/80 rounded p-1.5 ${
              isOpen ? 'h-16 opacity-100' : 'h-0 opacity-0 pointer-events-none'
            }`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="h-12 w-1 bg-gray-600 rounded-lg appearance-none cursor-pointer volume-slider-vertical"
              style={{
                writingMode: 'vertical-lr',
                transform: 'rotate(180deg)',
                background: `linear-gradient(to bottom, #ffffff ${volume * 100}%, #4b5563 ${volume * 100}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
})

export default memo(AudioPlayer)
