import { Link } from 'react-router-dom'

function AssistantProductResult({ product }) {
  const isWatch = product.category?.toLowerCase().includes('watch')
  const hasImage = Boolean(product.image_url)
  const productId = product.id ?? product._id

  return (
    <Link
      to={`/product/${productId}`}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '10px',
        minWidth: '220px',
        maxWidth: '240px',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '8px',
          flexShrink: 0,
          background: hasImage ? undefined : 'linear-gradient(135deg, #0d2031, #1a3a52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {hasImage ? (
          <img
            src={product.image_url}
            alt={product.name || 'Product'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement.style.background =
                'linear-gradient(135deg, #0d2031, #1a3a52)'
            }}
          />
        ) : (
          <div style={{ opacity: 0.35, color: '#fff' }}>
            {isWatch ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="7" />
                <polyline points="12 9 12 12 13.5 13.5" />
                <path d="M9 3h6l1 3H8L9 3z" />
                <path d="M9 21h6l1-3H8l1 3z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M2 8c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
                <path d="M7 10h10" />
              </svg>
            )}
          </div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        {product.brand && (
          <p
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#C9A84C',
              textTransform: 'uppercase',
              marginBottom: '2px',
            }}
          >
            {product.brand}
          </p>
        )}
        <p
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#0d2031',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.name}
        </p>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0d2031', marginTop: '2px' }}>
          Rs. {Number(product.price || 0).toLocaleString()}
        </p>
      </div>
    </Link>
  )
}

export default AssistantProductResult