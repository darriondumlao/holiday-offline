'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import AudioPlayer, { AudioPlayerHandle } from './AudioPlayer'

type ViewMode = 'offline' | 'shop' | 'vintage'

interface CountdownTimerProps {
  currentView?: ViewMode
  onViewChange?: (view: ViewMode) => void
  showAfterSpotlight?: boolean
  onBagClick?: () => void
  cartItemCount?: number
  modalsHidden?: boolean
  onToggleModals?: () => void
}

// Available time slots for Valentine's Day (8:00pm - 2:00am, 30 min increments)
const TIME_SLOTS = [
  '8:00 PM',
  '8:30 PM',
  '9:00 PM',
  '9:30 PM',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
  '11:30 PM',
  '12:00 AM',
  '12:30 AM',
  '1:00 AM',
  '1:30 AM',
  '2:00 AM',
]

// Reservation Modal Component
function ReservationModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'already'>('idle')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !phone || !selectedTime) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          timeSlot: selectedTime,
          reservationDate: "Valentine's Day 2025 (Feb 14)"
        }),
      })

      const data = await response.json()

      if (data.alreadyReserved) {
        setSubmitStatus('already')
      } else if (data.success) {
        setSubmitStatus('success')
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Modal */}
      <div
        className={`relative bg-black border-2 border-rose-400 rounded-lg p-6 w-full max-w-md transition-transform duration-200 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all rounded-sm p-1"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {submitStatus === 'success' ? (
          <div className="text-center py-4">
            <span className="text-4xl mb-4 block">💕</span>
            <h3 className="text-rose-300 text-xl font-bold mb-2">You&apos;re Reserved!</h3>
            <p className="text-gray-300 text-sm">We&apos;ll see you on Valentine&apos;s Day</p>
          </div>
        ) : submitStatus === 'already' ? (
          <div className="text-center py-4">
            <span className="text-4xl mb-4 block">💝</span>
            <h3 className="text-rose-300 text-xl font-bold mb-2">Already Reserved!</h3>
            <p className="text-gray-300 text-sm">You&apos;re already on our list</p>
          </div>
        ) : (
          <>
            <h2 className="text-rose-300 text-xl font-bold text-center mb-3">Valentine&apos;s Day Reservation</h2>

            {/* Location */}
            <div className="text-center mb-4">
              <p className="text-rose-200/70 text-xs mb-1">Location</p>
              <a
                href="https://maps.apple.com/?address=8020%20Beverly%20Blvd,%20Los%20Angeles,%20CA%2090048&ll=34.0762,-118.3647&q=Swingers%20Hollywood"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-sm hover:text-rose-300 transition-colors underline underline-offset-2"
              >
                Swingers Hollywood
              </a>
              <p className="text-gray-400 text-xs mt-0.5">8020 Beverly Blvd, Los Angeles, CA 90048</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-rose-200/70 text-xs mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-400"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-rose-200/70 text-xs mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-400"
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="block text-rose-200/70 text-xs mb-2">Preferred Time</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`px-1 py-1.5 text-[10px] rounded transition-all ${
                        selectedTime === time
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {!selectedTime && (
                  <p className="text-rose-300/50 text-[10px] mt-1 text-center">Please select a time slot</p>
                )}
              </div>

              {submitStatus === 'error' && (
                <p className="text-red-400 text-xs text-center">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedTime}
                className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 disabled:from-rose-800 disabled:to-rose-900 disabled:cursor-not-allowed text-white font-bold py-2 rounded transition-all active:scale-95"
              >
                {isSubmitting ? 'Reserving...' : 'Reserve My Spot'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

export default function CountdownTimer({ currentView = 'shop', onViewChange, showAfterSpotlight = false, onBagClick, cartItemCount = 0, modalsHidden = false, onToggleModals }: CountdownTimerProps) {
  const [showContent, setShowContent] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const audioPlayerRef = useRef<AudioPlayerHandle>(null)

  // Fade in after spotlight completes (slight stagger after ticker)
  useEffect(() => {
    if (showAfterSpotlight) {
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [showAfterSpotlight])

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
      id="countdown-timer"
      className={`fixed left-0 right-0 z-[65] py-3 transition-all duration-500 bg-black ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ top: 'var(--ticker-height, 40px)' }}
    >
      {/* Desktop: View Selector - absolute positioned on left */}
      {onViewChange && (
        <div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-50">
          <div className="flex items-center bg-gray-800/80 rounded-full p-0.5">
            {(['offline', 'shop'] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-3 py-1 text-[10px] tracking-wider rounded-full transition-all duration-200 ${
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

      {/* Desktop: Right side controls - Hide modals toggle, Cart icon and Audio Player */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 items-center gap-3">
        {/* Hide/Show modals toggle - only on offline view */}
        {onToggleModals && currentView === 'offline' && (
          <button
            onClick={onToggleModals}
            className={`flex items-center justify-center w-8 h-8 transition-all duration-200 hover:scale-110 active:scale-95 ${
              modalsHidden
                ? 'text-gray-500 hover:text-white'
                : 'text-white'
            }`}
            aria-label={modalsHidden ? 'Show modals' : 'Hide modals'}
            title={modalsHidden ? 'Show modals' : 'Hide modals'}
          >
            {modalsHidden ? (
              // Eye with slash icon (modals hidden)
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
              </svg>
            ) : (
              // Eye icon (modals visible)
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
        {/* Cart Icon - shows only on vintage view */}
        {onBagClick && currentView === 'vintage' && (
          <button
            onClick={onBagClick}
            className="relative w-10 h-10 flex items-center justify-center transition-colors touch-manipulation cursor-pointer group"
            aria-label="View Cart"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-7 h-7 transition-all group-active:scale-95 ${
                cartItemCount > 0 ? 'text-orange-400' : 'text-gray-400 group-hover:text-white'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M2 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M8 21a1 1 0 100-2 1 1 0 000 2zM17 21a1 1 0 100-2 1 1 0 000 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[8px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border border-orange-600">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </button>
        )}
        <AudioPlayer ref={audioPlayerRef} />
      </div>

      {/* Desktop: Valentine's Day Reservation Content - temporarily disabled */}
      {/* <div className="hidden md:flex flex-col items-center justify-center select-none px-24">
        <div className="flex items-center justify-center gap-2 text-white text-sm">
          <span className="tracking-wide">Valentine&apos;s Day Reservations Available Now</span>
          <button
            onClick={() => setShowReservationModal(true)}
            className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 active:scale-95 text-white font-bold px-3 py-1 text-xs rounded transition-all"
          >
            RESERVE NOW
          </button>
        </div>
        <p className="text-rose-200/50 text-[10px] mt-0.5 text-center italic">
          *Reservations guarantee a table but walk-in&apos;s are welcome and encouraged*
        </p>
      </div> */}

      {/* Mobile: Single row - switcher | valentine's | audio */}
      <div className="flex md:hidden items-center justify-between px-2">
        {/* Left: Switcher */}
        {onViewChange && (
          <div className="flex items-center bg-gray-800/80 rounded-full p-[2px] flex-shrink-0">
            {(['offline', 'shop'] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-1.5 py-0.5 text-[7px] font-medium tracking-wider rounded-full transition-all duration-200 touch-manipulation ${
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
        {/* Center: Valentine's content - temporarily disabled */}
        {/* <div className="flex flex-col items-center flex-1 mx-1">
          <div className="flex items-center justify-center gap-1.5 text-white text-xs">
            <span className="tracking-wide whitespace-nowrap">Valentine&apos;s Day Reservations</span>
            <button
              onClick={() => setShowReservationModal(true)}
              className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 active:scale-95 text-white font-bold px-2 py-1 text-[9px] rounded transition-all whitespace-nowrap"
            >
              RESERVE NOW
            </button>
          </div>
          <p className="text-rose-200/50 text-[6px] text-center italic">
            *Reservations guarantee a table but walk-in&apos;s are welcome and encouraged*
          </p>
        </div> */}
        {/* Right: Hide toggle, Cart, Audio Player */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Hide/Show modals toggle - mobile, only on offline view */}
          {onToggleModals && currentView === 'offline' && (
            <button
              onClick={onToggleModals}
              className={`flex items-center justify-center w-7 h-7 transition-all duration-200 touch-manipulation active:scale-90 ${
                modalsHidden
                  ? 'text-gray-500'
                  : 'text-white'
              }`}
              aria-label={modalsHidden ? 'Show modals' : 'Hide modals'}
            >
              {modalsHidden ? (
                // Eye with slash icon (modals hidden)
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                  <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                </svg>
              ) : (
                // Eye icon (modals visible)
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          {onBagClick && currentView === 'vintage' && (
            <button
              onClick={onBagClick}
              className="relative w-7 h-7 flex items-center justify-center transition-colors touch-manipulation cursor-pointer group"
              aria-label="View Cart"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-5 h-5 transition-all group-active:scale-95 ${
                  cartItemCount > 0 ? 'text-orange-400' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M2 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M8 21a1 1 0 100-2 1 1 0 000 2zM17 21a1 1 0 100-2 1 1 0 000 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[7px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 border border-orange-600">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>
          )}
          <AudioPlayer ref={audioPlayerRef} />
        </div>
      </div>

      {/* Reservation Modal - temporarily disabled */}
      {/* {showReservationModal && (
        <ReservationModal onClose={() => setShowReservationModal(false)} />
      )} */}
    </div>
  )
}
