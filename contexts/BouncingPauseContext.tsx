'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

interface ModalPosition {
  x: number
  y: number
  width: number
  height: number
}

interface BouncingPauseContextType {
  isPaused: boolean
  focusedModalId: string | null
  modals: Map<string, ModalPosition>
  setFocused: (id: string | null) => void
  registerModal: (id: string, position: ModalPosition) => void
  unregisterModal: (id: string) => void
}

const BouncingPauseContext = createContext<BouncingPauseContextType | null>(null)

export function BouncingPauseProvider({ children }: { children: ReactNode }) {
  const [focusedModalId, setFocusedModalId] = useState<string | null>(null)
  const [modals, setModals] = useState<Map<string, ModalPosition>>(new Map())
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setFocused = useCallback((id: string | null) => {
    // Clear any pending resume timeout
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current)
      resumeTimeoutRef.current = null
    }

    if (id) {
      // Immediate pause when focusing
      setFocusedModalId(id)
    } else {
      // Debounced resume (300ms delay) to prevent flickering
      resumeTimeoutRef.current = setTimeout(() => {
        setFocusedModalId(null)
      }, 300)
    }
  }, [])

  const registerModal = useCallback((id: string, position: ModalPosition) => {
    setModals(prev => {
      const next = new Map(prev)
      next.set(id, position)
      return next
    })
  }, [])

  const unregisterModal = useCallback((id: string) => {
    setModals(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  return (
    <BouncingPauseContext.Provider
      value={{
        isPaused: focusedModalId !== null,
        focusedModalId,
        modals,
        setFocused,
        registerModal,
        unregisterModal,
      }}
    >
      {children}
    </BouncingPauseContext.Provider>
  )
}

export function useBouncingPause() {
  const context = useContext(BouncingPauseContext)
  if (!context) {
    // Fallback for components used outside the provider
    return {
      isPaused: false,
      focusedModalId: null,
      modals: new Map<string, ModalPosition>(),
      setFocused: () => {},
      registerModal: () => {},
      unregisterModal: () => {},
    }
  }
  return context
}
