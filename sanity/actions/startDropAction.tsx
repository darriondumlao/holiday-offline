'use client'

import { useState, useCallback } from 'react'
import { useDocumentOperation, useClient } from 'sanity'
import { PlayIcon, ResetIcon } from '@sanity/icons'

interface StartDropActionProps {
  id: string
  type: string
  draft?: any
  published?: any
  onComplete: () => void
}

export function StartDropAction(props: StartDropActionProps) {
  const { id, type, draft, published, onComplete } = props
  const [isStarting, setIsStarting] = useState(false)
  const client = useClient({ apiVersion: '2024-01' })
  const { patch, publish } = useDocumentOperation(id, type)

  // Only show for limitedDrop documents
  if (type !== 'limitedDrop') {
    return null
  }

  const doc = draft || published
  const hasStarted = !!doc?.startedAt
  const isActive = doc?.isActive

  const handleStartDrop = useCallback(async () => {
    setIsStarting(true)
    try {
      // Set startedAt to current time
      await client
        .patch(id)
        .set({ startedAt: new Date().toISOString() })
        .commit()

      onComplete()
    } catch (error) {
      console.error('Error starting drop:', error)
    } finally {
      setIsStarting(false)
    }
  }, [client, id, onComplete])

  const handleResetDrop = useCallback(async () => {
    setIsStarting(true)
    try {
      // Clear startedAt to reset the drop
      await client
        .patch(id)
        .unset(['startedAt'])
        .commit()

      onComplete()
    } catch (error) {
      console.error('Error resetting drop:', error)
    } finally {
      setIsStarting(false)
    }
  }, [client, id, onComplete])

  // Show Reset button if drop has started
  if (hasStarted) {
    return {
      label: isStarting ? 'Resetting...' : 'Reset Drop',
      icon: ResetIcon,
      tone: 'caution' as const,
      disabled: isStarting,
      onHandle: handleResetDrop,
    }
  }

  // Show Start button if drop hasn't started
  return {
    label: isStarting ? 'Starting...' : 'Start Drop Now',
    icon: PlayIcon,
    tone: 'positive' as const,
    disabled: isStarting || !isActive,
    title: !isActive ? 'Enable "Drop Active" first' : 'Start the countdown now',
    onHandle: handleStartDrop,
  }
}
