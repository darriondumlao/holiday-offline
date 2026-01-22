'use client'

import { useState, useEffect, useCallback } from 'react'
import RetroLoader from './RetroLoader'
import ModalWrapper from './ModalWrapper'

interface AnswersModalProps {
  onClose: () => void
  title?: string
}

export default function AnswersModal({ onClose, title = 'what would you miss tomorrow?' }: AnswersModalProps) {
  const [answers, setAnswers] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch answers from API
  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const response = await fetch('/api/answers')
        const data = await response.json()

        if (data.answers && data.answers.length > 0) {
          setAnswers(data.answers)
          // Set initial random answer
          const randomIndex = Math.floor(Math.random() * data.answers.length)
          const initialAnswer = data.answers[randomIndex]
          setHistory([initialAnswer])
          setHistoryIndex(0)
        } else {
          setError('No answers found')
        }
      } catch (err) {
        console.error('Error fetching answers:', err)
        setError('Failed to load answers')
      } finally {
        setLoading(false)
      }
    }

    fetchAnswers()
  }, [])

  const getNextAnswer = useCallback(() => {
    if (answers.length === 0) return

    // If we're not at the end of history, go forward
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    } else {
      // Get a new random answer and add to history
      const randomIndex = Math.floor(Math.random() * answers.length)
      const newAnswer = answers[randomIndex]
      setHistory([...history, newAnswer])
      setHistoryIndex(history.length)
    }
  }, [answers, history, historyIndex])

  const getPrevAnswer = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
    }
  }, [historyIndex])

  const currentAnswer = history[historyIndex] || ''

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'prev', onClick: getPrevAnswer },
        { label: 'next', onClick: getNextAnswer },
      ]}
    >
      {loading ? (
        <div className='flex flex-col items-center gap-2'>
          <RetroLoader size='sm' />
          <span className='text-gray-600 text-xs'>Loading...</span>
        </div>
      ) : error || answers.length === 0 ? (
        <span className='text-gray-500 text-xs'>{error || 'No answers'}</span>
      ) : (
        <div className='w-full px-4 flex items-center justify-center'>
          <p className='text-black text-sm text-center leading-relaxed'>
            {currentAnswer}
          </p>
        </div>
      )}
    </ModalWrapper>
  )
}
