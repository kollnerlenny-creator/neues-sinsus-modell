import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = 'Ein unerwarteter Fehler ist aufgetreten.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; path?: string };
      if (parsed?.error) {
        readable = `${parsed.error}${parsed.path ? ` (${parsed.path})` : ''}`;
      }
    } catch {
      if (error?.message) {
        readable = error.message;
      }
    }
    return {
      hasError: true,
      message: readable,
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#040406] p-6 text-[#f7f8f8]">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#0e1014] p-7 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold text-white">
              Ansicht konnte nicht geladen werden
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#9ea4b0]">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f7f8f8] px-5 py-2.5 text-sm font-semibold text-[#08090a] hover:bg-white cursor-pointer transition-colors"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Seite neu laden</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
