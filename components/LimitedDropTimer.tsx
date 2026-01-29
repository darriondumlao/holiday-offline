'use client'

import { useState, useEffect, useCallback } from 'react'

interface LimitedDropTimerProps {
  startedAt: string | null
  isActive: boolean
  manualSoldOut?: boolean
  onSoldOut?: () => void
}

// Total duration: 10 minutes = 600 seconds
// Steps: 99 to 0 = 99 transitions
// We need to pre-generate random intervals that sum to 600 seconds
// Using a seeded approach based on startedAt to ensure consistency across clients

function generateIntervals(seed: number): number[] {
  // Simple seeded random number generator (mulberry32)
  function seededRandom(a: number) {
    return function() {
      let t = a += 0x6D2B79F5
      t = Math.imul(t ^ t >>> 15, t | 1)
      t ^= t + Math.imul(t ^ t >>> 7, t | 61)
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
  }

  const random = seededRandom(seed)
  const totalSeconds = 600 // 10 minutes
  const steps = 99 // 99 to 0

  // Generate random weights for each step
  const weights: number[] = []
  for (let i = 0; i < steps; i++) {
    // Random weight between 0.5 and 2.0 for variety
    weights.push(0.5 + random() * 1.5)
  }

  // Normalize weights to sum to totalSeconds
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const intervals = weights.map(w => (w / weightSum) * totalSeconds)

  // Round to milliseconds precision but ensure total is exactly 900 seconds
  let roundedIntervals = intervals.map(i => Math.round(i * 1000) / 1000)

  // Adjust for rounding errors
  const currentSum = roundedIntervals.reduce((a, b) => a + b, 0)
  const diff = totalSeconds - currentSum
  roundedIntervals[0] += diff // Add difference to first interval

  return roundedIntervals
}

function calculateCurrentValue(startedAt: string, intervals: number[]): { value: number; soldOut: boolean } {
  const now = Date.now()
  const started = new Date(startedAt).getTime()
  const elapsedSeconds = (now - started) / 1000

  if (elapsedSeconds < 0) {
    return { value: 99, soldOut: false }
  }

  // Find which step we're on based on cumulative intervals
  let cumulativeTime = 0
  for (let i = 0; i < intervals.length; i++) {
    cumulativeTime += intervals[i]
    if (elapsedSeconds < cumulativeTime) {
      return { value: 99 - i, soldOut: false }
    }
  }

  // Past all intervals = sold out
  return { value: 0, soldOut: true }
}

export default function LimitedDropTimer({ startedAt, isActive, manualSoldOut, onSoldOut }: LimitedDropTimerProps) {
  const [displayValue, setDisplayValue] = useState<number | null>(null)
  const [soldOut, setSoldOut] = useState(false)
  const [intervals, setIntervals] = useState<number[]>([])

  // Handle manual sold out - trigger immediately when enabled
  useEffect(() => {
    if (manualSoldOut && isActive && !soldOut) {
      setSoldOut(true)
      onSoldOut?.()
    }
  }, [manualSoldOut, isActive, soldOut, onSoldOut])

  // Generate intervals once based on startedAt
  useEffect(() => {
    if (startedAt && !manualSoldOut) {
      // Use timestamp as seed for consistent intervals across all clients
      const seed = new Date(startedAt).getTime()
      const generatedIntervals = generateIntervals(seed)
      setIntervals(generatedIntervals)
    }
  }, [startedAt, manualSoldOut])

  // Update the display value based on elapsed time
  const updateValue = useCallback(() => {
    if (!startedAt || !isActive || intervals.length === 0 || manualSoldOut) {
      setDisplayValue(null)
      return
    }

    const { value, soldOut: isSoldOut } = calculateCurrentValue(startedAt, intervals)
    setDisplayValue(value)

    if (isSoldOut && !soldOut) {
      setSoldOut(true)
      onSoldOut?.()
    }
  }, [startedAt, isActive, intervals, soldOut, manualSoldOut, onSoldOut])

  // Poll frequently for smooth updates
  useEffect(() => {
    if (manualSoldOut) {
      // Manual sold out doesn't need timer updates
      return
    }

    if (!startedAt || !isActive || intervals.length === 0) {
      setDisplayValue(null)
      setSoldOut(false)
      return
    }

    // Initial update
    updateValue()

    // Update every 100ms for responsive feel
    const interval = setInterval(updateValue, 100)

    return () => clearInterval(interval)
  }, [startedAt, isActive, intervals, manualSoldOut, updateValue])

  // If manual sold out is enabled, show sold out immediately
  if (manualSoldOut && isActive) {
    return (
      <div className='absolute top-2 right-2 z-10 rounded-full px-3 py-1.5 font-bold text-sm shadow-lg bg-red-600 text-white animate-pulse'>
        SOLD OUT
      </div>
    )
  }

  // Don't render if not active or no start time
  if (!isActive || !startedAt || displayValue === null) {
    return null
  }

  // Determine color based on value
  const getColorClasses = () => {
    if (soldOut || displayValue === 0) {
      return 'bg-red-600 text-white'
    }
    if (displayValue <= 10) {
      return 'bg-red-500 text-white animate-pulse'
    }
    if (displayValue <= 30) {
      return 'bg-orange-500 text-white'
    }
    return 'bg-green-500 text-white'
  }

  return (
    <div className={`absolute top-2 right-2 z-10 rounded-full px-3 py-1.5 font-bold text-sm shadow-lg ${getColorClasses()}`}>
      {soldOut ? 'SOLD OUT' : displayValue}
    </div>
  )
}
