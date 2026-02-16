'use client'

import { useRef, useState } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
  image?: string
  variantId?: string
  quantityAvailable?: number
}

interface CartModalProps {
  title: string
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity?: (id: string, quantity: number) => void
  onRemoveItem?: (id: string) => void
  onCheckout?: () => void
  isMobileEmbedded?: boolean
}

export default function CartModal({
  title,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isMobileEmbedded = false
}: CartModalProps) {
  const bellAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isBellPlaying, setIsBellPlaying] = useState(false)

  const playBellSound = () => {
    if (isBellPlaying) return

    // Pause the main music
    window.dispatchEvent(new CustomEvent('pauseForBell'))

    setIsBellPlaying(true)

    // Create and play the bell sound
    const audio = new Audio('/swingers-bell.mp3')
    bellAudioRef.current = audio

    audio.play().catch(console.error)

    // When the bell sound ends, resume music and re-enable button
    audio.onended = () => {
      setIsBellPlaying(false)
      window.dispatchEvent(new CustomEvent('resumeAfterBell'))
    }
  }

  const handleCheckout = () => {
    // If cart is empty, just play the bell sound
    if (items.length === 0) {
      playBellSound()
      return
    }

    if (onCheckout) {
      onCheckout()
    } else {
      // Default: Open Shopify checkout (placeholder URL)
      window.open('https://holidaybrand.co/checkout', '_blank', 'noopener,noreferrer')
    }
  }

  // Calculate cart totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className={`w-full select-none ${isMobileEmbedded ? 'overflow-hidden bg-black rounded-sm' : ''}`}>
      {/* Header - matches ProductCard header */}
      <div
        className='relative rounded-t-sm bg-cover bg-center overflow-hidden'
        style={{ backgroundImage: 'url(/swingers-1.png)' }}
      >
        {/* Dark overlay to dim the pattern */}
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative px-3 py-1.5 flex items-center justify-between gap-2'>
          <h2
            className={`text-white font-bold lowercase truncate flex-1 text-sm`}
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}
          >
            {title}
            {totalItems > 0 && (
              <span className='ml-1.5 font-normal'>
                ({totalItems}) - ${subtotal.toFixed(2)}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className='bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-0.5 cursor-pointer'
            aria-label='Close'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='white'
              className='w-3.5 h-3.5'
            >
              <path
                fillRule='evenodd'
                d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area - Mobile: matches MobileProductCard (280px image + 24px see details = 304px), Desktop: 248px */}
      <div className='h-[304px] md:h-[248px] flex flex-col bg-white'>
        {/* Cart Items - Scrollable area */}
        <div className='flex-1 px-4 py-2 overflow-y-auto scrollbar-hide'>
          {items.length === 0 ? (
            <div className='flex items-center justify-center h-full'>
              <span className='text-gray-400 text-sm'>cart is empty</span>
            </div>
          ) : (
            <div className='space-y-2'>
              {items.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center justify-between border-b border-gray-200 pb-2 last:border-0'
                >
                  {/* Product Name and Size - Stacked layout */}
                  <div className='flex-1 min-w-0'>
                    <div className='text-black text-xs font-bold uppercase truncate'>
                      {item.name}
                    </div>
                    {item.size && item.size.toLowerCase() !== 'default title' && (
                      <div className='text-gray-500 text-xs'>
                        Size: {item.size}
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className='flex items-center gap-1 mx-2'>
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) {
                          onRemoveItem?.(item.id)
                        } else {
                          onUpdateQuantity?.(item.id, item.quantity - 1)
                        }
                      }}
                      className='w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all rounded text-black font-bold text-sm'
                      aria-label='Decrease quantity'
                    >
                      −
                    </button>
                    <span className='w-6 text-center text-xs font-bold text-black'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                      disabled={item.quantityAvailable !== undefined && item.quantity >= item.quantityAvailable}
                      className={`w-6 h-6 flex items-center justify-center transition-all rounded text-black font-bold text-sm ${
                        item.quantityAvailable !== undefined && item.quantity >= item.quantityAvailable
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 hover:bg-gray-300 active:scale-95'
                      }`}
                      aria-label='Increase quantity'
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className='text-red-500 hover:text-red-700 flex-shrink-0'
                      aria-label='Remove item'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        className='w-4 h-4'
                      >
                        <path
                          fillRule='evenodd'
                          d='M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer - matches ProductCard footer with checkout button */}
      <div className='relative rounded-b-sm bg-cover bg-center overflow-hidden' style={{ backgroundImage: 'url(/swingers-1.png)' }}>
        {/* Dark overlay to dim the pattern */}
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative px-2 py-2 flex justify-center'>
          <button
            onClick={handleCheckout}
            disabled={isBellPlaying}
            className={`text-white font-bold text-xs tracking-wide border border-white/60 rounded px-3 py-1 bg-black/40 transition-all ${
              isBellPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:bg-black/60'
            }`}
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
