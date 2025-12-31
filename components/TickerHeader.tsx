'use client'

import { useEffect, useState } from 'react'

interface TickerMessage {
  _id: string
  text: string
  order: number
}

export default function TickerHeader() {
  const [messages, setMessages] = useState<TickerMessage[]>([])
  const [showContent, setShowContent] = useState(false)

  // Fade in after subscribe section (500ms + 2500ms delay + 1200ms fade = 4200ms total)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 4200)
    return () => clearTimeout(timer)
  }, [])

  // Fetch ticker messages
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
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  if (messages.length === 0) return null

  // Get up to 2 messages and join them without separators
  const displayMessages = messages.slice(0, 2)
  const tickerText = displayMessages.map(m => m.text).join(' ')

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-black overflow-hidden transition-opacity duration-1000 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="ticker-wrap py-2">
        <div className="ticker">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="ticker-item">
              {tickerText}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
