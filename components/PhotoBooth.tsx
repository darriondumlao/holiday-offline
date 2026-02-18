'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCamera from '@/hooks/useCamera'
import usePhotoBoothOverlays from '@/hooks/usePhotoBoothOverlays'

interface PhotoBoothProps {
  onClose: () => void
}

type BoothPhase = 'camera' | 'countdown' | 'review' | 'upload-success'

// Canvas dimensions (1:1 square to match overlay)
const CANVAS_WIDTH = 720
const CANVAS_HEIGHT = 720

export default function PhotoBooth({ onClose }: PhotoBoothProps) {
  const [phase, setPhase] = useState<BoothPhase>('camera')
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const selectedOverlayIndex = 0 // Always use the first overlay
  const [consentChecked, setConsentChecked] = useState(false)
  const [uploaderName, setUploaderName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)

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

  const { overlays, loading: overlaysLoading } = usePhotoBoothOverlays()

  // Preload overlay images for canvas compositing
  const overlayImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    overlays.forEach((overlay) => {
      if (!overlayImagesRef.current.has(overlay._id)) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = overlay.imageUrl
        overlayImagesRef.current.set(overlay._id, img)
      }
    })
  }, [overlays])

  // Set fingerprint cookie on mount
  useEffect(() => {
    if (!document.cookie.includes('pb_fp=')) {
      const fp = crypto.randomUUID()
      document.cookie = `pb_fp=${fp}; max-age=86400; path=/; SameSite=Strict`
    }
  }, [])

  // Close handler - stop camera and exit
  const handleClose = useCallback(() => {
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

  // Canvas compositing - capture photo
  const capturePhoto = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate center-crop for the video to fit 3:4
    const videoAspect = video.videoWidth / video.videoHeight
    const targetAspect = CANVAS_WIDTH / CANVAS_HEIGHT

    let sx: number, sy: number, sw: number, sh: number

    if (videoAspect > targetAspect) {
      // Video is wider than 3:4 — crop sides
      sh = video.videoHeight
      sw = sh * targetAspect
      sx = (video.videoWidth - sw) / 2
      sy = 0
    } else {
      // Video is taller than 3:4 — crop top/bottom
      sw = video.videoWidth
      sh = sw / targetAspect
      sx = 0
      sy = (video.videoHeight - sh) / 2
    }

    // Mirror front camera
    if (facingMode === 'user') {
      ctx.translate(CANVAS_WIDTH, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Draw overlay on top if selected
    const selectedOverlay =
      selectedOverlayIndex >= 0 ? overlays[selectedOverlayIndex] : null

    if (selectedOverlay) {
      const overlayImg = overlayImagesRef.current.get(selectedOverlay._id)
      if (overlayImg && overlayImg.complete) {
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
  }, [videoRef, facingMode, selectedOverlayIndex, overlays])

  // Countdown and capture sequence
  const startCountdown = useCallback(() => {
    setPhase('countdown')
    setCountdownNumber(3)

    let count = 3
    const interval = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdownNumber(count)
      } else {
        clearInterval(interval)
        capturePhoto().then(() => {
          setPhase('review')
        })
      }
    }, 1000)
  }, [capturePhoto])

  // Retake photo
  const handleRetake = useCallback(() => {
    if (capturedDataUrl) {
      URL.revokeObjectURL(capturedDataUrl)
    }
    setCapturedBlob(null)
    setCapturedDataUrl(null)
    setConsentChecked(false)
    setUploaderName('')
    setUploadError('')
    setShowUploadForm(false)
    setPhase('camera')
    restartCamera()
  }, [capturedDataUrl, restartCamera])

  // Save to device
  const handleSave = useCallback(() => {
    if (!capturedBlob) return
    const url = URL.createObjectURL(capturedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `photo-booth-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [capturedBlob])

  // Upload to yearbook
  const handleUpload = useCallback(async () => {
    if (!capturedBlob || !consentChecked) return

    setIsUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('image', capturedBlob, `yearbook-${Date.now()}.jpg`)
      if (uploaderName.trim()) {
        formData.append('name', uploaderName.trim())
      }

      const response = await fetch('/api/photo-booth/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setPhase('upload-success')
      } else if (response.status === 429) {
        setUploadError(data.error || 'Upload limit reached. Try again in 24 hours.')
      } else {
        setUploadError(data.error || 'Upload failed. Please try again.')
      }
    } catch {
      setUploadError('Network error. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [capturedBlob, consentChecked, uploaderName])

  // Take another photo (from success screen)
  const handleTakeAnother = useCallback(() => {
    if (capturedDataUrl) {
      URL.revokeObjectURL(capturedDataUrl)
    }
    setCapturedBlob(null)
    setCapturedDataUrl(null)
    setConsentChecked(false)
    setUploaderName('')
    setUploadError('')
    setShowUploadForm(false)
    setPhase('camera')
    restartCamera()
  }, [capturedDataUrl, restartCamera])

  // Get the current overlay URL for live preview
  const currentOverlayUrl =
    selectedOverlayIndex >= 0 && overlays[selectedOverlayIndex]
      ? overlays[selectedOverlayIndex].imageUrl
      : null

  const portalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-1.5 cursor-pointer"
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

      {/* Main booth container */}
      <div className="w-full max-w-[400px] mx-auto px-4 flex flex-col items-center gap-4 max-h-[100dvh] overflow-y-auto py-8">
        {/* Title */}
        <h2 className="font-bebas text-white text-2xl tracking-wider uppercase">
          Photo Booth
        </h2>

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
          </div>
        )}

        {/* Camera Loading State */}
        {cameraLoading && !cameraError && phase === 'camera' && (
          <div className="w-full aspect-square bg-gray-900 rounded border-2 border-gray-700 flex items-center justify-center">
            <p className="text-gray-400 text-sm">starting camera...</p>
          </div>
        )}

        {/* Camera / Countdown Phase */}
        {(phase === 'camera' || phase === 'countdown') && !cameraError && (
          <>
            {/* Viewfinder */}
            <div className="relative w-full aspect-square bg-black rounded overflow-hidden border-2 border-white/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
              />

              {/* Overlay preview */}
              {currentOverlayUrl && (
                <img
                  src={currentOverlayUrl}
                  alt="Overlay"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  crossOrigin="anonymous"
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
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="font-bebas text-white text-[120px] leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                      {countdownNumber}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Camera controls */}
            {phase === 'camera' && !cameraLoading && (
              <div className="flex items-center gap-6">
                {/* Camera toggle */}
                {hasMultipleCameras && (
                  <button
                    onClick={toggleCamera}
                    className="w-11 h-11 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all"
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

                {/* Capture button */}
                <button
                  onClick={startCountdown}
                  className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 active:scale-90 transition-all shadow-lg flex items-center justify-center"
                  aria-label="Take photo"
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-400" />
                </button>

                {/* Spacer for centering when toggle is present */}
                {hasMultipleCameras && <div className="w-11 h-11" />}
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
              />
            </div>

            {/* Action buttons */}
            <div className="w-full flex gap-2">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 text-sm font-bold border border-gray-600 rounded active:scale-95 transition-all"
              >
                retake
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-bold rounded active:scale-95 transition-all"
              >
                save to device
              </button>
            </div>

            {/* Upload to yearbook section — temporarily disabled
            {!showUploadForm ? (
              <button
                onClick={() => setShowUploadForm(true)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-gray-300 py-3 text-sm border border-gray-700 rounded active:scale-95 transition-all"
              >
                upload to yearbook
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="w-full space-y-3 bg-gray-900 border border-gray-700 rounded p-4"
              >
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value.slice(0, 50))}
                  placeholder="your name (optional)"
                  className="w-full bg-transparent border-b border-gray-600 text-white text-sm py-2 focus:outline-none focus:border-gray-400 placeholder:text-gray-600"
                />
                <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 cursor-pointer"
                  />
                  <span>
                    I consent to my photo being displayed publicly in the
                    yearbook gallery. Photos cannot be removed after submission.
                  </span>
                </label>
                {uploadError && (
                  <p className="text-yellow-500 text-xs">{uploadError}</p>
                )}
                <button
                  onClick={handleUpload}
                  disabled={!consentChecked || isUploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  {isUploading ? 'uploading...' : 'upload to yearbook'}
                </button>
              </motion.div>
            )}
            */}
          </>
        )}

        {/* Upload Success Phase */}
        {phase === 'upload-success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center gap-6 py-8"
          >
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-green-500"
              >
                <path
                  fillRule="evenodd"
                  d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bebas text-white text-xl tracking-wider">
                Photo Submitted!
              </h3>
              <p className="text-gray-400 text-sm">
                Your photo will appear in the yearbook once approved.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleTakeAnother}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-bold rounded active:scale-95 transition-all"
              >
                take another
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 text-sm font-bold border border-gray-600 rounded active:scale-95 transition-all"
              >
                close
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null

  return createPortal(portalContent, document.body)
}
