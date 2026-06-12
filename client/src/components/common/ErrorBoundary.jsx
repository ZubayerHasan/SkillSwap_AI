import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full card p-8 text-center space-y-5">
            <div className="text-6xl mb-2">💥</div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Something went wrong</h1>
            <p className="text-text-secondary text-sm">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-text-muted bg-background-elevated rounded-xl p-4 max-h-32 overflow-auto">
                <summary className="cursor-pointer font-medium text-text-secondary mb-2">Error details</summary>
                <pre className="whitespace-pre-wrap font-mono">{this.state.error.toString()}</pre>
              </details>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="btn-ghost"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
