'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCamera from '@/hooks/useCamera'
import usePhotoBoothOverlays from '@/hooks/usePhotoBoothOverlays'

interface PhotoBoothProps {
  onClose: () => void
}

type BoothPhase = 'camera' | 'countdown' | 'review'

// Canvas dimensions (1:1 square — 1080 matches Instagram standard)
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1080

// Front cameras tend to be wide-angle — zoom in to frame face naturally
// iOS is extra wide, desktop/Android slightly less so
const IS_IOS =
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !(navigator as Navigator & { standalone?: boolean }).standalone
const IS_ANDROID =
  typeof navigator !== 'undefined' &&
  /Android/.test(navigator.userAgent)
const FRONT_CAMERA_ZOOM = IS_IOS ? 1.2 : IS_ANDROID ? 1 : 1.25

export default function PhotoBooth({ onClose }: PhotoBoothProps) {
  const [phase, setPhase] = useState<BoothPhase>('camera')
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [overlayLoaded, setOverlayLoaded] = useState(false)
  const selectedOverlayIndex = 0 // Always use the first overlay
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCapturingRef = useRef(false) // Prevent double-tap during countdown

  const {
    videoRef,
    error: cameraError,
    isLoading: cameraLoading,
    facingMode,
    hasMultipleCameras,
    toggleCamera,
    stopCamera,
    restartCamera,
  } = useCamera()

  const { overlays } = usePhotoBoothOverlays()

  // Preload overlay images for canvas compositing
  const overlayImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    overlays.forEach((overlay) => {
      if (!overlayImagesRef.current.has(overlay._id)) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => setOverlayLoaded(true)
        img.onerror = () => {
          console.error(`Failed to load overlay: ${overlay.imageUrl}`)
          setOverlayLoaded(true) // Still mark loaded so booth isn't stuck
        }
        img.src = overlay.imageUrl
        overlayImagesRef.current.set(overlay._id, img)
      }
    })
  }, [overlays])

  // Lock body scroll when booth is open (prevents background scrolling on mobile)
  useEffect(() => {
    const scrollY = window.scrollY
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = originalStyles.overflow
      document.body.style.position = originalStyles.position
      document.body.style.top = originalStyles.top
      document.body.style.width = originalStyles.width
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Clean up blob URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (capturedDataUrl) {
        URL.revokeObjectURL(capturedDataUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close handler — stop camera, clear countdown, exit
  const handleClose = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    isCapturingRef.current = false
    stopCamera()
    onClose()
  }, [stopCamera, onClose])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  // Canvas compositing — capture photo with overlay
  const capturePhoto = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate center-crop for the video to fit 1:1
    const videoAspect = video.videoWidth / video.videoHeight
    const targetAspect = CANVAS_WIDTH / CANVAS_HEIGHT

    let sx: number, sy: number, sw: number, sh: number

    if (videoAspect > targetAspect) {
      // Video is wider — crop sides
      sh = video.videoHeight
      sw = sh * targetAspect
      sx = (video.videoWidth - sw) / 2
      sy = 0
    } else {
      // Video is taller — crop top/bottom
      sw = video.videoWidth
      sh = sw / targetAspect
      sx = 0
      sy = (video.videoHeight - sh) / 2
    }

    // For front camera on iOS, crop tighter to match the preview zoom
    if (facingMode === 'user' && FRONT_CAMERA_ZOOM > 1) {
      const cropW = sw / FRONT_CAMERA_ZOOM
      const cropH = sh / FRONT_CAMERA_ZOOM
      sx += (sw - cropW) / 2
      sy += (sh - cropH) / 2
      sw = cropW
      sh = cropH
    }

    // Mirror front camera
    if (facingMode === 'user') {
      ctx.translate(CANVAS_WIDTH, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Reset transform before drawing overlay
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Draw overlay on top
    const selectedOverlay =
      selectedOverlayIndex >= 0 ? overlays[selectedOverlayIndex] : null

    if (selectedOverlay) {
      const overlayImg = overlayImagesRef.current.get(selectedOverlay._id)
      if (overlayImg && overlayImg.complete && overlayImg.naturalWidth > 0) {
        ctx.drawImage(overlayImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }
    }

    // Export as JPEG blob
    return new Promise<void>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedBlob(blob)
            setCapturedDataUrl(URL.createObjectURL(blob))
          }
          resolve()
        },
        'image/jpeg',
        0.92
      )
    })
  }, [facingMode, selectedOverlayIndex, overlays, videoRef])

  // Countdown and capture sequence
  const startCountdown = useCallback(() => {
    // Guard against double-tap
    if (isCapturingRef.current) return
    isCapturingRef.current = true

    setPhase('countdown')
    setCountdownNumber(3)

    // Haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    let count = 3
    countdownRef.current = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdownNumber(count)
        if (navigator.vibrate) navigator.vibrate(30)
      } else {
        if (countdownRef.current) clearInterval(countdownRef.current)
        countdownRef.current = null

        // Flash haptic on capture
        if (navigator.vibrate) navigator.vibrate(100)

        capturePhoto().then(() => {
          setPhase('review')
          isCapturingRef.current = false
        })
      }
    }, 1000)
  }, [capturePhoto])

  // Cancel countdown — abort and return to camera phase
  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    isCapturingRef.current = false
    setPhase('camera')
  }, [])

  // Retake photo
  const handleRetake = useCallback(() => {
    if (capturedDataUrl) {
      URL.revokeObjectURL(capturedDataUrl)
    }
    setCapturedBlob(null)
    setCapturedDataUrl(null)
    setSaveSuccess(false)
    setIsSaving(false)
    setPhase('camera')
    restartCamera()
  }, [capturedDataUrl, restartCamera])

  // Direct download — always available
  const handleDownload = useCallback(() => {
    if (!capturedBlob) return

    const fileName = `photo-booth-${Date.now()}.jpg`

    try {
      const url = URL.createObjectURL(capturedBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      setSaveSuccess(true)
    } catch {
      // Fallback: open in new tab so user can right-click/long-press to save
      if (capturedDataUrl) {
        window.open(capturedDataUrl, '_blank')
      }
    }
  }, [capturedBlob, capturedDataUrl])

  // Share via native share sheet (iOS saves to Photos, Android share menu, Mac AirDrop etc.)
  const handleShare = useCallback(async () => {
    if (!capturedBlob || isSaving) return
    setIsSaving(true)

    const fileName = `photo-booth-${Date.now()}.jpg`

    try {
      const file = new File([capturedBlob], fileName, { type: 'image/jpeg' })
      await navigator.share({ files: [file] })
      setSaveSuccess(true)
    } catch (err) {
      // User cancelled — not an error
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }

    setIsSaving(false)
  }, [capturedBlob, isSaving])

  // Check if Web Share API with file sharing is supported
  const canShare =
    typeof navigator !== 'undefined' &&
    !!navigator.share &&
    !!navigator.canShare &&
    navigator.canShare({ files: [new File([], 'test.jpg', { type: 'image/jpeg' })] })

  // Get the current overlay URL for live preview
  const currentOverlayUrl =
    selectedOverlayIndex >= 0 && overlays[selectedOverlayIndex]
      ? overlays[selectedOverlayIndex].imageUrl
      : null

  // Block all zoom/pan gestures on the booth
  useEffect(() => {
    // Prevent pinch-to-zoom and double-tap zoom
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }
    const preventGestureStart = (e: Event) => {
      e.preventDefault()
    }
    // Prevent double-tap zoom
    let lastTouchEnd = 0
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    document.addEventListener('touchmove', preventZoom, { passive: false })
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false })
    document.addEventListener('gesturestart', preventGestureStart, { passive: false })
    document.addEventListener('gesturechange', preventGestureStart, { passive: false })
    document.addEventListener('gestureend', preventGestureStart, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventZoom)
      document.removeEventListener('touchend', preventDoubleTapZoom)
      document.removeEventListener('gesturestart', preventGestureStart)
      document.removeEventListener('gesturechange', preventGestureStart)
      document.removeEventListener('gestureend', preventGestureStart)
    }
  }, [])

  const portalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Close button — respects safe area for notch */}
      <button
        onClick={handleClose}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10 bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-1.5 cursor-pointer"
        aria-label="Close photo booth"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Main booth container — respects safe areas for notch/home indicator */}
      <div
        className="w-full max-w-[400px] mx-auto px-4 flex flex-col items-center gap-4 overflow-y-auto overscroll-y-contain"
        style={{
          maxHeight: '100dvh',
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Camera Error State */}
        {cameraError && phase === 'camera' && (
          <div className="w-full aspect-square bg-gray-900 rounded border-2 border-gray-700 flex flex-col items-center justify-center gap-4 p-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
            <p className="text-gray-400 text-sm text-center">{cameraError}</p>
            <button
              onClick={restartCamera}
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded active:scale-95 transition-all"
            >
              try again
            </button>
          </div>
        )}

        {/* Camera / Countdown Phase */}
        {(phase === 'camera' || phase === 'countdown') && !cameraError && (
          <>
            {/* Viewfinder — video always in DOM so ref is available for stream attachment */}
            <div className="relative w-full aspect-square bg-black rounded overflow-hidden border-2 border-white/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: facingMode === 'user' ? `scaleX(-1) scale(${FRONT_CAMERA_ZOOM})` : 'none',
                  WebkitTransform: facingMode === 'user' ? `scaleX(-1) scale(${FRONT_CAMERA_ZOOM})` : 'none',
                }}
              />

              {/* Loading overlay — plain black, seamless with bg during camera toggle */}
              {cameraLoading && (
                <div className="absolute inset-0 bg-black z-[1]" />
              )}

              {/* Overlay preview — always visible so it doesn't flash on toggle */}
              {currentOverlayUrl && (
                <img
                  src={currentOverlayUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-[2]"
                  draggable={false}
                />
              )}

              {/* Countdown overlay */}
              <AnimatePresence mode="wait">
                {phase === 'countdown' && (
                  <motion.div
                    key={countdownNumber}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center z-[3]"
                  >
                    <span className="font-bebas text-white text-[120px] leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                      {countdownNumber}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls — fixed height container prevents viewfinder shift */}
            {!cameraLoading && (
              <div className="h-[72px] flex items-center justify-center">
                {phase === 'camera' && (
                  <div className="flex items-center gap-6">
                    {/* Camera toggle */}
                    {hasMultipleCameras && (
                      <button
                        onClick={toggleCamera}
                        className="w-12 h-12 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all"
                        aria-label="Switch camera"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="white"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 14.652V19.644"
                          />
                        </svg>
                      </button>
                    )}

                    {/* Capture button — 72px touch target for mobile */}
                    <button
                      onClick={startCountdown}
                      disabled={isCapturingRef.current}
                      className="w-[72px] h-[72px] rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 active:scale-90 transition-all shadow-lg flex items-center justify-center"
                      aria-label="Take photo"
                    >
                      <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-400" />
                    </button>

                    {/* Spacer for centering when toggle is present */}
                    {hasMultipleCameras && <div className="w-12 h-12" />}
                  </div>
                )}

                {phase === 'countdown' && (
                  <button
                    onClick={cancelCountdown}
                    className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-8 text-sm font-bold border border-gray-600 rounded active:scale-95 transition-all"
                    aria-label="Cancel countdown"
                  >
                    cancel
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Review Phase */}
        {phase === 'review' && capturedDataUrl && (
          <>
            {/* Captured image */}
            <div className="relative w-full aspect-square bg-black rounded overflow-hidden border-2 border-white/20">
              <img
                src={capturedDataUrl}
                alt="Your photo"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>

            {/* Action buttons — py-4 for comfortable mobile tapping (48px+ touch target) */}
            <div className="w-full flex gap-2">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 text-sm font-bold border border-gray-600 rounded active:scale-95 transition-all"
              >
                retake
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 text-sm font-bold rounded active:scale-95 transition-all"
              >
                {saveSuccess ? 'saved!' : 'download'}
              </button>
              {canShare && (
                <button
                  onClick={handleShare}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 text-sm font-bold rounded active:scale-95 transition-all disabled:opacity-60"
                >
                  {isSaving ? 'sharing...' : 'share'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null

  return createPortal(portalContent, document.body)
}
