'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import ProductCard from './ProductCard'
import PasswordProductCard from './PasswordProductCard'
import CartModal, { CartItem } from './CartModal'
import { useShopifyCollection, sortSwingersProducts } from '@/hooks/useShopifyCollection'

interface ProductsViewProps {
  isVisible: boolean
  cartItems: CartItem[]
  onAddToCart: (product: { name: string; price: number; size?: string; image?: string; variantId?: string; quantityAvailable?: number }) => void
  onRemoveFromCart: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onCheckout: () => void
}

export default function ProductsView({
  isVisible,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout
}: ProductsViewProps) {
  // Fetch products from Shopify collections
  const { products: swingersProducts, loading: swingersLoading } = useShopifyCollection('swingers', sortSwingersProducts)
  const { products: preSwingersProducts, loading: preSwingersLoading } = useShopifyCollection('pre-swingers')

  // Track which cards are revealed (showing heart logo)
  // Using string keys like 'swingers-0', 'preswingers-0' to differentiate collections
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({})

  const mobileCartRef = useRef<HTMLDivElement>(null)
  const desktopCartRef = useRef<HTMLDivElement>(null)
  const desktopScrollContainerRef = useRef<HTMLDivElement>(null)

  // Arrow key navigation for desktop product grid
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const container = desktopScrollContainerRef.current
      if (!container) return

      e.preventDefault()
      container.scrollBy({
        top: e.key === 'ArrowDown' ? 400 : -400,
        behavior: 'smooth'
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  const revealCard = (key: string) => {
    setRevealedCards(prev => ({ ...prev, [key]: true }))
  }

  const hideCard = (key: string) => {
    setRevealedCards(prev => ({ ...prev, [key]: false }))
  }

  const scrollToCart = () => {
    // Check if we're on mobile or desktop and scroll to the appropriate cart
    if (window.innerWidth < 768) {
      mobileCartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      desktopCartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Check if a product is the hidden/password-protected item
  const isHiddenProduct = (product: { name: string }) =>
    product.name.toLowerCase().includes('+ more') || product.name.toLowerCase().includes('hidden')

  // Render a product card
  const renderProductCard = (
    key: string,
    card: React.ReactNode
  ) => {
    return (
      <div className='relative'>
        {card}
      </div>
    )
  }

  // Render cart with heart logo reveal
  const renderCart = (isMobile: boolean = false) => {
    const cartKey = 'cart'

    return (
      <div className='relative'>
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
        {revealedCards[cartKey] && (
          <div
            className='absolute inset-0 flex items-center justify-center bg-black rounded-sm cursor-pointer overflow-hidden z-10'
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
        )}
      </div>
    )
  }

  const productsReady = !swingersLoading && swingersProducts.length > 0

  return (
    <>
      <div
        className={`fixed inset-0 z-30 flex flex-col items-center transition-opacity duration-500 ${
          isVisible && productsReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingTop: 'calc(var(--ticker-height, 32px) + 52px)',
        }}
      >
        {/* Mobile Layout - Single column, centered, clean scroll */}
        <div className='md:hidden w-full h-full overflow-y-auto overscroll-y-contain scrollbar-hide'>
          <div
            className='flex flex-col gap-3 w-full max-w-[360px] mx-auto px-4 pb-20 pt-1'
          >
            {/* SWINGERS Collection */}
            {swingersProducts.map((product, index) => {
              const key = `swingers-${index}`
              return (
                <div key={product.id} className='w-full'>
                  {isHiddenProduct(product)
                    ? renderProductCard(
                        key,
                        <PasswordProductCard
                          product={product}
                          onClose={() => revealCard(key)}
                          onAddToCart={onAddToCart}
                        />
                      )
                    : renderProductCard(
                        key,
                        <ProductCard
                          product={product}
                          onClose={() => revealCard(key)}
                          onAddToCart={onAddToCart}
                        />
                      )
                  }
                </div>
              )
            })}

            {/* PRE SWINGERS Collection */}
            {preSwingersProducts.map((product, index) => {
              const key = `preswingers-${index}`
              return (
                <div key={product.id} className='w-full'>
                  {renderProductCard(
                    key,
                    <ProductCard
                      product={product}
                      onClose={() => revealCard(key)}
                      onAddToCart={onAddToCart}
                    />
                  )}
                </div>
              )
            })}

            {/* Cart Section - At the bottom */}
            <div ref={mobileCartRef} className='w-full'>
              {renderCart(true)}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Grid with vertical scroll */}
        <div ref={desktopScrollContainerRef} className='hidden md:flex items-start justify-center w-full h-full px-4 overflow-y-auto scrollbar-hide'>
          <div
            className='w-full max-w-[1400px] py-4'
          >
            {/* SWINGERS Collection Grid */}
            <div className='grid grid-cols-4 gap-4'>
              {swingersProducts.map((product, index) => {
                const key = `swingers-${index}`
                return (
                  <div key={product.id}>
                    {isHiddenProduct(product)
                      ? renderProductCard(
                          key,
                          <PasswordProductCard
                            product={product}
                            onClose={() => revealCard(key)}
                            onAddToCart={onAddToCart}
                          />
                        )
                      : renderProductCard(
                          key,
                          <ProductCard
                            product={product}
                            onClose={() => revealCard(key)}
                            onAddToCart={onAddToCart}
                          />
                        )
                    }
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
                      {renderProductCard(
                        key,
                        <ProductCard
                          product={product}
                          onClose={() => revealCard(key)}
                          onAddToCart={onAddToCart}
                        />
                      )}
                    </div>
                  )
                })}
                {/* Cart - At the end of PRE SWINGERS grid */}
                <div ref={desktopCartRef}>
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
