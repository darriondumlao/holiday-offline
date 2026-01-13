'use client'

interface BouncingDownloadModalProps {
  title: string
  questionText: string
  imageUrl: string
  downloadFileName: string
  fileExtension: string | null
  onClose: () => void
}

export default function BouncingDownloadModal({
  title,
  questionText,
  imageUrl,
  downloadFileName,
  fileExtension,
  onClose,
}: BouncingDownloadModalProps) {
  const handleDownload = async () => {
    try {
      // Fetch the file and trigger download
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Use the file extension from Sanity, or default to the original if not provided
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
    <div
      className='fixed z-50 w-[280px] sm:w-[320px] select-none left-4 bottom-16'
    >
      {/* Blue Header */}
      <div className='bg-blue-600 px-2 py-1 flex items-center justify-between rounded-t-sm'>
        <h2 className='text-white font-bold text-xs'>{title}</h2>
        <button
          onClick={onClose}
          className='bg-orange-500 hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all rounded-sm p-0.5 cursor-pointer'
          aria-label='Close'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='white'
            className='w-3 h-3'
          >
            <path
              fillRule='evenodd'
              d='M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className='bg-gray-200 px-3 py-6 flex items-center justify-center min-h-[140px]'>
        <p className='text-black text-base font-medium text-center leading-snug'>
          {questionText}
        </p>
      </div>

      {/* Button Row */}
      <div className='bg-blue-600 px-1.5 py-1.5 flex items-center justify-between gap-1.5 rounded-b-sm'>
        <button
          onClick={handleDownload}
          className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'
        >
          <span className='underline'>D</span>ownload
        </button>
        <button
          onClick={handleWhoAmI}
          className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'
        >
          <span className='underline'>W</span>ho Am I
        </button>
        <button
          onClick={handleOffline}
          className='flex-1 bg-gray-200 hover:bg-white hover:scale-105 active:scale-95 transition-all px-2 py-1.5 border-2 border-black text-black font-bold text-xs cursor-pointer'
        >
          <span className='underline'>O</span>ffline
        </button>
      </div>
    </div>
  )
}
