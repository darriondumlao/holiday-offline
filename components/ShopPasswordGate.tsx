'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ShopPasswordGateProps {
  children: React.ReactNode
  isVisible: boolean
  onAuthChange?: (isAuthenticated: boolean) => void
}

// Timeout for auth check to prevent infinite loading state
const AUTH_CHECK_TIMEOUT = 5000

export default function ShopPasswordGate({ children, isVisible, onAuthChange }: ShopPasswordGateProps) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = loading
  const [requiresPassword, setRequiresPassword] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const isMountedRef = useRef(true)

  // Check authentication status on mount
  useEffect(() => {
    isMountedRef.current = true
    let authCheckCompleted = false

    // Timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && !authCheckCompleted) {
        // Timeout reached - fail open for UX
        setIsAuthenticated(true)
        setRequiresPassword(false)
      }
    }, AUTH_CHECK_TIMEOUT)

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/shop-auth')
        const data = await response.json()
        authCheckCompleted = true
        if (isMountedRef.current) {
          setIsAuthenticated(data.isAuthenticated)
          setRequiresPassword(data.requiresPassword)
          // Notify parent of auth state
          onAuthChange?.(data.isAuthenticated || !data.requiresPassword)
        }
      } catch {
        // On error, assume no password required (fail open for UX)
        authCheckCompleted = true
        if (isMountedRef.current) {
          setIsAuthenticated(true)
          setRequiresPassword(false)
          onAuthChange?.(true)
        }
      }
    }

    checkAuth()

    return () => {
      isMountedRef.current = false
      clearTimeout(timeoutId)
    }
  }, [onAuthChange])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!password.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/shop-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
        setPassword('')
        onAuthChange?.(true)
      } else {
        setError('incorrect password')
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
        setTimeout(() => setError(''), 3000)
      }
    } catch {
      setError('something went wrong')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [password, isSubmitting, onAuthChange])

  // Still loading auth status
  if (isAuthenticated === null) {
    return (
      <div
        className={`fixed inset-0 z-30 flex items-center justify-center transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ paddingTop: 'calc(var(--ticker-height, 32px) + 52px)' }}
      >
        <div className="text-white text-sm tracking-wider animate-pulse">loading...</div>
      </div>
    )
  }

  // No password required or already authenticated - show children
  if (!requiresPassword || isAuthenticated) {
    return <>{children}</>
  }

  // Show password gate when shop view is visible but not authenticated
  return (
    <>
      {/* Password Gate Overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black"
            style={{ paddingTop: 'calc(var(--ticker-height, 32px) + 52px)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center justify-center text-center px-4"
            >
              {/* Lock Icon */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-6"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-12 h-12 text-gray-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>

              {/* Title */}
              <h2 className="text-white text-lg sm:text-xl tracking-widest font-light mb-2">
                shop is locked
              </h2>
              <p className="text-gray-500 text-xs tracking-wider mb-8">
                enter password to access
              </p>

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="w-full max-w-xs" aria-label="Shop password form">
                <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
                  <label htmlFor="shop-password" className="sr-only">Shop password</label>
                  <input
                    id="shop-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="enter password"
                    aria-describedby={error ? 'password-error' : undefined}
                    aria-invalid={error ? 'true' : 'false'}
                    className={`w-full bg-transparent border-b-2 text-white text-center py-3 px-4 text-base focus:outline-none transition-colors tracking-wider placeholder:text-gray-600 ${
                      error
                        ? 'border-red-500 text-red-400'
                        : 'border-gray-600 focus:border-white'
                    }`}
                    disabled={isSubmitting}
                    autoComplete="off"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                  />
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      id="password-error"
                      role="alert"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-xs mt-3 tracking-wider"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !password.trim()}
                  className="mt-6 w-full text-blue-500 hover:text-blue-400 disabled:text-gray-600 transition-colors tracking-widest text-xs py-2"
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'verifying...' : 'unlock'}
                </motion.button>
              </form>

              {/* Hint */}
              <p className="text-gray-700 text-[10px] tracking-wider mt-8">
                coming soon
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden children when not authenticated */}
      <div className={isVisible ? 'hidden' : ''}>
        {children}
      </div>
    </>
  )
}
