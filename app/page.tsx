'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AudioPlayer, { AudioPlayerHandle } from '@/components/AudioPlayer'
import BouncingDownloadModal from '@/components/BouncingDownloadModal'
import OfflineModal from '@/components/OfflineModal'
import ProductModal from '@/components/ProductModal'
import ImageSlideshow from '@/components/ImageSlideshow'
import GuitarHeroModal from '@/components/GuitarHeroModal'

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
  const [showProductModal, setShowProductModal] = useState(false)
  const [showGuitarHeroModal, setShowGuitarHeroModal] = useState(false)
  const audioPlayerRef = useRef<AudioPlayerHandle>(null)

  useEffect(() => {
    // Show logo as spotlight starts to shine
    const logoTimer = setTimeout(() => {
      setShowContent(true)
    }, 500)

    // Hide spotlight after animation
    const spotlightTimer = setTimeout(() => {
      setShowSpotlight(false)
    }, 3500)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(spotlightTimer)
    }
  }, [])

  // Fetch and show downloadable content modal
  useEffect(() => {
    const fetchDownloadableContent = async () => {
      try {
        const response = await fetch('/api/downloadable-content')
        const data = await response.json()

        if (data.content && data.content.fileUrl) {
          setDownloadModalData(data.content)

          // Show modal after the specified delay
          const modalTimer = setTimeout(
            () => {
              setShowDownloadModal(true)
            },
            (data.content.delaySeconds || 4) * 1000
          )

          return () => clearTimeout(modalTimer)
        }
      } catch (error) {
        console.error('Error fetching downloadable content:', error)
      }
    }

    fetchDownloadableContent()
  }, [])

  // Show offline modal 3 seconds after download modal appears
  useEffect(() => {
    if (showDownloadModal) {
      const offlineTimer = setTimeout(() => {
        setShowOfflineModal(true)
      }, 3000)

      return () => clearTimeout(offlineTimer)
    }
  }, [showDownloadModal])

  // Show Guitar Hero modal after spotlight animation completes and content is fully visible
  useEffect(() => {
    if (!showSpotlight && showContent) {
      const guitarHeroTimer = setTimeout(() => {
        setShowGuitarHeroModal(true)
      }, 2000)

      return () => clearTimeout(guitarHeroTimer)
    }
  }, [showSpotlight, showContent])

  const handleGuitarHeroSuccessAudioStart = () => {
    audioPlayerRef.current?.mute()
  }

  const handleGuitarHeroSuccessAudioStop = () => {
    audioPlayerRef.current?.unmute()
  }

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return

    setIsSubmittingAnswer(true)
    setAnswerError('')

    try {
      const response = await fetch('/api/submit-answer', {
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

  const handleUnlockProduct = () => {
    setShowProductModal(true)
    setShowOfflineModal(false)
  }

  const handleCloseProductModal = () => {
    setShowProductModal(false)
  }

  return (
    <div className='fixed inset-0 bg-black overflow-y-auto overflow-x-hidden scroll-smooth'>
      {/* Audio Player */}
      <AudioPlayer ref={audioPlayerRef} />

      {/* Bouncing Download Modal */}
      {showDownloadModal && downloadModalData && (
        <BouncingDownloadModal
          title={downloadModalData.title}
          questionText={downloadModalData.questionText}
          imageUrl={downloadModalData.fileUrl}
          downloadFileName={downloadModalData.downloadFileName}
          fileExtension={downloadModalData.fileExtension}
          onClose={() => setShowDownloadModal(false)}
        />
      )}

      {/* {showOfflineModal && <OfflineModal onUnlock={handleUnlockProduct} />} */}

      <ProductModal
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
      />

      {/* Guitar Hero Competition Modal */}
      {showGuitarHeroModal && (
        <GuitarHeroModal
          onClose={() => setShowGuitarHeroModal(false)}
          onSuccessAudioStart={handleGuitarHeroSuccessAudioStart}
          onSuccessAudioStop={handleGuitarHeroSuccessAudioStop}
        />
      )}

      {/* Spotlight Effect */}
      {showSpotlight && (
        <div className='absolute inset-0 z-50 pointer-events-none'>
          <div className='spotlight-container'>
            <div className='spotlight' />
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className='min-h-screen flex flex-col items-center justify-center px-4 py-8'>
        <main className='w-full max-w-2xl flex flex-col items-center justify-center text-center py-8 pt-6'>
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
                <h1 className='text-white text-xs sm:text-sm tracking-widest font-light'>
                  Q: what would you miss tomorrow?
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
                        className='w-full bg-transparent border-b border-gray-600 text-white text-center py-2 px-4 text-xs focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-600 placeholder:tracking-widest placeholder:text-xs'
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
                  className='text-white border-b border-gray-600 hover:border-gray-400 transition-colors tracking-widest text-xs sm:text-sm pb-1'
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
                    backgroundColor: !showSubscribe ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
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
                    className='absolute -top-2 -right-2 text-gray-500 hover:text-gray-300 transition-colors z-10'
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
                          className='w-full bg-transparent border-b border-gray-600 text-white text-center py-2 px-4 text-xs focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-600 placeholder:tracking-widest placeholder:text-xs'
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
                          className='w-full bg-transparent border-b border-gray-600 text-white text-center py-2 px-4 text-xs focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-600 placeholder:tracking-widest placeholder:text-xs'
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

      {/* Slideshow Section - Always visible, scrollable */}
      {/* <div className='w-full'>
        <ImageSlideshow />
      </div> */}
    </div>
  )
}
