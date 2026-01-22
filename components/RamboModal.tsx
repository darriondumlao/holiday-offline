'use client'

import Image from 'next/image'
import ModalWrapper from './ModalWrapper'

interface RamboModalProps {
  onClose: () => void
  title?: string
}

export default function RamboModal({ onClose, title = 'january 29th limited to 99 pairs ($99)' }: RamboModalProps) {
  const handleRambo = () => {
    window.open(
      'https://youtube.com/shorts/M7BFBdyZXGs?feature=share',
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'rambo', onClick: handleRambo },
      ]}
    >
      <div className='relative w-full h-[180px]'>
        <Image
          src='/rambo-rollout.jpeg'
          alt='Rambo Rollout'
          fill
          className='object-contain'
        />
      </div>
    </ModalWrapper>
  )
}
