"use client"

import React, { Component, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[E Private AI] ErrorBoundary caught error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center border border-red-500/20">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || "An unexpected error occurred in this component."}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  if (error) {
    throw error
  }

  return setError
}
