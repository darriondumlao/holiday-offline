'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    // You could send this to an error reporting service like Sentry here
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or use provided fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-4 text-center">
          <div className="text-gray-500 text-sm tracking-wider mb-4">
            something went wrong
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-blue-500 hover:text-blue-400 text-xs tracking-wider border-b border-blue-500 hover:border-blue-400 transition-colors"
          >
            try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
