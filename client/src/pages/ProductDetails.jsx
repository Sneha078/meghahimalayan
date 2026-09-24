import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductById, getProductReviews, submitReview, deleteReview } from '../api/productClient'
import { useCart } from '../context/CartContext'
import RecommendedProducts from '../components/RecommendedProducts'
import SentimentSummary from '../components/SentimentSummary'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { trackProductView } from '../utils/recentlyViewed'
import ProductImageGallery from '../components/ProductImageGallery'

// ── Upload limits ────────────────────────────────────────────────────────────
const MAX_IMAGES = 3
const MAX_IMAGE_SIZE = 5 * 1024 * 1024   // 5MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024  // 25MB

// ── Optical Power Options ──────────────────────────────────────────────────
const SPHERE_OPTIONS = (() => {
  const list = []
  for (let s = 8.0; s >= -12.0; s -= 0.25) {
    const val = (s > 0 ? `+${s.toFixed(2)}` : s === 0 ? '0.00 (Plano)' : s.toFixed(2))
    list.push({ label: val, value: s.toFixed(2) })
  }
  return list
})()

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
  const { addItem } = useCart()
  const [product, setProduct]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  const [added, setAdded]                 = useState(false)
  const { user } = useAuth()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const navigate = useNavigate()

  // ── Prescription state for contact lenses & prescription eyewear ─────────────
  const [rxMode, setRxMode] = useState('plano') // 'plano' (zero-power cosmetic makeup) vs 'custom' (power Rx)
  const [sameEyes, setSameEyes] = useState(true) // true: one shared power field; false: separate left/right
  const [rxForm, setRxForm] = useState({
    rightEye: { sphere: '' },
    leftEye:  { sphere: '' },
  })
  const [rxError, setRxError] = useState('')

  // ── Reviews state ────────────────────────────────────────────────────────────
  const [reviews, setReviews]             = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewForm, setReviewForm]       = useState({ rating: 5, comment: '' })
  const [reviewImages, setReviewImages]   = useState([])
  const [reviewVideos, setReviewVideos]   = useState([])
  const [submitting, setSubmitting]       = useState(false)
  const [submitError, setSubmitError]     = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [deletingReview, setDeletingReview] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [lastSubmitWasEdit, setLastSubmitWasEdit] = useState(false)
  const photoInputRef = useRef(null)
  const videoInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    trackProductView(id)
    setLoading(true)
    setError(null)
    setSelectedVariantIdx(0)
    setReviews([])
    setSubmitSuccess(false)
    setRxError('')

    getProductById(id)
      .then((data) => {
        if (!cancelled) {
          setProduct(data)
          // Plano is the default: customers can buy without entering
          // prescription power and can switch to Custom Power if needed.
          setRxMode('plano')
        }
      })
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
      setLastSubmitWasEdit(editingReviewId !== null)
      setReviewForm({ rating: 5, comment: '' })
      setReviewImages([])
      setReviewVideos([])
      setEditingReviewId(null)

      // Clear file inputs
      if (photoInputRef.current) photoInputRef.current.value = ''
      if (videoInputRef.current) videoInputRef.current.value = ''

      // Reload reviews to include the new one
      const updated = await getProductReviews(id)
      setReviews(updated)
    } catch (err) {
      console.error('Review submission error:', err)
      let errorMessage = 'Failed to submit review. Please try again.'

      if (err.message.includes('401')) {
        errorMessage = 'Please log in to leave a review.'
      } else if (err.message.includes('400')) {
        errorMessage = err.message.includes('API error')
          ? err.message.replace('API error 400: ', '')
          : 'Invalid review data. Please check your input.'
      } else if (err.message.includes('413')) {
        errorMessage = 'Files are too large. Please use smaller images/videos.'
      }

      setSubmitError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit own review ────────────────────────────────────────────────────────
  // submitReview is an upsert (one review per user per product), so editing
  // just means pre-filling the form with the existing review and letting the
  // normal submit flow overwrite it. Photos/video aren't pre-filled — the
  // user would need to re-attach them if they want to change those too,
  // since we only have URLs here, not the original files.
  const handleEditReview = (review) => {
    setEditingReviewId(review._id)
    setReviewForm({ rating: review.rating, comment: review.comment })
    setSubmitSuccess(false)
    setSubmitError(null)
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setReviewForm({ rating: 5, comment: '' })
    setSubmitError(null)
  }

  // ── Delete own review ─────────────────────────────────────────────────────
  // Needs both the product id and the review's own _id — the backend
  // route is DELETE /reviews?productId=<productId>&id=<reviewId>.
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete your review? This can\'t be undone.')) return

    setDeletingReview(true)
    try {
      await deleteReview(id, reviewId)
      const updated = await getProductReviews(id)
      setReviews(updated)
      setSubmitSuccess(false)
      if (editingReviewId === reviewId) {
        handleCancelEdit()
      }
    } catch (err) {
      alert(err.message || 'Failed to delete review. Please try again.')
    } finally {
      setDeletingReview(false)
    }
  }

  const isLensOrRx = product?.category === 'contact-lenses' || product?.isPrescriptionRequired

  // ── "Same for both eyes" toggle ───────────────────────────────────────────
  // When switching to "same", sync the left eye to whatever the right eye is
  // currently set to, so a value picked while separate doesn't silently
  // survive as a mismatched left-eye value once merged.
  const handleSameEyesChange = (value) => {
    setSameEyes(value)
    if (value) {
      setRxForm((prev) => ({
        rightEye: prev.rightEye,
        leftEye: { sphere: prev.rightEye.sphere },
      }))
    }
  }

  const validateAndBuildPrescription = () => {
    if (!isLensOrRx) return null

    if ( rxMode === 'custom') {
      const right = rxForm.rightEye
      const left = sameEyes ? rxForm.rightEye : rxForm.leftEye

      if (right.sphere === '' || left.sphere === '') {
        setRxError(
          sameEyes
            ? 'Please select your lens power.'
            : 'Please select the power for both eyes.'
        )
        return false
      }

      setRxError('')
      return {
        rightEye: {
          sphere: Number(right.sphere),
          cylinder: null,
          axis: null,
          addPower: null,
        },
        leftEye: {
          sphere: Number(left.sphere),
          cylinder: null,
          axis: null,
          addPower: null,
        },
        notes: product.isPrescriptionRequired ? 'Prescription Lens' : 'Custom Power',
      }
    }

    // Cosmetic / zero-power makeup lens
    setRxError('')
    return {
      rightEye: { sphere: 0, cylinder: null, axis: null, addPower: null },
      leftEye: { sphere: 0, cylinder: null, axis: null, addPower: null },
      notes: 'Plano (0.00) / Cosmetic Makeup Wear',
    }
  }

  const handleAddToCart = async () => {
    const rx = validateAndBuildPrescription()
    if (rx === false) return

    try {
      await addItem(product, 1, rx)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to add to cart.')
    }
  }

  const handleBuyNow = async () => {
    const rx = validateAndBuildPrescription()
    if (rx === false) return

    try {
      await addItem(product, 1, rx)
      navigate('/checkout')
    } catch (err) {
      alert(err.message || 'Failed to process item.')
    }
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
  const hasVariants= Array.isArray(product.variants) && product.variants.length > 0
  const activeVariant = hasVariants ? product.variants[selectedVariantIdx]: null

  const images       = (activeVariant?.images?.length > 0 ? activeVariant.images : product.image) ?? []
  
  const variantDelta = activeVariant?.priceDelta ?? 0
  const basePrice = product.discountPrice ?? product.price
  const sellingPrice = basePrice + variantDelta
  const originalPrice = product.discountPrice ? product.price + variantDelta : null
  const discount = originalPrice && sellingPrice < originalPrice
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : null
  const stockCount = hasVariants ? (activeVariant?.stock ?? 0) : product.stock
  const outOfStock = hasVariants ? stockCount <= 0 : product.isOutOfStock

  const rating      = product.ratings ?? 0
  const reviewCount = product.numOfReviews ?? 0
  const isNew        = product.isNewArrival ?? false
  const isBestseller = product.isBestSeller ?? false

  // Current user's id, for matching against a review's owner (r.user).
  const currentUserId = user?._id ?? user?.id ?? null

  // Watch / eyeglasses / perfume / contact lens specific spec fields
  const specs = product.category === 'watches'
    ? [
        { label: 'Watch Type',       value: product.watchType },
        { label: 'Dial Color',       value: product.dialColor },
        { label: 'Strap Material',   value: product.strapMaterial },
        { label: 'Case Size',        value: product.caseSize },
        { label: 'Movement',         value: product.movementType },
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
    : product.category === 'contact-lenses'
    ? [
        { label: 'Base Curve (BC)',        value: product.baseCurve },
        { label: 'Diameter (DIA)',         value: product.diameter },
        { label: 'Water Content',          value: product.waterContent },
        { label: 'Replacement Schedule',   value: product.replacementSchedule },
        { label: 'Pack Size',              value: product.packSize },
        { label: 'Lens Type',              value: product.lensType },
        { label: 'Prescription Status',    value: 'Power Optional — Plano (0.00) or Custom Prescription' },
      ]
    : []

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '12px var(--section-px)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: 'var(--color-muted)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
      className="hide-scrollbar"
      >
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
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px) var(--section-px)',
          gap: 'clamp(24px, 4vw, 64px)',
          alignItems: 'start',
        }}
      >

        {/* ── Left: Image gallery ──────────────────────────────────────────── */}
        <div>
          <ProductImageGallery 
            images={images} 
            productName={product.name}
            badges={
              <div style={{ display: 'flex', gap: '6px' }}>
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
            }
          />
          {/* Main image */}
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '1 / 1',
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
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }} className="hide-scrollbar">
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
            fontSize: 'var(--text-3xl)',
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: '700', color: 'var(--color-navy)' }}>
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

          {/* ── Prescription / Power Selection (for Contact Lenses & Prescription Products) ── */}
          {isLensOrRx && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  
                  <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: 'var(--color-navy)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}>
                    Lens Power & Prescription
                  </h3>
                </div>
                {product.isPrescriptionRequired ? (
                  <span style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #fecaca',
                  }}>
                    Power Optional
                  </span>
                ) : (
                  <span style={{
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #bbf7d0',
                  }}>
                    Zero Power / Cosmetic Ready
                  </span>
                )}
              </div>

              {/* Power mode selector: Plano is the default; Custom Power is optional. */}
              
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => { setRxMode('plano'); setRxError('') }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${rxMode === 'plano' ? 'var(--color-navy)' : 'var(--color-border)'}`,
                      backgroundColor: rxMode === 'plano' ? 'var(--color-navy)' : '#f8fafc',
                      color: rxMode === 'plano' ? 'var(--color-taupe)' : '#334155',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                     Plano (Zero Power / Makeup)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRxMode('custom'); setRxError('') }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${rxMode === 'custom' ? 'var(--color-navy)' : 'var(--color-border)'}`,
                      backgroundColor: rxMode === 'custom' ? 'var(--color-navy)' : '#f8fafc',
                      color: rxMode === 'custom' ? 'var(--color-taupe)' : '#334155',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                   Custom Power Prescription
                  </button>
                </div>
              

              {/* Power Selection Form — only shown when the customer chooses Custom Power */}
              {rxMode === 'custom' && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '4px' }}>
                    Prescription Power
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '16px' }}>
                    Select the lens power recommended by your eye care professional.
                  </p>

                  {/* Same for both eyes toggle */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '8px' }}>
                      Same power for both eyes?
                    </p>
                    <div style={{ display: 'flex', gap: '18px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sameEyes"
                          checked={sameEyes === true}
                          onChange={() => handleSameEyesChange(true)}
                        />
                        Yes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sameEyes"
                          checked={sameEyes === false}
                          onChange={() => handleSameEyesChange(false)}
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {sameEyes ? (
                    /* One shared power field */
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '6px' }}>
                        Lens power
                      </label>
                      <select
                        value={rxForm.rightEye.sphere}
                        onChange={(e) => {
                          const val = e.target.value
                          setRxForm({ rightEye: { sphere: val }, leftEye: { sphere: val } })
                        }}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="">Select power</option>
                        {SPHERE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    /* Separate left / right power fields */
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '6px' }}>
                          Power of your left eye
                        </label>
                        <select
                          value={rxForm.leftEye.sphere}
                          onChange={(e) => setRxForm(prev => ({ ...prev, leftEye: { sphere: e.target.value } }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        >
                          <option value="">Select power</option>
                          {SPHERE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '6px' }}>
                          Power of your right eye
                        </label>
                        <select
                          value={rxForm.rightEye.sphere}
                          onChange={(e) => setRxForm(prev => ({ ...prev, rightEye: { sphere: e.target.value } }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        >
                          <option value="">Select power</option>
                          {SPHERE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Prescription Validation Error */}
              {rxError && (
                <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: '500' }}>
                  ⚠️ {rxError}
                </div>
              )}
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
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
              disabled={product.isOutOfStock}
              onClick={handleBuyNow}
              style={{
                flex: 1,
                padding: '14px 24px',
                backgroundColor: product.isOutOfStock ? '#e5e7eb' : 'var(--color-taupe)',
                color: product.isOutOfStock ? '#9ca3af' : 'var(--color-navy)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: product.isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => { if (!product.isOutOfStock) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Buy Now
            </button>

            <button
              onClick={async () => {
                if (!user) { navigate('/login'); return }
                await toggleWishlist(product)
              }}
              aria-label="Add to wishlist"
              style={{
                width: '50px',
                height: '50px',
                minWidth: '50px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: isWishlisted(product?._id ?? product?.id) ? '#fff1f2' : 'var(--color-white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"
                fill={isWishlisted(product?._id ?? product?.id) ? '#e74c3c' : 'none'}
                stroke={isWishlisted(product?._id ?? product?.id) ? '#e74c3c' : '#555'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            {hasVariants && (
  <div style={{ marginTop: '20px' }}>
    <h3 style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '10px' }}>
      Color: <span style={{ color: 'var(--color-navy)', textTransform: 'none', letterSpacing: 'normal' }}>{activeVariant?.color}</span>
    </h3>
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {product.variants.map((v, i) => (
        <button
          key={v._id ?? i}
          onClick={() => setSelectedVariantIdx(i)}
          style={{
            width: '76px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: i === selectedVariantIdx ? '2px solid var(--color-navy)' : '2px solid var(--color-border)',
            padding: 0,
            cursor: 'pointer',
            backgroundColor: '#f3f4f6',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '100%', height: '76px', backgroundColor: '#f3f4f6' }}>
            {v.images?.[0]?.url && (
              <img src={v.images[0].url} alt={v.color}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', display: 'block', padding: '4px 2px' }}>
            {v.color}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
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
        padding: '0 var(--section-px) clamp(24px, 4vw, 48px)',
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

          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 'clamp(24px, 3vw, 48px)', alignItems: 'start' }}
          >

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
                  {reviews.map((r) => {
                    // r.user may come back as a plain ID string or a
                    // populated object with _id — handle both.
                    const reviewOwnerId = r.user?._id ?? r.user ?? null
                    const isOwnReview =
                      currentUserId != null &&
                      reviewOwnerId != null &&
                      String(reviewOwnerId) === String(currentUserId)

                    return (
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                            {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>

                          {isOwnReview && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {/* Edit */}
                              <button
                                onClick={() => handleEditReview(r)}
                                aria-label="Edit review"
                                title="Edit review"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--color-muted)',
                                  transition: 'background-color 0.15s ease, color 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-sbg)'
                                  e.currentTarget.style.color = 'var(--color-navy)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = 'var(--color-muted)'
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteReview(r._id)}
                                disabled={deletingReview}
                                aria-label="Delete review"
                                title="Delete review"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: deletingReview ? 'not-allowed' : 'pointer',
                                  padding: '4px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: deletingReview ? '#d1a3a3' : 'var(--color-error)',
                                  transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!deletingReview) e.currentTarget.style.backgroundColor = '#fef2f2'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
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
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Right: write a review ────── */}
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              padding: 'clamp(20px, 3vw, 28px)',
            }}
            className="md:sticky md:top-88px"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  fontWeight: '700',
                  color: 'var(--color-navy)',
                  margin: 0,
                }}>
                  {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
                </h3>

                {editingReviewId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-muted)',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {submitSuccess && (
                <div style={{
                  padding: '12px 16px', borderRadius: '8px',
                  backgroundColor: '#dcfce7', color: '#15803d',
                  fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px',
                }}>
                  ✓ Review {lastSubmitWasEdit ? 'updated' : 'submitted'} successfully!
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '8px 8px 8px 8px',
                    backgroundColor: 'var(--color-white)',
                  }}>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-sbg)',
                        color: 'var(--color-navy)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Choose Files
                    </button>

                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-muted)',
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {reviewImages.length > 0
                        ? reviewImages.map((f) => f.name).join(', ')
                        : 'No file chosen'}
                    </span>

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '8px 8px 8px 8px',
                    backgroundColor: 'var(--color-white)',
                  }}>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-sbg)',
                        color: 'var(--color-navy)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Choose File
                    </button>

                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-muted)',
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {reviewVideos.length > 0
                        ? reviewVideos[0].name
                        : 'No file chosen'}
                    </span>

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      style={{ display: 'none' }}
                    />
                  </div>
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
                  {submitting
                    ? (editingReviewId ? 'Updating…' : 'Submitting…')
                    : (editingReviewId ? 'Update Review' : 'Submit Review')}
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
        padding: '0 var(--section-px) clamp(32px, 5vw, 64px)',
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