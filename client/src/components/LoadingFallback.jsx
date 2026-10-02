import React from 'react';

// Main loading spinner component
const LoadingSpinner = ({ size = 'medium', color = 'var(--color-navy)' }) => {
  const sizes = {
    small: { width: '20px', height: '20px', borderWidth: '2px' },
    medium: { width: '32px', height: '32px', borderWidth: '2px' },
    large: { width: '48px', height: '48px', borderWidth: '3px' },
  };

  const spinnerSize = sizes[size] || sizes.medium;

  return (
    <div
      style={{
        ...spinnerSize,
        border: `${spinnerSize.borderWidth} solid var(--color-border, #e5e5e5)`,
        borderTop: `${spinnerSize.borderWidth} solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

// Full page loading fallback
export const PageLoadingFallback = ({ 
  message = 'Loading...', 
  minHeight = '60vh',
  showSpinner = true 
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight,
    color: 'var(--color-navy, #1e293b)',
    backgroundColor: 'var(--color-background, #ffffff)',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '2rem',
    }}>
      {showSpinner && <LoadingSpinner size="large" />}
      <p style={{ 
        fontSize: '1rem', 
        fontWeight: '500',
        opacity: 0.8,
        margin: 0,
      }}>
        {message}
      </p>
    </div>
  </div>
);

// Component loading fallback (for lazy-loaded components)
export const ComponentLoadingFallback = ({ 
  message = 'Loading component...', 
  compact = false 
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: compact ? '200px' : '400px',
    color: 'var(--color-navy, #1e293b)',
    padding: compact ? '1rem' : '2rem',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: compact ? '8px' : '12px',
    }}>
      <LoadingSpinner size={compact ? 'medium' : 'large'} />
      <p style={{ 
        fontSize: compact ? '0.875rem' : '1rem', 
        opacity: 0.7,
        margin: 0,
      }}>
        {message}
      </p>
    </div>
  </div>
);

// Admin panel specific loading fallback
export const AdminLoadingFallback = ({ message = 'Loading admin panel...' }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: 'var(--color-navy, #1e293b)',
    backgroundColor: 'var(--color-background, #ffffff)',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '2rem',
    }}>
      <LoadingSpinner size="large" />
      <p style={{ 
        fontSize: '0.875rem', 
        opacity: 0.7,
        margin: 0,
      }}>
        {message}
      </p>
    </div>
  </div>
);

// Inline loading fallback (for smaller components)
export const InlineLoadingFallback = ({ 
  message = 'Loading...', 
  size = 'small' 
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--color-navy, #1e293b)',
    opacity: 0.7,
  }}>
    <LoadingSpinner size={size} />
    <span style={{ fontSize: '0.875rem' }}>{message}</span>
  </div>
);

// Skeleton loading for cards/lists
export const SkeletonCard = () => (
  <div style={{
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
  }}>
    <div style={{
      height: '20px',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      marginBottom: '0.5rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      height: '16px',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      width: '70%',
      marginBottom: '0.5rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      height: '16px',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      width: '40%',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  </div>
);

// Default export for general use
const LoadingFallback = ComponentLoadingFallback;

export default LoadingFallback;