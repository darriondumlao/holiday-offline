'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import StaticModalWrapper from '@/components/StaticModalWrapper'
import HeaderContent from '@/components/HeaderContent'
import ProductsView from '@/components/ProductsView'
import TickerHeader from '@/components/TickerHeader'
import { CartItem } from '@/components/CartModal'
import { createCheckoutClient } from '@/lib/shopify'

// Lazy-load modal components (rendered after 3.7s spotlight delay)
const BottomLeftModal = dynamic(() => import('@/components/BottomLeftModal'))
const ImageSlideshowModal = dynamic(() => import('@/components/ImageSlideshowModal'))
const QAModal = dynamic(() => import('@/components/QAModal'))
const TopRightModal = dynamic(() => import('@/components/TopRightModal'))
const AloneModal = dynamic(() => import('@/components/AloneModal'))

// View modes for the 2-tab navigation
export type ViewMode = 'offline' | 'shop'

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
  const [showSlideshowModal, setShowSlideshowModal] = useState(false)
  const [showAnswersModal, setShowAnswersModal] = useState(false)
  const [showProblemsModal, setShowProblemsModal] = useState(false)
  const [showTopRightModal, setShowTopRightModal] = useState(false)
  const [showAloneModal, setShowAloneModal] = useState(false)
  const [modalsVisible, setModalsVisible] = useState(false)
  const [currentView, setCurrentView] = useState<ViewMode>('shop') // 2-tab navigation
  const [activeMobileModal, setActiveMobileModal] = useState(0) // Tracks which mobile modal card is in view
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const mobileModalCount = useRef(0)
  const [activeDesktopModal, setActiveDesktopModal] = useState(0) // Tracks which desktop modal card is in view
  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const [desktopModalTotal, setDesktopModalTotal] = useState(0)

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
  const addToCart = useCallback((product: { name: string; price: number; size?: string; image?: string; variantId?: string; quantityAvailable?: number }) => {
    const id = `${product.name}-${product.size || 'default'}-${Date.now()}`
    const newItem: CartItem = {
      id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: product.size,
      image: product.image,
      variantId: product.variantId,
      quantityAvailable: product.quantityAvailable,
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
    setShowAnswersModal(true)
    setShowProblemsModal(true)
    setShowTopRightModal(true)
    setShowAloneModal(true)
  }, [])

  // Show modal cards after spotlight completes
  useEffect(() => {
    if (!showSpotlight && showContent) {
      const timer = setTimeout(() => {
        setModalsVisible(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [showSpotlight, showContent])

  // Track which mobile modal card is in view via IntersectionObserver
  useEffect(() => {
    const container = mobileScrollRef.current
    if (!container) return

    const cards = container.querySelectorAll('[data-modal-card]')
    mobileModalCount.current = cards.length
    if (cards.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.modalCard)
            if (!isNaN(index)) setActiveMobileModal(index)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  })

  // Track which desktop modal card is in view via IntersectionObserver
  useEffect(() => {
    const container = desktopScrollRef.current
    if (!container) return

    const cards = container.querySelectorAll('[data-desktop-card]')
    setDesktopModalTotal(cards.length)
    if (cards.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.desktopCard)
            if (!isNaN(index)) setActiveDesktopModal(index)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  })

  // Arrow key navigation for desktop offline modal cards
  useEffect(() => {
    if (currentView !== 'offline') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      // Don't intercept when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const container = desktopScrollRef.current
      if (!container) return

      e.preventDefault()
      const scrollAmount = container.clientHeight
      container.scrollBy({
        top: e.key === 'ArrowDown' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView])

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

      {/* Header Content with View Toggle - waits for spotlight */}
      <HeaderContent
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view)
          if (view === 'offline') {
            // Reset scroll to first card
            setTimeout(() => {
              mobileScrollRef.current?.scrollTo({ left: 0, behavior: 'instant' })
              desktopScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
              setActiveMobileModal(0)
              setActiveDesktopModal(0)
            }, 50)
          }
        }}
        showAfterSpotlight={!showSpotlight}
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
        className={`fixed inset-0 pt-[84px] transition-opacity duration-500 ${
          currentView === 'offline' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
          {/* Split Layout: flex-col on mobile, flex-row on desktop */}
          <div className='flex flex-col md:flex-row w-full h-full'>

            {/* Left/Top Panel — Logo + Q&A + Subscribe */}
            <div className='h-1/2 md:h-full md:w-1/2 flex flex-col items-center justify-center px-4 py-2 md:py-0 overflow-hidden'>
              <div className='w-full max-w-md flex flex-col items-center justify-center text-center space-y-3 md:space-y-3'>
                {/* Logo - Responsive sizing (compact on mobile, larger on desktop) */}
                <div
                  className={`w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[320px] md:h-[320px] lg:w-[380px] lg:h-[380px] relative flex-shrink-0 transition-opacity duration-500 ease-in md:-mt-8 ${
                    showContent ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src='/h.png'
                    alt='h'
                    fill
                    sizes='(min-width: 1024px) 380px, (min-width: 768px) 320px, (min-width: 640px) 200px, 160px'
                    className='object-contain'
                    priority
                  />
                </div>

                {/* Q&A and Subscribe Section */}
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
                      Q: what do you think of when you hear the word &quot;holiday&quot;?
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
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                className='w-5 h-5'
                              >
                                <line x1='5' y1='12' x2='19' y2='12' />
                                <polyline points='13,6 19,12 13,18' />
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
            </div>

            {/* Right/Bottom Panel — Static Modal Cards */}
            <div
              className={`h-1/2 md:h-full md:w-1/2 transition-opacity duration-500 ${
                !modalsVisible ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
              }`}
            >
              {/* Mobile: smooth snap scroll, one card at a time + dot tracker */}
              <div className='md:hidden h-full flex flex-col'>
                <div ref={mobileScrollRef} className='flex-1 flex items-center overflow-x-auto scrollbar-none scroll-smooth px-[2vw]' style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
                  {(() => {
                    let cardIndex = 0
                    return (
                      <>
                        {showDownloadModal && downloadModalData && (
                          <div data-modal-card={cardIndex++} className='w-[96vw] flex-shrink-0 flex items-center justify-center px-3' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-full max-w-[340px]'>
                              <BottomLeftModal
                                title={downloadModalData.title}
                                questionText={downloadModalData.questionText}
                                imageUrl={downloadModalData.fileUrl}
                                downloadFileName={downloadModalData.downloadFileName}
                                fileExtension={downloadModalData.fileExtension}
                                onClose={() => setShowDownloadModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showAnswersModal && (
                          <div data-modal-card={cardIndex++} className='w-[96vw] flex-shrink-0 flex items-center justify-center px-3' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-full max-w-[340px]'>
                              <QAModal
                                title='what would you miss tomorrow?'
                                apiEndpoint='/api/answers'
                                watchUrl='https://youtu.be/I6zromBJVPU?si=ISmJvaQL9sTCcz2P'
                                onClose={() => setShowAnswersModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showProblemsModal && (
                          <div data-modal-card={cardIndex++} className='w-[96vw] flex-shrink-0 flex items-center justify-center px-3' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-full max-w-[340px]'>
                              <QAModal
                                title='what problem do you wish you could solve?'
                                apiEndpoint='/api/problems'
                                watchUrl='https://youtu.be/TVAQx8phmjk?si=9izgaAKGviClJoM5'
                                onClose={() => setShowProblemsModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showTopRightModal && (
                          <div data-modal-card={cardIndex++} className='w-[96vw] flex-shrink-0 flex items-center justify-center px-3' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-full max-w-[340px]'>
                              <TopRightModal
                                title='january 29th'
                                onClose={() => setShowTopRightModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showSlideshowModal && (
                          <div data-modal-card={cardIndex++} className='w-[96vw] flex-shrink-0 flex items-center justify-center px-3' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-full max-w-[340px]'>
                              <ImageSlideshowModal
                                title='what kept me alive'
                                onClose={() => setShowSlideshowModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showAloneModal && (
                          <div data-modal-card={cardIndex++} className='w-[96vw] flex-shrink-0 flex items-center justify-center px-3' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-full max-w-[340px]'>
                              <AloneModal
                                title="who do you perform for when you're alone?"
                                onClose={() => setShowAloneModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
                {/* Swipe label (mobile only) */}
                <p
                  className='text-white/50 text-base tracking-[0.25em] text-center pt-3 lowercase'
                  style={{ fontFamily: "'Holiday Content', sans-serif" }}
                >
                  swipe
                </p>
                {/* Dot tracker */}
                <div className='flex items-center justify-center gap-1 pb-3 pt-1'>
                  {Array.from({ length: mobileScrollRef.current?.querySelectorAll('[data-modal-card]').length || mobileModalCount.current }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 transition-all duration-300 ${
                        i === activeMobileModal ? 'bg-white w-2.5' : 'bg-white/25 w-1'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop: vertical snap scroll with tracker */}
              <div className='hidden md:flex h-full items-center'>
                {/* Scroll area */}
                <div ref={desktopScrollRef} className='flex-1 h-full flex flex-col items-center overflow-y-auto px-4 scrollbar-none scroll-smooth' style={{ scrollSnapType: 'y mandatory' }}>
                  {(() => {
                    let desktopCardIndex = 0
                    return (
                      <>
                        {showDownloadModal && downloadModalData && (
                          <div data-desktop-card={desktopCardIndex++} className='flex-shrink-0 h-full flex items-center justify-center' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-[360px]'>
                              <BottomLeftModal
                                title={downloadModalData.title}
                                questionText={downloadModalData.questionText}
                                imageUrl={downloadModalData.fileUrl}
                                downloadFileName={downloadModalData.downloadFileName}
                                fileExtension={downloadModalData.fileExtension}
                                onClose={() => setShowDownloadModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showAnswersModal && (
                          <div data-desktop-card={desktopCardIndex++} className='flex-shrink-0 h-full flex items-center justify-center' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-[360px]'>
                              <QAModal
                                title='what would you miss tomorrow?'
                                apiEndpoint='/api/answers'
                                watchUrl='https://youtu.be/I6zromBJVPU?si=ISmJvaQL9sTCcz2P'
                                onClose={() => setShowAnswersModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showProblemsModal && (
                          <div data-desktop-card={desktopCardIndex++} className='flex-shrink-0 h-full flex items-center justify-center' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-[360px]'>
                              <QAModal
                                title='what problem do you wish you could solve?'
                                apiEndpoint='/api/problems'
                                watchUrl='https://youtu.be/TVAQx8phmjk?si=9izgaAKGviClJoM5'
                                onClose={() => setShowProblemsModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showTopRightModal && (
                          <div data-desktop-card={desktopCardIndex++} className='flex-shrink-0 h-full flex items-center justify-center' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-[360px]'>
                              <TopRightModal
                                title='january 29th'
                                onClose={() => setShowTopRightModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showSlideshowModal && (
                          <div data-desktop-card={desktopCardIndex++} className='flex-shrink-0 h-full flex items-center justify-center' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-[360px]'>
                              <ImageSlideshowModal
                                title='what kept me alive'
                                onClose={() => setShowSlideshowModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                        {showAloneModal && (
                          <div data-desktop-card={desktopCardIndex++} className='flex-shrink-0 h-full flex items-center justify-center' style={{ scrollSnapAlign: 'center' }}>
                            <StaticModalWrapper className='w-[360px]'>
                              <AloneModal
                                title="who do you perform for when you're alone?"
                                onClose={() => setShowAloneModal(false)}
                              />
                            </StaticModalWrapper>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
                {/* Vertical tracker + scroll label */}
                {desktopModalTotal > 0 && (
                  <div className='flex items-center gap-3 pr-4 flex-shrink-0'>
                    <p
                      className='text-white/50 text-2xl tracking-[0.25em] lowercase'
                      style={{ fontFamily: "'Holiday Content', sans-serif", writingMode: 'vertical-rl' }}
                    >
                      scroll
                    </p>
                    <div className='flex flex-col items-center gap-1'>
                      {Array.from({ length: desktopModalTotal }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 transition-all duration-300 ${
                            i === activeDesktopModal ? 'bg-white h-2.5' : 'bg-white/25 h-1'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
      </div>
      {/* End of Main Home View wrapper */}

    </div>
  )
}
