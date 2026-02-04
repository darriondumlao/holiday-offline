'use client'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
  image?: string
  variantId?: string
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
  const handleCheckout = () => {
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
    <div className={`w-full select-none ${isMobileEmbedded ? 'rounded-sm overflow-hidden' : ''}`}>
      {/* Header */}
      <div className={`${isMobileEmbedded ? 'bg-green-600' : 'bg-blue-600'} px-3 py-1.5 flex items-center justify-between rounded-t-sm`}>
        <h2 className={`text-white font-bold lowercase ${isMobileEmbedded ? 'text-[10px]' : 'text-sm'}`}>
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

      {/* Content Area - Fixed height to match other modals */}
      <div className='bg-white h-[216px] flex flex-col'>
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
                      className='w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all rounded text-black font-bold text-sm'
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

      {/* Checkout Button - Footer */}
      <div className='bg-green-500 px-2 py-2 flex items-center justify-center gap-2 rounded-b-sm'>
        <button
          onClick={handleCheckout}
          disabled={items.length === 0}
          className={`flex-1 bg-gray-200 border-2 border-black text-black font-bold px-3 py-2 text-xs uppercase transition-all ${
            items.length > 0
              ? 'hover:bg-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          checkout
        </button>
      </div>
    </div>
  )
}
