'use client'

import Image from 'next/image'
import ModalWrapper from './ModalWrapper'

interface TopRightModalProps {
  onClose: () => void
  title?: string
}

export default function TopRightModal({ onClose, title = 'january 29th' }: TopRightModalProps) {
  const handleOffline = () => {
    window.open('https://holidaybrand.co', '_blank', 'noopener,noreferrer')
  }

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'go', onClick: handleOffline },
        { label: 'to', onClick: handleOffline },
        { label: 'offline', onClick: handleOffline },
      ]}
    >
      <div className='relative w-full h-[180px]'>
        <Image
          src='/holiday-landing-updated.jpeg'
          alt='January 29th - Holiday 9 Year Anniversary'
          fill
          className='object-contain'
        />
      </div>
    </ModalWrapper>
  )
}
