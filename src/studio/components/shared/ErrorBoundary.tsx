'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Studio ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">Algo deu errado</h3>
          <p className="text-xs text-neutral-400 mb-4 max-w-md">
            {this.state.error?.message || 'Um erro inesperado ocorreu.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-600 transition-colors"
          >
            <RefreshCw size={12} />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
