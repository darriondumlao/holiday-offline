'use client'

import { ReactNode, Children, useRef, useState, useEffect, useMemo, cloneElement, isValidElement } from 'react'

interface ModalSidebarProps {
  side: 'left' | 'right'
  children: ReactNode
  onReady?: () => void
  delayStart?: boolean
}

type SnapPosition = 'top' | 'center' | 'bottom'

export default function ModalSidebar({ side, children, onReady, delayStart = false }: ModalSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isReady, setIsReady] = useState(!delayStart)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const childArray = Children.toArray(children).filter(Boolean)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate random positions immediately (for desktop)
  const positions = useMemo(() => {
    const positionOptions: SnapPosition[] = ['top', 'center', 'bottom']
    return childArray.map(() =>
      positionOptions[Math.floor(Math.random() * positionOptions.length)]
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childArray.length])

  const getAlignmentStyle = (position: SnapPosition) => {
    switch (position) {
      case 'top':
        return {
          alignItems: 'flex-start',
          paddingTop: '6rem',
          paddingBottom: '2rem',
        }
      case 'bottom':
        return {
          alignItems: 'flex-end',
          paddingTop: '2rem',
          paddingBottom: '6rem',
        }
      case 'center':
      default:
        return {
          alignItems: 'center',
          paddingTop: '5rem',
          paddingBottom: '2rem',
        }
    }
  }

  // Extract title from child modal (looks for title prop or uses component name defaults)
  const getModalTitle = (child: ReactNode, index: number): string => {
    if (isValidElement(child)) {
      // First check if title is explicitly passed as a prop
      const props = child.props as Record<string, unknown>
      if ('title' in props && typeof props.title === 'string') {
        return props.title
      }

      // Fall back to component name-based defaults
      const componentName = typeof child.type === 'function'
        ? (child.type as { name?: string }).name || ''
        : ''

      const defaultTitles: Record<string, string> = {
        'ImageSlideshowModal': 'what kept me alive',
        'CenterModal': 'click the buttons',
        'TopRightModal': 'january 29th',
        'AnswersModal': 'what would you miss tomorrow?',
        'BottomLeftModal': 'download',
        'RamboModal': 'january 29th limited to 99 pairs ($99)',
      }

      if (componentName && defaultTitles[componentName]) {
        return defaultTitles[componentName]
      }
    }
    return `Modal ${index + 1}`
  }

  // Track active index based on scroll position (desktop only)
  useEffect(() => {
    if (isMobile) return

    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      const index = Math.round(scrollTop / containerHeight)
      const clampedIndex = Math.max(0, Math.min(index, childArray.length - 1))

      if (clampedIndex !== activeIndex) {
        setActiveIndex(clampedIndex)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activeIndex, childArray.length, isMobile])

  // Notify parent when ready
  useEffect(() => {
    if (isReady && childArray.length > 0 && onReady) {
      const timer = setTimeout(() => {
        onReady()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isReady, childArray.length, onReady])

  useEffect(() => {
    if (!delayStart) {
      setIsReady(true)
    }
  }, [delayStart])

  // Close expanded modal when clicking outside
  useEffect(() => {
    if (!isMobile || expandedIndex === null) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.mobile-expanded-modal')) {
        setExpandedIndex(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMobile, expandedIndex])

  if (childArray.length === 0) return null

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <>
        {/* Collapsed tabs on edge - scrollable when many modals */}
        <div
          className={`fixed ${side === 'left' ? 'left-0' : 'right-0'} top-0 h-screen z-50 flex items-center pointer-events-none`}
          style={{
            opacity: isReady ? 1 : 0,
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className='flex flex-col gap-2 py-4 max-h-[80vh] overflow-y-auto pointer-events-auto'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {childArray.map((child, index) => {
              const title = getModalTitle(child, index)
              const isExpanded = expandedIndex === index

              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedIndex(isExpanded ? null : index)
                  }}
                  className={`bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider py-3 px-1.5 transition-all duration-300 ${
                    side === 'left' ? 'rounded-r-md' : 'rounded-l-md'
                  } ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: side === 'left' ? 'rotate(180deg)' : 'none',
                  }}
                >
                  {title}
                </button>
              )
            })}
          </div>
        </div>

        {/* Expanded modal overlay */}
        {expandedIndex !== null && (
          <div
            className='fixed inset-0 z-[60] flex items-center justify-center'
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              className='mobile-expanded-modal w-[90vw] max-h-[80vh] overflow-auto animate-fade-in'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clone the child and override onClose to collapse instead of close */}
              {isValidElement(childArray[expandedIndex])
                ? cloneElement(childArray[expandedIndex] as React.ReactElement<{ onClose?: () => void }>, {
                    onClose: () => setExpandedIndex(null)
                  })
                : childArray[expandedIndex]
              }
            </div>
          </div>
        )}
      </>
    )
  }

  // DESKTOP LAYOUT (unchanged)
  return (
    <div
      className={`fixed h-screen z-50 pointer-events-none w-[320px] sm:w-[360px] ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{
        top: 0,
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        ref={scrollRef}
        className={`h-full overflow-y-auto pointer-events-auto ${side === 'left' ? 'pl-4 pr-2' : 'pl-2 pr-4'}`}
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {childArray.map((child, index) => {
          const position = positions[index] || 'center'
          const alignmentStyle = getAlignmentStyle(position)
          const isActive = index === activeIndex
          const distance = Math.abs(index - activeIndex)

          return (
            <div
              key={index}
              className='h-screen flex'
              style={{
                scrollSnapAlign: 'start',
                alignItems: alignmentStyle.alignItems,
                paddingTop: alignmentStyle.paddingTop,
                paddingBottom: alignmentStyle.paddingBottom,
              }}
            >
              <div
                className='w-full'
                style={{
                  opacity: isActive ? 1 : Math.max(0.15, 0.4 - distance * 0.15),
                  transform: isActive
                    ? 'scale(1) translateY(0)'
                    : `scale(${Math.max(0.88, 0.95 - distance * 0.03)}) translateY(${(index - activeIndex) * 8}px)`,
                  filter: isActive ? 'none' : `blur(${Math.min(2, distance)}px)`,
                  pointerEvents: isActive ? 'auto' : 'none',
                  transition: 'all 0.5s ease-out',
                }}
              >
                {child}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
