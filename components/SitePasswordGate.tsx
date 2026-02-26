'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function SitePasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [showError, setShowError] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isVerifying || !password.trim()) return

    setIsVerifying(true)
    try {
      const res = await fetch('/api/site-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (data.success) {
        onAuthenticated()
      } else {
        setIsShaking(true)
        setShowError(true)
        setTimeout(() => setIsShaking(false), 500)
        setTimeout(() => setShowError(false), 2000)
      }
    } catch {
      setIsShaking(true)
      setShowError(true)
      setTimeout(() => setIsShaking(false), 500)
      setTimeout(() => setShowError(false), 2000)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black">
      <div className="flex flex-col items-center space-y-6">
        <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] relative">
          <Image src="/h.png" alt="h" fill sizes="100px" className="object-contain" />
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-[200px] md:max-w-[240px]">
          <div className={isShaking ? 'animate-shake' : ''}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setShowError(false) }}
              placeholder="enter here."
              className={`w-full bg-white border-2 text-center py-2 px-4 text-xs md:text-sm focus:outline-none transition-colors ${
                showError
                  ? 'border-red-500 text-red-500 placeholder:text-red-300'
                  : 'border-white text-black focus:border-blue-500 placeholder:text-gray-400'
              }`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
            />
          </div>
          {showError && (
            <p className="text-red-500 text-[10px] md:text-xs mt-2 text-center animate-fade-in">
              incorrect password
            </p>
          )}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full mt-4 bg-white hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all border-2 border-white text-black font-bold cursor-pointer px-3 py-2 text-xs"
          >
            {isVerifying ? 'verifying...' : 'submit'}
          </button>
        </form>
      </div>
    </div>
  )
}
