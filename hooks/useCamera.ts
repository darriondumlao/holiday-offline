'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  error: string | null
  isLoading: boolean
  facingMode: 'user' | 'environment'
  hasMultipleCameras: boolean
  toggleCamera: () => void
  stopCamera: () => void
  restartCamera: () => void
}

const ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError: 'Camera access denied. Please allow camera permissions in your browser settings.',
  NotFoundError: 'No camera found on this device.',
  NotReadableError: 'Camera is in use by another app. Please close other apps using the camera.',
  OverconstrainedError: 'Camera does not support the required settings.',
  AbortError: 'Camera initialization was interrupted. Please try again.',
  TypeError: 'Camera access is not available. Please use HTTPS.',
}

export default function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Detect available cameras — called after permission grant for accurate iOS results
  const detectCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')
      if (mountedRef.current) {
        setHasMultipleCameras(videoDevices.length > 1)
      }
    } catch {
      // Silently fail — toggle button just won't show
    }
  }, [])

  // Attach stream to video element with safety checks
  const attachStream = useCallback((mediaStream: MediaStream) => {
    // If we already have a stream, stop it first to prevent leaks
    if (streamRef.current && streamRef.current !== mediaStream) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    streamRef.current = mediaStream

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream
      // play() returns a promise — catch iOS autoplay rejections
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — video element's autoPlay attribute handles this
        })
      }
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(
    async (facing: 'user' | 'environment') => {
      if (!mountedRef.current) return

      setIsLoading(true)
      setError(null)

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not available. Please make sure you are using HTTPS.')
        setIsLoading(false)
        return
      }

      // Try with ideal resolution first, then fallback without constraints
      const constraints = [
        {
          video: {
            facingMode: facing,
            width: { ideal: 1920 },
            height: { ideal: 1920 },
          },
          audio: false,
        },
        {
          video: { facingMode: facing },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ]

      for (const constraint of constraints) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraint)

          if (!mountedRef.current) {
            // Component unmounted during async — clean up
            mediaStream.getTracks().forEach((track) => track.stop())
            return
          }

          attachStream(mediaStream)
          await detectCameras()
          setIsLoading(false)
          return
        } catch {
          // Try next constraint set
          continue
        }
      }

      // All constraint sets failed
      if (mountedRef.current) {
        setError('Failed to start camera. Please check your permissions and try again.')
        setIsLoading(false)
      }
    },
    [attachStream, detectCameras]
  )

  // Stop all tracks and clean up
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Toggle between front and back camera
  const toggleCamera = useCallback(() => {
    stopCamera()
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    startCamera(newFacing)
  }, [facingMode, stopCamera, startCamera])

  // Restart camera with current facing mode
  const restartCamera = useCallback(() => {
    stopCamera()
    startCamera(facingMode)
  }, [facingMode, stopCamera, startCamera])

  // Attach pending stream when video element mounts into DOM
  // This covers the race where getUserMedia resolves before <video> renders
  const streamForEffect = streamRef.current
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {})
      }
    }
  }, [streamForEffect, isLoading])

  // Initialize camera on mount, clean up on unmount
  useEffect(() => {
    startCamera('user')

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    videoRef,
    error,
    isLoading,
    facingMode,
    hasMultipleCameras,
    toggleCamera,
    stopCamera,
    restartCamera,
  }
}
