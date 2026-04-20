import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[var(--color-background)] flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full">
            <div className="relative bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-3xl)] overflow-hidden border border-[var(--color-outline-variant)] shadow-[var(--shadow-soft-3)]">
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/80" />
              
              <div className="p-8 md:p-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0 duration-500">
                  <ShieldAlert className="text-red-500" size={42} />
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-[var(--color-on-background)] mb-4 tracking-tight">
                  System Interrupted
                </h1>
                
                <p className="text-[var(--color-on-surface-variant)] text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  An unexpected rendering error occurred. Our automated systems are tracking this disruption.
                </p>

                {/* Technical Snippet */}
                <div className="w-full bg-[var(--color-surface-container-high)]/40 rounded-2xl p-4 mb-10 text-left border border-[var(--color-outline-variant)]/30">
                  <div className="flex items-center gap-2 mb-2 opacity-60">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Diagnostic Info</span>
                  </div>
                  <code className="text-xs text-red-500/80 font-mono break-all line-clamp-2">
                    {this.state.error?.toString() || 'Unknown runtime exception'}
                  </code>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20"
                  >
                    <RefreshCw size={20} />
                    Reload App
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] rounded-2xl font-bold hover:bg-[var(--color-outline-variant)]/20 active:scale-95 transition-all border border-[var(--color-outline-variant)]"
                  >
                    <Home size={20} />
                    Back to Home
                  </button>
                </div>
              </div>

              {/* Status Footer */}
              <div className="px-8 py-4 bg-[var(--color-surface-container)]/50 border-t border-[var(--color-outline-variant)]/30 flex justify-between items-center">
                <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)]/60 uppercase tracking-widest">Safety Protocol Active</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline-variant)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
