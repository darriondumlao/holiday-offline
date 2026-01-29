'use client'

import Image from 'next/image'
import ModalWrapper from './ModalWrapper'

interface TopRightModalProps {
  onClose: () => void
  title?: string
}

export default function TopRightModal({ onClose, title = 'january 29th' }: TopRightModalProps) {
  const handleWatch = () => {
    window.open('https://youtu.be/j58MqIrhuHw?si=4TlmR_4TSjlY9wjk', '_blank', 'noopener,noreferrer')
  }

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'watch', onClick: handleWatch },
      ]}
    >
      <div className='relative w-full h-[180px]'>
        <Image
          src='/IMG_0316.jpeg'
          alt='January 29th - Holiday 9 Year Anniversary'
          fill
          className='object-contain'
        />
      </div>
    </ModalWrapper>
  )
}
