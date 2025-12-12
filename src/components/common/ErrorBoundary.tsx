import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full"
          >
            <div className="backdrop-blur-xl bg-gradient-to-br from-red-900/20 to-pink-900/20 border border-red-500/30 rounded-2xl p-8">
              {/* Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-red-500/20 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-white text-center mb-3">
                Something went wrong
              </h1>
              
              {/* Description */}
              <p className="text-white/60 text-center mb-6">
                We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
              </p>

              {/* Error details (in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-red-500/20">
                  <summary className="text-red-400 text-sm cursor-pointer mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-red-300 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline Error Display
 * For showing errors within a section/component
 */
interface InlineErrorProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ error, onRetry, className = '' }: InlineErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-400 mb-1 font-medium">Error</h3>
          <p className="text-red-300/80 text-sm">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-red-300 hover:text-red-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 * For when there's no data to display
 */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 ${className}`}>
      {icon && (
        <div className="mb-4 p-4 bg-white/5 rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-white mb-2">{title}</h3>
      {description && (
        <p className="text-white/60 text-sm max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-lg transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Network Error Component
 * Specific error for network/API failures
 */
interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

export function NetworkError({ onRetry, message = 'Unable to connect to the server' }: NetworkErrorProps) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
      <div className="flex flex-col items-center">
        <div className="p-4 bg-amber-500/20 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-amber-400 mb-2">Connection Error</h3>
        <p className="text-amber-300/80 text-sm mb-4 max-w-md">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
