import { useState } from 'react'

function ProductImageGallery({ images = [], productName = 'Product', badges = null, className = '', style = {} }) {
  const [selectedImage, setSelectedImage] = useState(0)

  // Don't render anything if no images
  if (!images || images.length === 0) {
    return (
      <div style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }} className={className}>
        <div style={{ opacity: 0.2, color: 'var(--color-navy)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      </div>
    )
  }

  const currentImage = images[selectedImage]

  return (
    <div className={className} style={style}>
      {/* Main Image */}
      <div style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        position: 'relative',
      }}>
        {currentImage ? (
          <>
            <img
              src={currentImage.url}
              alt={`${productName} - Image ${selectedImage + 1}`}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                display: 'block' 
              }}
            />
            
            {/* Badges overlay */}
            {badges && (
              <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'flex', gap: '6px', zIndex: 10 }}>
                {badges}
              </div>
            )}
            
            {/* Navigation arrows - only show if more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                    e.target.style.transform = 'translateY(-50%) scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                    e.target.style.transform = 'translateY(-50%) scale(1)'
                  }}
                >
                  ‹
                </button>
                
                <button
                  onClick={() => setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                    e.target.style.transform = 'translateY(-50%) scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                    e.target.style.transform = 'translateY(-50%) scale(1)'
                  }}
                >
                  ›
                </button>
              </>
            )}
            
            {/* Image counter */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}>
                {selectedImage + 1} / {images.length}
              </div>
            )}
          </>
        ) : (
          <div style={{ opacity: 0.2, color: 'var(--color-navy)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Thumbnail Strip - only shown if multiple images */}
      {images.length > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          overflowX: 'auto', 
          paddingBottom: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9',
        }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(i)}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: i === selectedImage
                  ? '2px solid var(--color-navy)'
                  : '2px solid var(--color-border)',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
                backgroundColor: '#f3f4f6',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (i !== selectedImage) {
                  e.target.style.borderColor = '#94a3b8'
                }
              }}
              onMouseLeave={(e) => {
                if (i !== selectedImage) {
                  e.target.style.borderColor = 'var(--color-border)'
                }
              }}
            >
              <img
                src={img.url}
                alt={`${productName} - Thumbnail ${i + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  display: 'block' 
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductImageGallery