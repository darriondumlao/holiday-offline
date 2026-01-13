'use client'

import { motion } from 'framer-motion'

interface RetroLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Classic Mac OS Beach Ball (Spinning Wait Cursor)
export default function RetroLoader({ size = 'md', className = '' }: RetroLoaderProps) {
  const sizes = {
    sm: 20,
    md: 32,
    lg: 48,
  }

  const pixelSize = sizes[size]

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <motion.svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 32 32"
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Classic Mac Beach Ball - Rainbow segments */}
        <circle cx="16" cy="16" r="15" fill="none" stroke="#333" strokeWidth="1" />

        {/* Blue segment */}
        <path d="M16,16 L16,1 A15,15 0 0,1 28.99,8.5 Z" fill="#0066FF" />
        {/* Cyan segment */}
        <path d="M16,16 L28.99,8.5 A15,15 0 0,1 28.99,23.5 Z" fill="#00CCFF" />
        {/* Green segment */}
        <path d="M16,16 L28.99,23.5 A15,15 0 0,1 16,31 Z" fill="#00CC00" />
        {/* Yellow segment */}
        <path d="M16,16 L16,31 A15,15 0 0,1 3.01,23.5 Z" fill="#FFCC00" />
        {/* Orange segment */}
        <path d="M16,16 L3.01,23.5 A15,15 0 0,1 3.01,8.5 Z" fill="#FF6600" />
        {/* Red segment */}
        <path d="M16,16 L3.01,8.5 A15,15 0 0,1 16,1 Z" fill="#FF0000" />
      </motion.svg>
    </div>
  )
}
