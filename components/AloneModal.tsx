'use client'

import ModalWrapper from './ModalWrapper'

interface AloneModalProps {
  onClose: () => void
  title?: string
}

export default function AloneModal({ onClose, title = 'who do you perform for when you\'re alone?' }: AloneModalProps) {
  const handleWatch = () => {
    window.open('https://youtu.be/562g_xqTtOU?si=nmcQE_IK4bqlEDEf', '_blank', 'noopener,noreferrer')
  }

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'watch', onClick: handleWatch },
      ]}
    >
      <div className='flex items-center justify-center w-full h-[180px]'>
        <p className='text-gray-700 text-sm font-medium text-center px-4 lowercase'>
          who do you perform for when you&apos;re alone?
        </p>
      </div>
    </ModalWrapper>
  )
}
