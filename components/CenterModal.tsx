'use client'

import ModalWrapper from './ModalWrapper'

interface CenterModalProps {
  onClose: () => void
  title?: string
}

export default function CenterModal({ onClose, title = 'click the buttons' }: CenterModalProps) {
  const handlePress = () => {
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLSf5688hipF8wVTQS69nzC9zeDeH-3jggDWAro0lkr_tqJ57_A/viewform',
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'press', onClick: handlePress },
        { label: 'press', onClick: handlePress },
        { label: 'press', onClick: handlePress },
      ]}
    >
      <p className='text-black text-base font-medium text-center leading-snug'>
        LEAD THE CONVERSATION.<br />
        FILMING BEGINS MONDAY.
      </p>
    </ModalWrapper>
  )
}
