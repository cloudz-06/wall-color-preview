import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-sand-50 p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center text-3xl mb-4">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            The application encountered an unexpected error.
          </p>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100 text-left overflow-auto max-w-2xl w-full mb-6">
            <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap">
              {this.state.error?.toString()}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
