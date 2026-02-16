'use client'

import { useState, useRef, useEffect, memo, useImperativeHandle, forwardRef } from 'react'

export interface AudioPlayerHandle {
  mute: () => void
  unmute: () => void
  isCurrentlyPlaying: () => boolean
}

const AudioPlayer = forwardRef<AudioPlayerHandle>(function AudioPlayer(_, ref) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [wasPlayingBeforeMute, setWasPlayingBeforeMute] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

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

  // Listen for global pause/resume events from bell sound
  useEffect(() => {
    const handlePauseForBell = () => {
      if (audioRef.current && isPlaying) {
        setWasPlayingBeforeMute(true)
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }

    const handleResumeAfterBell = () => {
      if (audioRef.current && wasPlayingBeforeMute) {
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
        setWasPlayingBeforeMute(false)
      }
    }

    window.addEventListener('pauseForBell', handlePauseForBell)
    window.addEventListener('resumeAfterBell', handleResumeAfterBell)

    return () => {
      window.removeEventListener('pauseForBell', handlePauseForBell)
      window.removeEventListener('resumeAfterBell', handleResumeAfterBell)
    }
  }, [isPlaying, wasPlayingBeforeMute])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(console.error)
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Don't render audio player if no audio URL
  if (!audioUrl) {
    return null
  }

  return (
    <>
      <audio ref={audioRef} loop preload="metadata" src={audioUrl} />

      {/* Speaker Button - just toggles play/pause */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-colors touch-manipulation cursor-pointer text-gray-400 hover:text-white"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {!isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-4 h-4 md:w-5 md:h-5"
          >
            <path strokeLinecap="square" d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="17" y1="9" x2="23" y2="15" />
            <line x1="23" y1="9" x2="17" y2="15" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-4 h-4 md:w-5 md:h-5"
          >
            <path strokeLinecap="square" d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="16" y1="8" x2="16" y2="16" />
            <line x1="20" y1="6" x2="20" y2="18" />
          </svg>
        )}
      </button>
    </>
  )
})

export default memo(AudioPlayer)
