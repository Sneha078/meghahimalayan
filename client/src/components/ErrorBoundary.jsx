import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, {
      //   extra: errorInfo,
      //   tags: { component: this.props.component || 'unknown' }
      // });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '1rem',
          color: '#dc2626',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem',
            color: '#991b1b'
          }}>
            Something went wrong
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            marginBottom: '1.5rem',
            color: '#7f1d1d'
          }}>
            {this.props.message || 'An unexpected error occurred while loading this component.'}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={this.handleRetry}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#dc2626';
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: 'transparent',
                color: '#dc2626',
                border: '1px solid #dc2626',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#fef2f2';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Reload Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginTop: '2rem', 
              textAlign: 'left',
              backgroundColor: '#fafafa',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #e5e5e5'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                fontSize: '0.75rem',
                color: '#6b7280',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                <strong>Error ID:</strong> {this.state.errorId}
                {'\n\n'}
                <strong>Error Message:</strong> {this.state.error?.message}
                {'\n\n'}
                <strong>Stack Trace:</strong> {this.state.error?.stack}
                {'\n\n'}
                <strong>Component Stack:</strong> {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper for functional components
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);
    
    // In a real application, you might want to:
    // 1. Send error to logging service
    // 2. Show toast notification
    // 3. Redirect to error page
    
    throw error; // Re-throw to trigger error boundary
  };
};

export default ErrorBoundary;