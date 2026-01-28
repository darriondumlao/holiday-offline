'use client'

import { useEffect } from 'react'

interface CheckoutOverlayProps {
  isOpen: boolean
  checkoutUrl: string | null
  onClose: () => void
}

export default function CheckoutOverlay({ isOpen, checkoutUrl, onClose }: CheckoutOverlayProps) {
  useEffect(() => {
    if (isOpen && checkoutUrl) {
      // Calculate popup position (centered)
      const width = 480
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      // Open popup window
      const popup = window.open(
        checkoutUrl,
        'shopify-checkout',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      )

      // Check if popup was blocked
      if (!popup || popup.closed) {
        // Fallback: open in new tab
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
        onClose()
        return
      }

      // Poll to detect when popup is closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          onClose()
        }
      }, 500)

      return () => {
        clearInterval(checkClosed)
      }
    }
  }, [isOpen, checkoutUrl, onClose])

  // Show a subtle overlay while checkout popup is open
  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center cursor-pointer'
      onClick={onClose}
    >
      {/* Semi-transparent background */}
      <div className='absolute inset-0 bg-black/70' />

      {/* Message */}
      <div
        className='relative z-10 bg-white px-8 py-6 rounded-sm text-center animate-fade-in'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='text-black font-bold text-lg uppercase mb-2'>Checkout Open</div>
        <div className='text-gray-600 text-sm mb-4'>Complete your purchase in the popup window</div>
        <button
          onClick={onClose}
          className='bg-black hover:bg-gray-800 text-white font-bold px-6 py-2 text-xs uppercase transition-all hover:scale-105 active:scale-95'
        >
          Close
        </button>
      </div>
    </div>
  )
}
