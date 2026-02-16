'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
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
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Detect available cameras
  useEffect(() => {
    async function detectCameras() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === 'videoinput')
        setHasMultipleCameras(videoDevices.length > 1)
      } catch {
        // Silently fail - toggle button just won't show
      }
    }
    detectCameras()
  }, [])

  // Start camera stream
  const startCamera = useCallback(
    async (facing: 'user' | 'environment') => {
      setIsLoading(true)
      setError(null)

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'Camera access is not available. Please make sure you are using HTTPS.'
        )
        setIsLoading(false)
        return
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 900 },
            height: { ideal: 1200 },
          },
          audio: false,
        })

        streamRef.current = mediaStream
        setStream(mediaStream)

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }

        setIsLoading(false)
      } catch (err) {
        const errorName = err instanceof Error ? err.name : 'Unknown'
        const message =
          ERROR_MESSAGES[errorName] ||
          'Failed to start camera. Please try again.'
        setError(message)
        setIsLoading(false)
      }
    },
    []
  )

  // Stop all tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
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

  // Initialize camera on mount
  useEffect(() => {
    startCamera(facingMode)

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
    stream,
    error,
    isLoading,
    facingMode,
    hasMultipleCameras,
    toggleCamera,
    stopCamera,
    restartCamera,
  }
}
