'use client'

import { useState, useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import ShoeProductCard from './ShoeProductCard'
import PasswordProductCard from './PasswordProductCard'
import MobileProductCard from './MobileProductCard'
import MobileShoeCard from './MobileShoeCard'
import MobilePasswordCard from './MobilePasswordCard'
import CartModal, { CartItem } from './CartModal'
import { useNineYearCollection } from '@/hooks/useNineYearCollection'
import { createCheckoutClient } from '@/lib/shopify'

interface ProductsViewProps {
  isVisible: boolean
  showAfterSpotlight?: boolean
  onOpenCoyoteBag?: () => void
  onCartAddCallback?: (callback: (product: { name: string; price: number; size?: string; image?: string; variantId?: string }) => void) => void
}

const CART_STORAGE_KEY = 'holiday-cart'

// Letter assignments for HOLIDAY - Desktop: top row H, O, L, I - bottom row D, A, Y
const DESKTOP_LETTER_MAP = {
  hoodie01: 'H',
  hoodie02: 'O',
  hoodie03: 'L',
  teeShirt: 'I',
  passwordProduct: 'D',
  shoe: 'A',
  cart: 'Y',
}

// Mobile letter assignments - Shoe is at top with H, hoodies shift to O, L, I
const MOBILE_LETTER_MAP = {
  shoe: 'H',        // Shoe at top gets H
  hoodie01: 'O',    // Hoodies shift down
  hoodie02: 'L',
  hoodie03: 'I',
  teeShirt: 'D',    // Tee shifts to D
  passwordProduct: 'A', // Password shifts to A
  cart: 'Y',
}

// Combined type for all product keys
type ProductKey = keyof typeof DESKTOP_LETTER_MAP

export default function ProductsView({ isVisible, showAfterSpotlight = false, onOpenCoyoteBag, onCartAddCallback }: ProductsViewProps) {
  // Fetch products from Shopify "nine-year" collection
  const { products: collectionProducts, loading: productsLoading } = useNineYearCollection()

  // Track which letters are revealed when X is clicked
  const [revealedLetters, setRevealedLetters] = useState<Record<ProductKey, boolean>>({
    hoodie01: false,
    hoodie02: false,
    hoodie03: false,
    teeShirt: false,
    passwordProduct: false,
    shoe: false,
    cart: false,
  })

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [topRowVisible, setTopRowVisible] = useState(false)
  const [bottomRowVisible, setBottomRowVisible] = useState(false)
  const mobileCartRef = useRef<HTMLDivElement>(null)

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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        setCartItems(parsed)
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product: { name: string; price: number; size?: string; image?: string; variantId?: string }) => {
    const id = `${product.name}-${product.size || 'default'}-${Date.now()}`
    const newItem: CartItem = {
      id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: product.size,
      image: product.image,
      variantId: product.variantId,
    }
    setCartItems(prev => [...prev, newItem])
  }

  // Expose addToCart callback to parent component
  useEffect(() => {
    if (onCartAddCallback) {
      onCartAddCallback(addToCart)
    }
  }, [onCartAddCallback])

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id)
      return
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const handleCheckout = async () => {
    // Filter items with valid variantIds
    const lineItems = cartItems
      .filter(item => item.variantId)
      .map(item => ({
        variantId: item.variantId!,
        quantity: item.quantity,
      }))

    if (lineItems.length === 0) {
      // Fallback if no valid variants
      window.location.href = 'https://holidaybrand.co'
      return
    }

    try {
      const checkout = await createCheckoutClient(lineItems)
      // Direct redirect to Shopify checkout
      window.location.href = checkout.webUrl
    } catch (error) {
      console.error('Error creating checkout:', error)
      // Fallback to main store on error
      window.location.href = 'https://holidaybrand.co'
    }
  }

  const revealLetter = (productKey: ProductKey) => {
    setRevealedLetters(prev => ({ ...prev, [productKey]: true }))
  }

  const hideLetter = (productKey: ProductKey) => {
    setRevealedLetters(prev => ({ ...prev, [productKey]: false }))
  }

  const scrollToMobileCart = () => {
    mobileCartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Render a product card with letter reveal functionality - mobile version (uses MOBILE_LETTER_MAP)
  const renderMobileProductCard = (
    key: ProductKey,
    card: React.ReactNode
  ) => {
    if (revealedLetters[key]) {
      return (
        <div
          className='flex items-center justify-center bg-black rounded-lg cursor-pointer aspect-[4/5]'
          onClick={() => hideLetter(key)}
        >
          <span
            className='text-white text-[80px] leading-none select-none hover:scale-110 transition-transform duration-300'
            style={{ fontFamily: "'Holiday Content', sans-serif" }}
          >
            {MOBILE_LETTER_MAP[key]}
          </span>
        </div>
      )
    }
    return card
  }

  // Render a product card with letter reveal functionality - desktop version (uses DESKTOP_LETTER_MAP)
  const renderDesktopProductCard = (
    key: ProductKey,
    card: React.ReactNode
  ) => {
    if (revealedLetters[key]) {
      return (
        <div
          className='flex items-center justify-center bg-black rounded-sm cursor-pointer h-[288px]'
          onClick={() => hideLetter(key)}
        >
          <span
            className='text-white text-[120px] leading-none select-none hover:scale-110 transition-transform duration-300'
            style={{ fontFamily: "'Holiday Content', sans-serif" }}
          >
            {DESKTOP_LETTER_MAP[key]}
          </span>
        </div>
      )
    }
    return card
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
            className={`flex flex-col gap-3 w-full max-w-[280px] mx-auto px-3 pb-20 pt-1 transition-all duration-700 ease-out ${
              topRowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}
          >
            {/* Product 1: Shoe (H on mobile) - First position on mobile */}
            <div className='w-full'>
              {renderMobileProductCard(
                'shoe',
                <MobileShoeCard
                  product={collectionProducts.shoe}
                  onClose={() => revealLetter('shoe')}
                  onAddToCart={addToCart}
                />
              )}
            </div>

            {/* Product 2: Hoodie 01 (O on mobile) */}
            <div className='w-full'>
              {renderMobileProductCard(
                'hoodie01',
                <MobileProductCard
                  product={collectionProducts.hoodie01}
                  onClose={() => revealLetter('hoodie01')}
                  onAddToCart={addToCart}
                />
              )}
            </div>

            {/* Product 3: Hoodie 02 (L on mobile) */}
            <div className='w-full'>
              {renderMobileProductCard(
                'hoodie02',
                <MobileProductCard
                  product={collectionProducts.hoodie02}
                  onClose={() => revealLetter('hoodie02')}
                  onAddToCart={addToCart}
                />
              )}
            </div>

            {/* Product 4: Hoodie 03 (I on mobile) */}
            <div className='w-full'>
              {renderMobileProductCard(
                'hoodie03',
                <MobileProductCard
                  product={collectionProducts.hoodie03}
                  onClose={() => revealLetter('hoodie03')}
                  onAddToCart={addToCart}
                />
              )}
            </div>

            {/* Product 5: Tee Shirt (D on mobile) */}
            <div className='w-full'>
              {renderMobileProductCard(
                'teeShirt',
                <MobileProductCard
                  product={collectionProducts.teeShirt}
                  onClose={() => revealLetter('teeShirt')}
                  onAddToCart={addToCart}
                />
              )}
            </div>

            {/* Product 6: Password Product (A on mobile) */}
            <div className='w-full'>
              {renderMobileProductCard(
                'passwordProduct',
                <MobilePasswordCard
                  product={collectionProducts.passwordProduct}
                  onClose={() => revealLetter('passwordProduct')}
                  onAddToCart={addToCart}
                />
              )}
            </div>

            {/* Mobile Cart Section - at bottom of scroll (Y) */}
            <div ref={mobileCartRef} className='w-full pt-4'>
              {renderMobileProductCard(
                'cart',
                <div className='bg-green-600 overflow-hidden'>
                  <CartModal
                    title='cart'
                    onClose={() => revealLetter('cart')}
                    items={cartItems}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeFromCart}
                    onCheckout={handleCheckout}
                    onAddShirt={addToCart}
                    onAddCoyoteBag={addToCart}
                    teeShirtProduct={collectionProducts.teeShirt}
                    coyoteBagProduct={collectionProducts.coyoteBag}
                    isMobileEmbedded
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Original 4+3 row layout */}
        <div className='hidden md:flex flex-col items-center justify-center w-full h-full px-4'>
          {/* Top Row - 4 Product Cards (H, O, L, I) */}
          <div
            className={`flex flex-nowrap justify-between gap-6 mb-4 w-full px-8 transition-all duration-700 ease-out ${
              topRowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}
          >
            <div className='flex-1 max-w-[360px]'>
              {renderDesktopProductCard(
                'hoodie01',
                <ProductCard
                  title='january 29th'
                  productName='hoodie'
                  productDetail='01'
                  onClose={() => revealLetter('hoodie01')}
                  product={collectionProducts.hoodie01}
                  onAddToCart={addToCart}
                />
              )}
            </div>
            <div className='flex-1 max-w-[360px]'>
              {renderDesktopProductCard(
                'hoodie02',
                <ProductCard
                  title='january 29th'
                  productName='hoodie'
                  productDetail='02'
                  onClose={() => revealLetter('hoodie02')}
                  product={collectionProducts.hoodie02}
                  onAddToCart={addToCart}
                />
              )}
            </div>
            <div className='flex-1 max-w-[360px]'>
              {renderDesktopProductCard(
                'hoodie03',
                <ProductCard
                  title='january 29th'
                  productName='hoodie'
                  productDetail='03'
                  onClose={() => revealLetter('hoodie03')}
                  product={collectionProducts.hoodie03}
                  onAddToCart={addToCart}
                />
              )}
            </div>
            <div className='flex-1 max-w-[360px]'>
              {renderDesktopProductCard(
                'teeShirt',
                <ProductCard
                  title='january 29th'
                  productName='tee shirt'
                  productDetail='$9'
                  onClose={() => revealLetter('teeShirt')}
                  product={collectionProducts.teeShirt}
                  onAddToCart={addToCart}
                />
              )}
            </div>
          </div>

          {/* Bottom Row - Password Product, Shoe, Cart (D, A, Y) */}
          <div
            className={`flex flex-nowrap justify-center gap-6 w-full px-8 transition-all duration-700 ease-out ${
              bottomRowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}
          >
            <div className='flex-1 max-w-[360px]'>
              {renderDesktopProductCard(
                'passwordProduct',
                <PasswordProductCard
                  title='january 29th'
                  onClose={() => revealLetter('passwordProduct')}
                  product={collectionProducts.passwordProduct}
                  onAddToCart={addToCart}
                />
              )}
            </div>
            <div className='flex-1 max-w-[580px]'>
              {renderDesktopProductCard(
                'shoe',
                <ShoeProductCard
                  title='january 29th'
                  onClose={() => revealLetter('shoe')}
                  onAddToCart={addToCart}
                  product={collectionProducts.shoe}
                />
              )}
            </div>
            <div className='flex-1 max-w-[360px]'>
              {renderDesktopProductCard(
                'cart',
                <CartModal
                  title='cart'
                  onClose={() => revealLetter('cart')}
                  items={cartItems}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onCheckout={handleCheckout}
                  onAddShirt={addToCart}
                  onAddCoyoteBag={addToCart}
                  teeShirtProduct={collectionProducts.teeShirt}
                  coyoteBagProduct={collectionProducts.coyoteBag}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Scroll to Cart Indicator - Right side */}
      <button
        onClick={scrollToMobileCart}
        className={`md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
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

          {/* Animated arrow */}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='white'
            className='w-4 h-4 animate-bounce'
          >
            <path
              fillRule='evenodd'
              d='M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      </button>
    </>
  )
}
