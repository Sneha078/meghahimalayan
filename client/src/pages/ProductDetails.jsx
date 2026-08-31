import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductById, getProductReviews, submitReview } from '../api/productClient'
import RecommendedProducts from '../components/RecommendedProducts'
import SentimentSummary from '../components/SentimentSummary'

// ── Upload limits ────────────────────────────────────────────────────────────
const MAX_IMAGES = 3
const MAX_IMAGE_SIZE = 5 * 1024 * 1024   // 5MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024  // 25MB

// ── Star row helper ────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width={size} height={size} viewBox="0 0 24 24"
          fill={star <= Math.round(rating) ? '#C9A84C' : 'none'}
          stroke="#C9A84C" strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

// ── Spec row helper ────────────────────────────────────────────────────────────
function SpecRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--color-border)',
      fontSize: '0.875rem',
    }}>
      <span style={{ color: 'var(--color-muted)', fontWeight: '500' }}>{label}</span>
      <span style={{ color: 'var(--color-navy)', fontWeight: '600', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [added, setAdded]                 = useState(false)
  const [wishlisted, setWishlisted]       = useState(false)

  // ── Reviews state ────────────────────────────────────────────────────────────
  const [reviews, setReviews]             = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewForm, setReviewForm]       = useState({ rating: 5, comment: '' })
  const [reviewImages, setReviewImages]   = useState([])
  const [reviewVideos, setReviewVideos]   = useState([])
  const [submitting, setSubmitting]       = useState(false)
  const [submitError, setSubmitError]     = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setSelectedImage(0)
    setReviews([])
    setSubmitSuccess(false)

    getProductById(id)
      .then((data) => { if (!cancelled) setProduct(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    // Fetch reviews in parallel — non-blocking
    setReviewsLoading(true)
    getProductReviews(id)
      .then((data) => { if (!cancelled) setReviews(data) })
      .catch(() => {/* silently ignore — reviews are non-critical */})
      .finally(() => { if (!cancelled) setReviewsLoading(false) })

    return () => { cancelled = true }
  }, [id])

  // ── Review media handlers (validated) ───────────────────────────────────────
  const handleImageChange = (e) => {
    const files = [...e.target.files]

    if (files.length > MAX_IMAGES) {
      setSubmitError(`You can upload up to ${MAX_IMAGES} photos.`)
      e.target.value = ''
      return
    }
    const oversized = files.find((f) => f.size > MAX_IMAGE_SIZE)
    if (oversized) {
      setSubmitError(`"${oversized.name}" is too large. Max photo size is 5MB.`)
      e.target.value = ''
      return
    }

    setSubmitError(null)
    setReviewImages(files)
  }

  const handleVideoChange = (e) => {
    const files = [...e.target.files]

    if (files.length > 0 && files[0].size > MAX_VIDEO_SIZE) {
      setSubmitError(`"${files[0].name}" is too large. Max video size is 25MB.`)
      e.target.value = ''
      return
    }

    setSubmitError(null)
    setReviewVideos(files)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.comment.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitReview({
        productId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        images: reviewImages,
        videos: reviewVideos,
      })
      setSubmitSuccess(true)
      setReviewForm({ rating: 5, comment: '' })
      setReviewImages([])
      setReviewVideos([])
      // Reload reviews to include the new one
      const updated = await getProductReviews(id)
      setReviews(updated)
    } catch (err) {
      setSubmitError(err.message.includes('401') ? 'Please log in to leave a review.' : 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddToCart = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>Loading product…</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: 'var(--color-error)', fontSize: '0.95rem' }}>
          {error ?? 'Product not found.'}
        </p>
        <button
          onClick={() => navigate('/shop')}
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--color-navy)',
            color: 'var(--color-taupe)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Back to Shop
        </button>
      </div>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const images       = product.image ?? []
  const imageUrl     = images[selectedImage]?.url ?? null
  const originalPrice = product.discountPrice ? product.price : null
  const sellingPrice  = product.discountPrice ?? product.price
  const discount      = originalPrice
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : null
  const rating      = product.ratings ?? 0
  const reviewCount = product.numOfReviews ?? 0
  const isNew        = product.isNewArrival ?? false
  const isBestseller = product.isBestSeller ?? false

  // Watch / eyeglasses / perfume specific spec fields
  const specs = product.category === 'watches'
    ? [
        { label: 'Watch Type',      value: product.watchType },
        { label: 'Dial Color',      value: product.dialColor },
        { label: 'Strap Material',  value: product.strapMaterial },
        { label: 'Case Size',       value: product.caseSize },
        { label: 'Movement',        value: product.movementType },
        { label: 'Water Resistance', value: product.waterResistance },
      ]
    : product.category === 'eyeglasses'
    ? [
        { label: 'Frame Shape',    value: product.frameShape },
        { label: 'Frame Material', value: product.frameMaterial },
        { label: 'Frame Color',    value: product.frameColor },
        { label: 'Lens Type',      value: product.lensType },
      ]
    : product.category === 'perfumes'
    ? [
        { label: 'Fragrance Family', value: product.fragranceFamily },
        { label: 'Fragrance Type',   value: product.fragranceType },
        { label: 'Volume',           value: product.volume },
      ]
    : []

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 5rem',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: 'var(--color-muted)',
      }}>
        <Link to="/" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link to="/shop" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>Shop</Link>
        <span>›</span>
        <Link
          to={`/shop`}
          style={{ color: 'var(--color-muted)', textDecoration: 'none', textTransform: 'capitalize' }}
        >
          {product.category}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--color-navy)', fontWeight: '500' }}>{product.name}</span>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '64px',
        alignItems: 'start',
      }}>

        {/* ── Left: Image gallery ──────────────────────────────────────────── */}
        <div>
          {/* Main image */}
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
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ opacity: 0.2, color: 'var(--color-navy)' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}

            {/* Badges overlay */}
            <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'flex', gap: '6px' }}>
              {isNew && (
                <span style={{ backgroundColor: '#C9A84C', color: '#0d1a2a', fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.08em' }}>
                  NEW
                </span>
              )}
              {isBestseller && (
                <span style={{ backgroundColor: '#0d1a2a', color: '#C9A84C', fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.08em' }}>
                  BESTSELLER
                </span>
              )}
              {discount && (
                <span style={{ backgroundColor: '#e74c3c', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '4px' }}>
                  {discount}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail strip — only shown if multiple images */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px' }}>
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
                  }}
                >
                  <img
                    src={img.url}
                    alt={`View ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Product info ───────────────────────────────────────────── */}
        <div>

          {/* Brand */}
          <p style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.18em',
            color: '#C9A84C',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            {product.brand}
          </p>

          {/* Name */}
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            lineHeight: '1.2',
            marginBottom: '16px',
          }}>
            {product.name}
          </h1>

          {/* Rating row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Stars rating={rating} size={16} />
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              {rating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-navy)' }}>
              Rs. {sellingPrice.toLocaleString()}
            </span>
            {originalPrice && (
              <span style={{ fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
            {discount && (
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e74c3c' }}>
                Save {discount}%
              </span>
            )}
          </div>

          {/* Stock status */}
          <div style={{ marginBottom: '24px' }}>
            {product.isOutOfStock ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.82rem', fontWeight: '600', color: '#e74c3c',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e74c3c', display: 'inline-block' }} />
                Out of Stock
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.82rem', fontWeight: '600', color: '#16a34a',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
                In Stock {product.stock <= 5 && product.stock > 0 && `· Only ${product.stock} left`}
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '24px' }} />

          {/* Gender / Subcategory tags */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {product.gender && (
              <span style={tagStyle}>{product.gender}</span>
            )}
            {product.subcategory && (
              <span style={tagStyle}>{product.subcategory}</span>
            )}
            {product.category && (
              <span style={{ ...tagStyle, textTransform: 'capitalize' }}>{product.category}</span>
            )}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            <button
              disabled={product.isOutOfStock}
              onClick={handleAddToCart}
              style={{
                flex: 1,
                padding: '14px 24px',
                backgroundColor: product.isOutOfStock ? '#e5e7eb' : (added ? '#16a34a' : 'var(--color-navy)'),
                color: product.isOutOfStock ? '#9ca3af' : 'var(--color-taupe)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: product.isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {added ? '✓ Added to Cart' : product.isOutOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
            </button>

            <button
              onClick={() => setWishlisted((w) => !w)}
              aria-label="Add to wishlist"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: wishlisted ? '#fff1f2' : 'var(--color-white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"
                fill={wishlisted ? '#e74c3c' : 'none'}
                stroke={wishlisted ? '#e74c3c' : '#555'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '10px' }}>
                Description
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: '1.7' }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Specs */}
          {specs.filter((s) => s.value).length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '4px' }}>
                Specifications
              </h3>
              {specs.map((s) => (
                <SpecRow key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          )}

          {/* AI Sentiment Summary */}
          <SentimentSummary productId={product._id} />

        </div>
      </div>

      {/* ── Reviews section ─────────────────────────────────────────────── */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 5rem 48px',
      }}>
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '48px' }}>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            marginBottom: '32px',
          }}>
            Customer Reviews
            {reviews.length > 0 && (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: '400', color: 'var(--color-muted)', marginLeft: '10px' }}>
                ({reviews.length})
              </span>
            )}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>

            {/* ── Left: existing reviews ───── */}
            <div>
              {reviewsLoading && (
                <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Loading reviews…</p>
              )}
              {!reviewsLoading && reviews.length === 0 && (
                <div style={{
                  padding: '32px 24px',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                }}>
                  <p style={{ color: 'var(--color-navy)', fontWeight: '600', marginBottom: '6px' }}>No reviews yet</p>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Be the first to share your experience.</p>
                </div>
              )}
              {!reviewsLoading && reviews.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reviews.map((r) => (
                    <div key={r._id} style={{
                      backgroundColor: 'var(--color-white)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      padding: '20px 24px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontWeight: '600', color: 'var(--color-navy)', fontSize: '0.9rem', marginBottom: '4px' }}>
                            {r.name}
                          </p>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1,2,3,4,5].map((star) => (
                              <svg key={star} width="12" height="12" viewBox="0 0 24 24"
                                fill={star <= r.rating ? '#C9A84C' : 'none'}
                                stroke="#C9A84C" strokeWidth="2"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', lineHeight: '1.6' }}>
                        {r.comment}
                      </p>

                      {r.images?.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                          {r.images.map((img) => (
                            <img
                              key={img.public_id}
                              src={img.url}
                              alt="Customer review"
                              style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            />
                          ))}
                        </div>
                      )}

                      {r.videos?.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                          {r.videos.map((vid) => (
                            <video
                              key={vid.public_id}
                              src={vid.url}
                              controls
                              style={{ width: '160px', height: '90px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: write a review ────── */}
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              padding: '28px 28px',
              position: 'sticky',
              top: '88px',
            }}>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.15rem',
                fontWeight: '700',
                color: 'var(--color-navy)',
                marginBottom: '20px',
              }}>
                Write a Review
              </h3>

              {submitSuccess && (
                <div style={{
                  padding: '12px 16px', borderRadius: '8px',
                  backgroundColor: '#dcfce7', color: '#15803d',
                  fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px',
                }}>
                  ✓ Review submitted successfully!
                </div>
              )}

              <form onSubmit={handleSubmitReview}>
                {/* Star picker */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '8px' }}>
                    Your Rating
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24"
                          fill={star <= reviewForm.rating ? '#C9A84C' : 'none'}
                          stroke="#C9A84C" strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '8px' }}>
                    Your Review
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product…"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.88rem',
                      color: 'var(--color-navy)',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Photos */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '8px' }}>
                    Add Photos <span style={{ textTransform: 'none', fontWeight: '400', letterSpacing: 'normal' }}>(up to 3, 5MB each)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}
                  />
                  {reviewImages.length > 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                      {reviewImages.length} image{reviewImages.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Video */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '8px' }}>
                    Add Video <span style={{ textTransform: 'none', fontWeight: '400', letterSpacing: 'normal' }}>(1 max, 25MB)</span>
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}
                  />
                  {reviewVideos.length > 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                      {reviewVideos.length} video selected
                    </p>
                  )}
                </div>

                {submitError && (
                  <p style={{ color: 'var(--color-error)', fontSize: '0.82rem', marginBottom: '12px' }}>
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !reviewForm.comment.trim()}
                  style={{
                    width: '100%',
                    padding: '13px',
                    backgroundColor: submitting || !reviewForm.comment.trim() ? '#e5e7eb' : 'var(--color-navy)',
                    color: submitting || !reviewForm.comment.trim() ? '#9ca3af' : 'var(--color-taupe)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: submitting || !reviewForm.comment.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textAlign: 'center', marginTop: '10px' }}>
                  You must be logged in to submit a review.
                </p>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* ── Recommendations ─────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 5rem 64px',
      }}>
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '48px' }}>
          <RecommendedProducts productId={product._id} />
        </div>
      </div>

    </div>
  )
}

const tagStyle = {
  padding: '4px 12px',
  borderRadius: '999px',
  border: '1px solid var(--color-border)',
  fontSize: '0.75rem',
  fontWeight: '500',
  color: 'var(--color-muted)',
  backgroundColor: 'var(--color-white)',
}

export default ProductDetail