import { Link } from 'react-router-dom'

/**
 * Normalizes a product from /search?q=... (Python semantic search service)
 * into the fields this row needs. The service returns `image_url` and/or
 * `images` ([{url}]) plus `rating` (singular) — see product_service.py's
 * _product_to_dict(). This row only needs a thumbnail, so it takes the
 * first available image source rather than requiring a specific shape.
 */
function getThumbnail(product) {
  return (
    product.image_url ||
    product.images?.[0]?.url ||
    product.image?.[0]?.url ||
    null
  )
}

function SearchResultRow({ product, isHighlighted = false, onSelect }) {
  const thumbnail = getThumbnail(product)
  const price = product.discountPrice ?? product.price ?? 0

  return (
    <Link
      to={`/product/${product.id ?? product._id}`}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px',
        borderRadius: '8px',
        textDecoration: 'none',
        backgroundColor: isHighlighted ? '#f7f5f0' : 'transparent',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7f5f0')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isHighlighted ? '#f7f5f0' :'transparent')}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          flexShrink: 0,
          overflow: 'hidden',
          background: thumbnail ? '#f3f4f6' : 'linear-gradient(135deg, #0d2031, #1a3a52)',
        }}
      >
        {thumbnail && (
          <img
            src={thumbnail}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        {product.brand && (
          <p
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#C9A84C',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {product.brand}
          </p>
        )}
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#0d2031',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {product.name}
        </p>
      </div>

      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d2031', flexShrink: 0 }}>
        Rs. {Number(price).toLocaleString()}
      </span>
    </Link>
  )
}

export default SearchResultRow