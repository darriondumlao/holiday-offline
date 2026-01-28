'use client'

/**
 * Global Error Boundary
 *
 * This catches errors in the root layout and provides a fallback UI.
 * It must include its own <html> and <body> tags since it replaces the root layout.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-black">
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-white text-lg tracking-widest font-light mb-4">
            something went wrong
          </h2>
          <p className="text-gray-500 text-xs tracking-wider mb-8 max-w-md">
            we encountered an unexpected error. please refresh the page.
          </p>
          <button
            onClick={() => reset()}
            className="text-blue-500 hover:text-blue-400 text-sm tracking-widest border-b border-blue-500 hover:border-blue-400 transition-colors pb-1"
          >
            try again
          </button>
        </div>
      </body>
    </html>
  )
}
