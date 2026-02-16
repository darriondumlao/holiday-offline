'use client'

import { ReactNode } from 'react'

interface StaticModalWrapperProps {
  children: ReactNode
  className?: string
}

export default function StaticModalWrapper({
  children,
  className = '',
}: StaticModalWrapperProps) {
  return (
    <div className={`select-none ${className}`}>
      {children}
    </div>
  )
}
