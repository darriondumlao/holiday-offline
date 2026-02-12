'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import ProductCard from './ProductCard'
import MobileProductCard from './MobileProductCard'
import PreSwingersProductCard from './PreSwingersProductCard'
import PreSwingersMobileProductCard from './PreSwingersMobileProductCard'
import CartModal, { CartItem } from './CartModal'
import { useSwingersCollection } from '@/hooks/useSwingersCollection'
import { usePreSwingersCollection } from '@/hooks/usePreSwingersCollection'

interface ProductsViewProps {
  isVisible: boolean
  showAfterSpotlight?: boolean
  cartItems: CartItem[]
  onAddToCart: (product: { name: string; price: number; size?: string; image?: string; variantId?: string; quantityAvailable?: number }) => void
  onRemoveFromCart: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onCheckout: () => void
}

export default function ProductsView({
  isVisible,
  showAfterSpotlight = false,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout
}: ProductsViewProps) {
  // Fetch products from Shopify collections
  const { products: swingersProducts, loading: swingersLoading } = useSwingersCollection()
  const { products: preSwingersProducts, loading: preSwingersLoading } = usePreSwingersCollection()

  // Track which cards are revealed (showing heart logo)
  // Using string keys like 'swingers-0', 'preswingers-0' to differentiate collections
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({})

  const [topRowVisible, setTopRowVisible] = useState(false)
  const [bottomRowVisible, setBottomRowVisible] = useState(false)
  const cartRef = useRef<HTMLDivElement>(null)

  // Staggered animation after spotlight completes
  useEffect(() => {
    if (showAfterSpotlight && isVisible) {
      // Top row fades in shortly after countdown
      const topRowTimer = setTimeout(() => {
        setTopRowVisible(true)
      }, 100)

      // Bottom row fades in after top row
      const bottomRowTimer = setTimeout(() => {
        setBottomRowVisible(true)
      }, 200)

      return () => {
        clearTimeout(topRowTimer)
        clearTimeout(bottomRowTimer)
      }
    }
  }, [showAfterSpotlight, isVisible])

  const revealCard = (key: string) => {
    setRevealedCards(prev => ({ ...prev, [key]: true }))
  }

  const hideCard = (key: string) => {
    setRevealedCards(prev => ({ ...prev, [key]: false }))
  }

  const scrollToCart = () => {
    cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Render a product card with heart logo reveal functionality - mobile version
  const renderMobileProductCard = (
    key: string,
    card: React.ReactNode
  ) => {
    if (revealedCards[key]) {
      return (
        <div
          className='flex items-center justify-center bg-black rounded-lg cursor-pointer aspect-[4/5] overflow-hidden'
          onClick={() => hideCard(key)}
        >
          <Image
            src="/HEARTLOGO.png"
            alt="Holiday Heart"
            width={120}
            height={120}
            className="object-contain hover:scale-110 transition-transform duration-300"
          />
        </div>
      )
    }
    return card
  }

  // Render a product card with heart logo reveal functionality - desktop version
  const renderDesktopProductCard = (
    key: string,
    card: React.ReactNode
  ) => {
    if (revealedCards[key]) {
      return (
        <div
          className='flex items-center justify-center bg-black rounded-sm cursor-pointer h-[288px] overflow-hidden'
          onClick={() => hideCard(key)}
        >
          <Image
            src="/HEARTLOGO.png"
            alt="Holiday Heart"
            width={150}
            height={150}
            className="object-contain hover:scale-110 transition-transform duration-300"
          />
        </div>
      )
    }
    return card
  }

  // Render cart with heart logo reveal
  const renderCart = (isMobile: boolean = false) => {
    const cartKey = 'cart'

    if (revealedCards[cartKey]) {
      return (
        <div
          className={`flex items-center justify-center bg-black rounded-sm cursor-pointer overflow-hidden ${
            isMobile ? 'aspect-[4/5]' : 'h-[288px]'
          }`}
          onClick={() => hideCard(cartKey)}
        >
          <Image
            src="/HEARTLOGO.png"
            alt="Holiday Heart"
            width={isMobile ? 120 : 150}
            height={isMobile ? 120 : 150}
            className="object-contain hover:scale-110 transition-transform duration-300"
          />
        </div>
      )
    }

    return (
      <div className={isMobile ? 'rounded-sm overflow-hidden' : ''}>
        <CartModal
          title='cart'
          onClose={() => revealCard(cartKey)}
          items={cartItems}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveFromCart}
          onCheckout={onCheckout}
          isMobileEmbedded={isMobile}
        />
      </div>
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 flex flex-col items-center transition-opacity duration-500 ${
          isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingTop: 'calc(var(--ticker-height, 32px) + 52px)',
        }}
      >
        {/* Mobile Layout - Single column, centered, clean scroll */}
        <div className='md:hidden w-full h-full overflow-y-auto overscroll-y-contain scrollbar-hide'>
          <div
            className={`flex flex-col gap-3 w-full max-w-[360px] mx-auto px-4 pb-20 pt-1 transition-all duration-700 ease-out ${
              topRowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}
          >
            {/* SWINGERS Collection */}
            {swingersProducts.map((product, index) => {
              const key = `swingers-${index}`
              return (
                <div key={product.id} className='w-full'>
                  {renderMobileProductCard(
                    key,
                    <MobileProductCard
                      product={product}
                      onClose={() => revealCard(key)}
                      onAddToCart={onAddToCart}
                    />
                  )}
                </div>
              )
            })}

            {/* PRE SWINGERS Collection */}
            {preSwingersProducts.map((product, index) => {
              const key = `preswingers-${index}`
              return (
                <div key={product.id} className='w-full'>
                  {renderMobileProductCard(
                    key,
                    <PreSwingersMobileProductCard
                      product={product}
                      onClose={() => revealCard(key)}
                      onAddToCart={onAddToCart}
                    />
                  )}
                </div>
              )
            })}

            {/* Cart Section - At the bottom */}
            <div ref={cartRef} className='w-full'>
              {renderCart(true)}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Grid with vertical scroll */}
        <div className='hidden md:flex items-start justify-center w-full h-full px-4 overflow-y-auto scrollbar-hide'>
          <div
            className={`w-full max-w-[1400px] py-4 transition-all duration-700 ease-out ${
              topRowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}
          >
            {/* SWINGERS Collection Grid */}
            <div className='grid grid-cols-4 gap-4'>
              {swingersProducts.map((product, index) => {
                const key = `swingers-${index}`
                return (
                  <div key={product.id}>
                    {renderDesktopProductCard(
                      key,
                      <ProductCard
                        title='swingers'
                        productName={product.title.toLowerCase()}
                        productDetail={`$${product.variants[0]?.price || 60}`}
                        onClose={() => revealCard(key)}
                        product={product}
                        onAddToCart={onAddToCart}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* PRE SWINGERS Collection Grid */}
            {preSwingersProducts.length > 0 && (
              <div className='grid grid-cols-4 gap-4 mt-4'>
                {preSwingersProducts.map((product, index) => {
                  const key = `preswingers-${index}`
                  return (
                    <div key={product.id}>
                      {renderDesktopProductCard(
                        key,
                        <PreSwingersProductCard
                          product={product}
                          onClose={() => revealCard(key)}
                          onAddToCart={onAddToCart}
                        />
                      )}
                    </div>
                  )
                })}
                {/* Cart - At the end of PRE SWINGERS grid */}
                <div ref={cartRef}>
                  {renderCart(false)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to Cart Indicator - Right side (both mobile and desktop) */}
      <button
        onClick={scrollToCart}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isVisible && cartItems.length > 0
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className='bg-green-500 rounded-l-lg py-3 px-2 shadow-xl flex flex-col items-center gap-1'>
          {/* Cart count badge */}
          <span className='bg-white text-green-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
            {cartItems.length}
          </span>

          {/* Vertical text */}
          <span
            className='text-white text-[10px] font-bold uppercase tracking-wider'
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            cart
          </span>
        </div>
      </button>
    </>
  )
}
