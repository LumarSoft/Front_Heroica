'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Generic React Error Boundary.
 * Catches uncaught render errors in the subtree and displays a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _info: React.ErrorInfo) {
    // Error capturado y mostrado en fallback UI. Para debugging en prod, integrar Sentry u otro servicio.
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-10 rounded-xl border border-rose-200 bg-rose-50 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <div>
            <p className="text-base font-semibold text-rose-700">Ocurrió un error inesperado</p>
            <p className="text-sm text-rose-500 mt-1">{this.state.error?.message ?? 'Error desconocido'}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="border-rose-300 text-rose-600 hover:bg-rose-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
