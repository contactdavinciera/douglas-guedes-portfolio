import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <h1 className="text-3xl font-bold text-red-500 mb-4">⚠️ Something went wrong</h1>
            <div className="bg-gray-900 p-6 rounded-lg mb-4">
              <h2 className="text-xl font-semibold mb-2">Error:</h2>
              <pre className="text-red-400 text-sm overflow-auto">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>
            {this.state.errorInfo && (
              <div className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Stack Trace:</h2>
                <pre className="text-gray-400 text-xs overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
