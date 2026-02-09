'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import BottomLeftModal from '@/components/BottomLeftModal'
import OfflineModal from '@/components/OfflineModal'
import CenterModal from '@/components/CenterModal'
import ModalSidebar from '@/components/ModalSidebar'
import ImageSlideshowModal from '@/components/ImageSlideshowModal'
import AnswersModal from '@/components/AnswersModal'
import ProblemsModal from '@/components/ProblemsModal'
import RamboModal from '@/components/RamboModal'
import TopRightModal from '@/components/TopRightModal'
import BouncingWrapper from '@/components/BouncingWrapper'
import { BouncingPauseProvider } from '@/contexts/BouncingPauseContext'
import CountdownTimer from '@/components/CountdownTimer'
import ProductsView from '@/components/ProductsView'
import VintageView from '@/components/VintageView'
import TickerHeader from '@/components/TickerHeader'
import CartModal, { CartItem } from '@/components/CartModal'
import { createCheckoutClient } from '@/lib/shopify'

// View modes for the 3-tab navigation
export type ViewMode = 'offline' | 'shop' | 'vintage'

const CART_STORAGE_KEY = 'holiday-cart'

export default function Home() {
  const [answer, setAnswer] = useState('')
  const [showSubscribe, setShowSubscribe] = useState(true)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [isSubmittingSubscribe, setIsSubmittingSubscribe] = useState(false)
  const [answerSuccess, setAnswerSuccess] = useState(false)
  const [answerError, setAnswerError] = useState('')
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')
  const [showSpotlight, setShowSpotlight] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadModalData, setDownloadModalData] = useState<{
    title: string
    questionText: string
    fileUrl: string
    downloadFileName: string
    fileExtension: string | null
    delaySeconds: number
  } | null>(null)
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [showCenterModal, setShowCenterModal] = useState(false)
  const [showSlideshowModal, setShowSlideshowModal] = useState(false)
  const [showAnswersModal, setShowAnswersModal] = useState(false)
  const [showProblemsModal, setShowProblemsModal] = useState(false)
  const [showRamboModal, setShowRamboModal] = useState(false)
  const [showTopRightModal, setShowTopRightModal] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(false)
  const [showRightSidebar, setShowRightSidebar] = useState(false)
  const [currentView, setCurrentView] = useState<ViewMode>('shop') // 3-tab navigation
  const [showCartModal, setShowCartModal] = useState(false) // Cart modal for vintage view
  const [modalsHidden, setModalsHidden] = useState(false) // Toggle to hide all bouncing modals

  // Cart state - lifted from ProductsView to persist across views
  const [cartItems, setCartItems] = useState<CartItem[]>([])

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

  // Cart functions
  const addToCart = useCallback((product: { name: string; price: number; size?: string; image?: string; variantId?: string }) => {
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
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id)
      return
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }, [removeFromCart])

  const handleCheckout = useCallback(async () => {
    const lineItems = cartItems
      .filter(item => item.variantId)
      .map(item => ({
        variantId: item.variantId!,
        quantity: item.quantity,
      }))

    if (lineItems.length === 0) {
      window.location.href = 'https://holidaybrand.co'
      return
    }

    try {
      const checkout = await createCheckoutClient(lineItems)
      window.location.href = checkout.webUrl
    } catch (error) {
      console.error('Error creating checkout:', error)
      window.location.href = 'https://holidaybrand.co'
    }
  }, [cartItems])

  // Handle bag icon click - open cart modal on vintage, do nothing on shop (cart is in grid)
  const handleBagClick = useCallback(() => {
    if (currentView === 'vintage') {
      setShowCartModal(true)
    }
  }, [currentView])

  useEffect(() => {
    // Show logo as spotlight starts to shine
    const logoTimer = setTimeout(() => {
      setShowContent(true)
    }, 500)

    // Hide spotlight slightly before animation fully ends
    // This allows content to start fading in as spotlight fades out
    const spotlightTimer = setTimeout(() => {
      setShowSpotlight(false)
    }, 3200)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(spotlightTimer)
    }
  }, [])

  // Fetch downloadable content data
  useEffect(() => {
    const fetchDownloadableContent = async () => {
      try {
        const response = await fetch('/api/downloadable-content')
        const data = await response.json()

        if (data.content && data.content.fileUrl) {
          setDownloadModalData(data.content)
          setShowDownloadModal(true)
        }
      } catch (error) {
        console.error('Error fetching downloadable content:', error)
      }
    }

    fetchDownloadableContent()
  }, [])

  // Preload right side modals data
  useEffect(() => {
    setShowSlideshowModal(true)
    setShowCenterModal(true)
    setShowAnswersModal(true)
    setShowProblemsModal(true)
    setShowRamboModal(true)
    setShowTopRightModal(true)
  }, [])

  // Show bouncing modals after spotlight completes
  useEffect(() => {
    if (!showSpotlight && showContent) {
      // First set of modals
      const leftTimer = setTimeout(() => {
        setShowLeftSidebar(true)
      }, 1500)

      // Second set of modals with slight delay
      const rightTimer = setTimeout(() => {
        setShowRightSidebar(true)
      }, 2000)

      return () => {
        clearTimeout(leftTimer)
        clearTimeout(rightTimer)
      }
    }
  }, [showSpotlight, showContent])


  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return

    setIsSubmittingAnswer(true)
    setAnswerError('')

    try {
      const response = await fetch('/api/submit-holiday-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })

      const data = await response.json()

      if (response.ok) {
        setAnswerSuccess(true)
        setTimeout(() => {
          setAnswerSuccess(false)
          setAnswer('')
        }, 3000)
      } else {
        setAnswerError(data.error || 'Something went wrong')
        setTimeout(() => setAnswerError(''), 5000)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      setAnswerError('Network error. Please try again.')
      setTimeout(() => setAnswerError(''), 5000)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !phone.trim()) return

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setSubscribeError('Please enter a valid email address')
      return
    }

    // Phone validation (numbers only)
    const phoneRegex = /^\d+$/
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      setSubscribeError('Please enter a valid phone number')
      return
    }

    setIsSubmittingSubscribe(true)
    setSubscribeError('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.alreadySubscribed) {
          setSubscribeError("You're already subscribed!")
          setEmail('')
          setPhone('')
        } else {
          setSubscribeSuccess(true)
          setTimeout(() => {
            setSubscribeSuccess(false)
            setEmail('')
            setPhone('')
            setShowSubscribe(true)
          }, 3000)
        }
      } else {
        setSubscribeError(data.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      setSubscribeError('Something went wrong')
    } finally {
      setIsSubmittingSubscribe(false)
    }
  }


  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Ticker Header - waits for spotlight */}
      <TickerHeader showAfterSpotlight={!showSpotlight} />

      {/* Countdown Timer with View Toggle - waits for spotlight */}
      <CountdownTimer
        currentView={currentView}
        onViewChange={setCurrentView}
        showAfterSpotlight={!showSpotlight}
        onBagClick={handleBagClick}
        cartItemCount={cartItems.length}
        modalsHidden={modalsHidden}
        onToggleModals={() => setModalsHidden(!modalsHidden)}
      />

      {/* Products View (Shop) - Shows when currentView is 'shop' */}
      <ProductsView
        isVisible={currentView === 'shop'}
        showAfterSpotlight={!showSpotlight}
        cartItems={cartItems}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={handleCheckout}
      />

      {/* Vintage View - Shows when currentView is 'vintage' */}
      <VintageView
        isVisible={currentView === 'vintage'}
        showAfterSpotlight={!showSpotlight}
        cartItems={cartItems}
        onAddToCart={addToCart}
      />

      {/* Cart Modal - opens from bag icon on vintage view */}
      {showCartModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <CartModal
              title="cart"
              onClose={() => setShowCartModal(false)}
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      )}

      {/* Spotlight Effect - Always visible regardless of view */}
      {showSpotlight && (
        <div className='fixed inset-0 z-[100] pointer-events-none'>
          <div className='spotlight-container'>
            <div className='spotlight' />
          </div>
        </div>
      )}

      {/* Main Home View (Offline) - Shows when currentView is 'offline' */}
      <div
        className={`transition-opacity duration-500 ${
          currentView === 'offline' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Bouncing Modals - Wrapped in provider for global pause coordination */}
        <BouncingPauseProvider>
          {/* Bouncing Modals Container - Hidden when modalsHidden is true */}
          <div
            className={`transition-opacity duration-300 ${
              modalsHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
            }`}
          >
          {/* Bouncing Modals - DVD-style animation with different directions to spread out */}
          {showLeftSidebar && (
            <>
              {showDownloadModal && downloadModalData && (
                <BouncingWrapper speed={1.5} initialDirection="se" className="z-40" title={downloadModalData.title}>
                  <BottomLeftModal
                    title={downloadModalData.title}
                    questionText={downloadModalData.questionText}
                    imageUrl={downloadModalData.fileUrl}
                    downloadFileName={downloadModalData.downloadFileName}
                    fileExtension={downloadModalData.fileExtension}
                    onClose={() => setShowDownloadModal(false)}
                  />
                </BouncingWrapper>
              )}
              {/* {showCenterModal && (
                <BouncingWrapper speed={1.8} initialDirection="ne" className="z-40" title="click the buttons">
                  <CenterModal
                    title='click the buttons'
                    onClose={() => setShowCenterModal(false)}
                  />
                </BouncingWrapper>
              )} */}
              {showAnswersModal && (
                <BouncingWrapper speed={1.3} initialDirection="sw" className="z-40" title="what would you miss tomorrow?">
                  <AnswersModal
                    title='what would you miss tomorrow?'
                    onClose={() => setShowAnswersModal(false)}
                  />
                </BouncingWrapper>
              )}
              {showProblemsModal && (
                <BouncingWrapper speed={1.5} initialDirection="se" className="z-40" title='what problem do you wish you could solve?'>
                  <ProblemsModal
                    title='what problem do you wish you could solve?'
                    onClose={() => setShowProblemsModal(false)}
                  />
                </BouncingWrapper>
              )}
            </>
          )}

          {showRightSidebar && (
            <>
              {showTopRightModal && (
                <BouncingWrapper speed={1.6} initialDirection="nw" className="z-40" title="january 29th">
                  <TopRightModal
                    title='january 29th'
                    onClose={() => setShowTopRightModal(false)}
                  />
                </BouncingWrapper>
              )}
              {showSlideshowModal && (
                <BouncingWrapper speed={1.4} initialDirection="sw" className="z-40" title="what kept me alive">
                  <ImageSlideshowModal
                    title='what kept me alive'
                    onClose={() => setShowSlideshowModal(false)}
                  />
                </BouncingWrapper>
              )}
              {showRamboModal && (
                <BouncingWrapper speed={2} initialDirection="ne" className="z-40" title="rambo ($99)">
                  <RamboModal
                    title='january 29th limited to 99 pairs ($99)'
                    onClose={() => setShowRamboModal(false)}
                  />
                </BouncingWrapper>
              )}
            </>
          )}
          </div>
        </BouncingPauseProvider>


      {/* Main Content Wrapper - Fixed center, not affected by sidebars */}
      <div className='fixed inset-0 flex flex-col items-center justify-center px-4 py-8 pointer-events-none'>
        <main className='w-full max-w-2xl flex flex-col items-center justify-center text-center py-8 pt-6 pointer-events-auto'>
          <div className='flex flex-col items-center justify-center space-y-6 md:space-y-8'>
            {/* Logo - Responsive sizing */}
            <div
              className={`w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[550px] lg:h-[550px] relative flex-shrink-0 transition-opacity duration-500 ease-in ${
                showContent ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src='/h.png'
                alt='h'
                fill
                className='object-contain'
                priority
              />
            </div>

            {/* Q&A and Subscribe Section - Shared Position */}
            <div
              className={`w-full max-w-lg relative transition-opacity duration-1200 ease-out ${
                showContent ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: showContent ? '2500ms' : '0ms' }}
            >
              {/* Question and Answer Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: showSubscribe ? 1 : 0,
                  pointerEvents: showSubscribe ? 'auto' : 'none'
                }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className='flex flex-col items-center space-y-6'
              >
                <h1 className="text-xs sm:text-sm tracking-widest font-light text-white">
                  Q: what do you think of when you hear the word "holiday"?
                </h1>

                <form onSubmit={handleAnswerSubmit} className='w-full max-w-xs'>
                  {answerSuccess ? (
                    <p className='text-green-500 text-xs py-2 animate-fade-in'>
                      Thank you for sharing
                    </p>
                  ) : answerError ? (
                    <p className='text-yellow-500 text-xs py-2 animate-fade-in break-words'>
                      {answerError}
                    </p>
                  ) : (
                    <div className='relative'>
                      <input
                        type='text'
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder='type your answer here'
                        className="w-full bg-transparent border-b border-gray-600 text-white text-center py-2 pl-4 pr-10 text-xs focus:outline-none focus:border-gray-400 placeholder:tracking-widest placeholder:text-xs placeholder:text-gray-600"
                        disabled={isSubmittingAnswer || !showSubscribe}
                      />
                      {answer.trim() && showSubscribe && (
                        <button
                          type='submit'
                          disabled={isSubmittingAnswer}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 transition-all ${
                            isSubmittingAnswer
                              ? 'opacity-50 scale-95'
                              : 'opacity-100 scale-100'
                          }`}
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            fill='currentColor'
                            className='w-5 h-5'
                          >
                            <path d='M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z' />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </form>

                <button
                  onClick={() => setShowSubscribe(false)}
                  className="border-b border-gray-600 hover:border-gray-400 transition-colors tracking-widest text-xs sm:text-sm pb-1 text-white"
                >
                  subscribe
                </button>
              </motion.div>

              {/* Subscribe Form - Appears in same position */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: !showSubscribe ? 1 : 0,
                  pointerEvents: !showSubscribe ? 'auto' : 'none'
                }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className='absolute inset-0 flex items-center justify-center'
              >
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: 'transparent',
                    borderRadius: 12,
                    padding: !showSubscribe ? 24 : 0,
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className='relative w-full max-w-xs'
                >
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: !showSubscribe ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: !showSubscribe ? 0.5 : 0 }}
                    onClick={() => setShowSubscribe(true)}
                    className="absolute -top-2 -right-2 transition-colors z-10 text-gray-500 hover:text-gray-300"
                    type='button'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                      className='w-5 h-5'
                    >
                      <path
                        fillRule='evenodd'
                        d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </motion.button>
                  {subscribeSuccess ? (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-green-500 text-xs py-2 text-center'
                    >
                      successfully subscribed!
                    </motion.p>
                  ) : (
                    <form onSubmit={handleSubscribeSubmit} className='space-y-4'>
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: !showSubscribe ? 1 : 0, y: !showSubscribe ? 0 : 12 }}
                        transition={{ duration: 0.4, delay: !showSubscribe ? 0.15 : 0, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <input
                          type='email'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder='email address'
                          className="w-full bg-transparent border-b border-gray-600 text-white text-center py-2 px-4 text-xs focus:outline-none focus:border-gray-400 placeholder:tracking-widest placeholder:text-xs placeholder:text-gray-600"
                          disabled={isSubmittingSubscribe || showSubscribe}
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: !showSubscribe ? 1 : 0, y: !showSubscribe ? 0 : 12 }}
                        transition={{ duration: 0.4, delay: !showSubscribe ? 0.3 : 0, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <input
                          type='tel'
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder='phone number'
                          className="w-full bg-transparent border-b border-gray-600 text-white text-center py-2 px-4 text-xs focus:outline-none focus:border-gray-400 placeholder:tracking-widest placeholder:text-xs placeholder:text-gray-600"
                          disabled={isSubmittingSubscribe || showSubscribe}
                        />
                      </motion.div>
                      {subscribeError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className='text-yellow-500 text-xs text-center'
                        >
                          {subscribeError}
                        </motion.p>
                      )}
                      <motion.button
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: !showSubscribe ? 1 : 0, y: !showSubscribe ? 0 : 12 }}
                        transition={{ duration: 0.4, delay: !showSubscribe ? 0.45 : 0, ease: [0.25, 0.1, 0.25, 1] }}
                        type='submit'
                        disabled={isSubmittingSubscribe || showSubscribe}
                        className='w-full text-blue-500 hover:text-blue-400 transition-colors tracking-widest text-xs disabled:opacity-50'
                      >
                        {isSubmittingSubscribe ? 'sending...' : 'submit'}
                      </motion.button>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Footer - closer to bottom
        <div className='mt-auto pb-4'>
          <p
            className={`text-gray-600 text-xs tracking-wider transition-opacity duration-1000 ${
              showContent ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: showContent ? '1200ms' : '0ms' }}
          >
            holiday is offline
          </p>
        </div> */}
        </main>
      </div>
      </div>
      {/* End of Main Home View wrapper */}

    </div>
  )
}
