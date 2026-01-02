'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import AudioPlayer from '@/components/AudioPlayer'
import BouncingDownloadModal from '@/components/BouncingDownloadModal'

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
          const modalTimer = setTimeout(() => {
            setShowDownloadModal(true)
          }, (data.content.delaySeconds || 4) * 1000)

          return () => clearTimeout(modalTimer)
        }
      } catch (error) {
        console.error('Error fetching downloadable content:', error)
      }
    }

    fetchDownloadableContent()
  }, [])

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

  return (
    <div className='fixed inset-0 bg-black flex flex-col items-center justify-center px-4 py-8 overflow-hidden'>
      {/* Audio Player */}
      <AudioPlayer />

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

      {/* Spotlight Effect */}
      {showSpotlight && (
        <div className='absolute inset-0 z-50 pointer-events-none'>
          <div className='spotlight-container'>
            <div className='spotlight' />
          </div>
        </div>
      )}

      <main className='w-full max-w-2xl flex flex-col items-center justify-center h-full text-center py-8 pt-6'>
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

          {/* Question - smaller and dims when subscribe is open */}
          <h1
            className={`text-white text-xs sm:text-sm tracking-widest font-light ${
              !showSubscribe
                ? 'opacity-10'
                : showContent
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            Q: what would you miss tomorrow?
          </h1>

          {/* Answer Form - smaller and dims when subscribe is open */}
          <form
            onSubmit={handleAnswerSubmit}
            className={`w-full max-w-xs ${
              !showSubscribe
                ? 'opacity-10'
                : showContent
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
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

          {/* Subscribe Section */}
          <div
            className={`w-full max-w-lg transition-opacity duration-1200 ease-out ${
              showContent ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: showContent ? '2500ms' : '0ms' }}
          >
            {showSubscribe ? (
              <button
                onClick={() => setShowSubscribe(false)}
                className='text-white border-b border-gray-600 hover:border-gray-400 transition-colors tracking-widest text-xs sm:text-sm pb-1'
              >
                subscribe
              </button>
            ) : (
              <div className='relative'>
                <button
                  onClick={() => setShowSubscribe(true)}
                  className='absolute -top-2 -right-2 text-gray-500 hover:text-gray-300 transition-colors'
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
                </button>
{subscribeSuccess ? (
                  <p className='text-green-500 text-xs py-2 animate-fade-in'>
                    successfully subscribed!
                  </p>
                ) : (
                  <form
                    onSubmit={handleSubscribeSubmit}
                    className='space-y-4 animate-fade-in'
                  >
                    <input
                      type='email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder='email address'
                      className='w-full bg-transparent border-b border-gray-600 text-white text-center py-2 px-4 text-xs focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-600 placeholder:tracking-widest placeholder:text-xs'
                      disabled={isSubmittingSubscribe}
                    />
                    <input
                      type='tel'
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder='phone number'
                      className='w-full bg-transparent border-b border-gray-600 text-white text-center py-2 px-4 text-xs focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-600 placeholder:tracking-widest placeholder:text-xs'
                      disabled={isSubmittingSubscribe}
                    />
                    {subscribeError && (
                      <p className='text-yellow-500 text-xs'>{subscribeError}</p>
                    )}
                    <button
                      type='submit'
                      disabled={isSubmittingSubscribe}
                      className='text-blue-500 hover:text-blue-400 transition-colors tracking-widest text-xs disabled:opacity-50'
                    >
                      {isSubmittingSubscribe ? 'sending...' : 'submit'}
                    </button>
                  </form>
                )}
              </div>
            )}
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
  )
}
