'use client'

import ModalWrapper from './ModalWrapper'

interface BottomLeftModalProps {
  title: string
  questionText: string
  imageUrl: string
  downloadFileName: string
  fileExtension: string | null
  onClose: () => void
}

export default function BottomLeftModal({
  title,
  questionText,
  imageUrl,
  downloadFileName,
  fileExtension,
  onClose,
}: BottomLeftModalProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${downloadFileName}${fileExtension ? `.${fileExtension}` : ''}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleWhoAmI = () => {
    window.open(
      'https://youtu.be/Xkg7dp1QY9k?si=EuQIMvpoB_FmhR6d',
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleOffline = () => {
    window.open(
      'https://youtu.be/See0q6nZQZ8?si=LpaW5sQE2yh4a1Ym',
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <ModalWrapper
      title={title}
      onClose={onClose}
      buttons={[
        { label: 'download', onClick: handleDownload },
        { label: 'who am i', onClick: handleWhoAmI },
        { label: 'offline', onClick: handleOffline },
      ]}
    >
      <p className='text-black text-base font-medium text-center leading-snug'>
        {questionText}
      </p>
    </ModalWrapper>
  )
}
