'use client'

import { useEffect, useState, useRef } from 'react'

interface TickerMessage {
  _id: string
  text: string
  order: number
}

interface TickerHeaderProps {
  showAfterSpotlight?: boolean
}

export default function TickerHeader({ showAfterSpotlight = false }: TickerHeaderProps) {
  const [messages, setMessages] = useState<TickerMessage[]>([])
  const [showContent, setShowContent] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)

  // Fade in immediately when spotlight completes
  useEffect(() => {
    if (showAfterSpotlight) {
      setShowContent(true)
    }
  }, [showAfterSpotlight])

  // Set ticker height as CSS variable for countdown positioning
  useEffect(() => {
    const updateTickerHeight = () => {
      if (tickerRef.current) {
        const height = tickerRef.current.offsetHeight
        document.documentElement.style.setProperty('--ticker-height', `${height}px`)
      }
    }

    updateTickerHeight()
    window.addEventListener('resize', updateTickerHeight)
    return () => window.removeEventListener('resize', updateTickerHeight)
  }, [messages])

  // Fetch ticker messages once on mount (cache is revalidated via webhook)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/ticker')
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Error fetching ticker messages:', error)
      }
    }

    fetchMessages()
  }, [])

  if (messages.length === 0) return null

  // Get up to 2 messages and join them without separators
  const displayMessages = messages.slice(0, 2)
  const tickerText = displayMessages.map(m => m.text).join(' ')

  return (
    <div
      ref={tickerRef}
      id="ticker-header"
      className={`fixed top-0 left-0 right-0 z-[70] overflow-hidden transition-all duration-500 bg-black ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="ticker-wrap py-1.5 md:py-2">
        <div className="ticker">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="ticker-item text-white text-xs md:text-sm">
              {tickerText}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
