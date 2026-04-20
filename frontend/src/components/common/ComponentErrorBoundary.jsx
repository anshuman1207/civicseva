import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

/**
 * A more granular Error Boundary for individual dashboard components.
 * Prevents a single component crash from taking down the entire dashboard.
 */
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Component Error [${this.props.name || 'Unknown'}]:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center bg-[var(--color-surface-container-low)] rounded-[var(--radius-xl)] border border-dashed border-[var(--color-error)]/30 p-6 text-center gap-3">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-on-surface)]">
              {this.props.name || 'Component'} Failed
            </h4>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 max-w-[200px] mx-auto">
              This specific section encountered a rendering error.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-container-high)] text-[var(--color-primary)] rounded-lg text-xs font-bold hover:bg-[var(--color-surface-container-highest)] transition-all active:scale-95"
          >
            <RefreshCcw size={14} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
