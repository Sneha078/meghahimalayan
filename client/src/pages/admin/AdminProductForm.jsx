import { useState, useEffect, useRef} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

import {
  getAdminProducts,
  createProduct,
  updateProduct,
} from '../../api/adminClient'

const EMPTY_VARIANT = {
  color: '',
  colorHex: '',
  stock: '',
  sku: '',
  priceDelta: '',
  images: [],
  previews: [],
  existingImages: [],
}

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'eyeglasses',
  brand: '',
  subcategory: '',
  gender: 'Unisex',
  color: '',
  price: '',
  discountPrice: '',
  stock: '',
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,

  frameShape: '',
  frameMaterial: '',
  frameColor: '',
  lensType: '',

  watchType: '',
  dialColor: '',
  strapMaterial: '',
  caseSize: '',
  movementType: '',
  waterResistance: '',

  fragranceFamily: '',
  fragranceType: '',
  volume: '',

  // Contact Lenses
  baseCurve: '',
  diameter: '',
  waterContent: '',
  replacementSchedule: '',
  packSize: '',
  isPrescriptionRequired: false,

  pointsCost: 0,
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '0.78rem',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '6px',
        }}
      >
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 14px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '0.88rem',
          color: '#0f172a',
          outline: 'none',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function Toggle({ label, name, checked, onChange }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        marginBottom: '12px',
      }}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        style={{
          accentColor: 'var(--color-navy)',
          width: '16px',
          height: '16px',
        }}
      />

      <span
        style={{
          fontSize: '0.88rem',
          color: '#475569',
          fontWeight: '500',
        }}
      >
        {label}
      </span>
    </label>
  )
}

function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [variants, setVariants] = useState([])

  useEffect(() => {
    if (!isEdit) return

    getAdminProducts()
      .then((data) => {
        const product = (data.products ?? []).find(
          (p) => p._id === id
        )

        if (!product) {
          setError('Product not found')
          return
        }

        setForm({
          name: product.name ?? '',
          description: product.description ?? '',
          category: product.category ?? 'eyeglasses',
          brand: product.brand ?? '',
          subcategory: product.subcategory ?? '',
          gender: product.gender ?? 'Unisex',
          color: product.color ?? '',
          price: product.price ?? '',
          discountPrice: product.discountPrice ?? '',
          stock: product.stock ?? '',

          isFeatured: product.isFeatured ?? false,
          isBestSeller: product.isBestSeller ?? false,
          isNewArrival: product.isNewArrival ?? false,

          frameShape: product.frameShape ?? '',
          frameMaterial: product.frameMaterial ?? '',
          frameColor: product.frameColor ?? '',
          lensType: product.lensType ?? '',

          watchType: product.watchType ?? '',
          dialColor: product.dialColor ?? '',
          strapMaterial: product.strapMaterial ?? '',
          caseSize: product.caseSize ?? '',
          movementType: product.movementType ?? '',
          waterResistance: product.waterResistance ?? '',

          fragranceFamily: product.fragranceFamily ?? '',
          fragranceType: product.fragranceType ?? '',
          volume: product.volume ?? '',

          baseCurve: product.baseCurve ?? '',
          diameter: product.diameter ?? '',
          waterContent: product.waterContent ?? '',
          replacementSchedule: product.replacementSchedule ?? '',
          packSize: product.packSize ?? '',
          isPrescriptionRequired:
            product.isPrescriptionRequired ?? false,

          pointsCost: product.pointsCost ?? 0,
        })

        setExistingImages(product.image ?? [])

        // IMPORTANT:
        // product is in scope here because this code is
        // inside the .then() callback.
        setVariants(
          (product.variants ?? []).map((v) => ({
            _id: v._id,
            color: v.color ?? '',
            colorHex: v.colorHex ?? '',
            stock: v.stock ?? '',
            sku: v.sku ?? '',
            priceDelta: v.priceDelta ?? '',
            images: [],
            previews: [],
            existingImages: v.images ?? [],
          }))
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleImages = (e) => {
  const newFiles = [...e.target.files]
  const newPreviews = newFiles.map((f) => URL.createObjectURL(f))

  // Append rather than replace, so a second "Choose Files" click adds to
  // what's already selected instead of discarding it.
  setImages((prev) => [...prev, ...newFiles])
  setPreviews((prev) => [...prev, ...newPreviews])

  // Reset the input so selecting the same file again still fires onChange
  e.target.value = ''
}

const removeNewImage = (index) => {
  setImages((prev) => prev.filter((_, i) => i !== index))
  setPreviews((prev) => prev.filter((_, i) => i !== index))
}

const removeExistingImage = (publicId) => {
  setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId))
}

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        ...EMPTY_VARIANT,
        images: [],
        previews: [],
        existingImages: [],
      },
    ])
  }

  const removeVariant = (index) => {
    setVariants((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }

  const updateVariantField = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? {
              ...v,
              [field]: value,
            }
          : v
      )
    )
  }

  const handleVariantImages = (index, files) => {
    const arr = [...files]
    const previews = arr.map((f) => URL.createObjectURL(f))

    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? {
              ...v,
              images: [...(v.images || []), ...arr], // Ensure we append to existing images
              previews: [...(v.previews || []), ...previews], // Ensure we append to existing previews
            }
          : v
      )
    )
  }

  const removeVariantNewImage = (variantIndex, imageIndex) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              images: v.images.filter((_, idx) => idx !== imageIndex),
              previews: v.previews.filter((_, idx) => idx !== imageIndex),
            }
          : v
      )
    )
  }

  const removeVariantExistingImage = (variantIndex, publicId) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              existingImages: v.existingImages.filter(
                (img) => img.public_id !== publicId
              ),
            }
          : v
      )
    )
  }

  const toBase64 = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader()

      reader.onload = () => res(reader.result)
      reader.onerror = rej

      reader.readAsDataURL(file)
    })

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSubmitting(true)
    setError(null)

    try {
      const imageBase64 = await Promise.all(
        images.map(toBase64)
      )

      const variantsPayload = await Promise.all(
        variants.map(async (v) => ({
          _id: v._id, // Include the variant ID for updates
          color: v.color,
          colorHex: v.colorHex,
          stock: Number(v.stock) || 0,
          sku: v.sku,
          priceDelta: Number(v.priceDelta) || 0,
          images: await Promise.all(
            v.images.map(toBase64)
          ),
          existingImages: v.existingImages, // Keep track of existing variant images
        }))
      )

      const payload = {
        ...form,

        price: Number(form.price),

        discountPrice: form.discountPrice
          ? Number(form.discountPrice)
          : null,

        stock: Number(form.stock),

        pointsCost: Number(form.pointsCost),

        image: imageBase64,           // new photos to add (may be empty)
        ...(isEdit && { existingImages }), // only send existingImages when editing
        ...(variantsPayload.length > 0 && { variants: variantsPayload }),
      }

      if (isEdit) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }

      navigate('/admin/products')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: '32px',
          color: '#64748b',
        }}
      >
        Loading product…
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '800px',
      }}
    >
      <Link
        to="/admin/products"
        style={{
          fontSize: '0.85rem',
          color: '#64748b',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '20px',
        }}
      >
        ← Back to Products
      </Link>

      <h1
        style={{
          fontSize: '1.6rem',
          fontWeight: '800',
          color: '#0f172a',
          marginBottom: '28px',
        }}
      >
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>

      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.88rem',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Section title="Basic Information">
          <Field
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Ray-Ban Aviator Classic"
          />

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              Description{' '}
              <span style={{ color: '#dc2626' }}>*</span>
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Product description…"
              rows={4}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.88rem',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Category{' '}
                <span style={{ color: '#dc2626' }}>*</span>
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="eyeglasses">
                  Eyeglasses
                </option>
                <option value="watches">Watches</option>
                <option value="perfumes">Perfumes</option>
                <option value="contact-lenses">
                  Contact Lenses
                </option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Gender
              </label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {['Men', 'Women', 'Kids', 'Unisex'].map(
                  (g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  )
                )}
              </select>
            </div>

            <Field
              label="Color"
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="e.g. Clear, Blue, Natural"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0 16px',
            }}
          >
            <Field
              label="Brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              required
              placeholder="e.g. Ray-Ban"
            />

            <Field
              label="Subcategory"
              name="subcategory"
              value={form.subcategory}
              onChange={handleChange}
              placeholder="e.g. Sunglasses"
            />
          </div>
        </Section>

        <Section title="Pricing & Stock">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0 16px',
            }}
          >
            <Field
              label="Price (Rs.)"
              name="price"
              value={form.price}
              onChange={handleChange}
              type="number"
              required
              placeholder="5000"
            />

            <Field
              label="Discount Price (Rs.)"
              name="discountPrice"
              value={form.discountPrice}
              onChange={handleChange}
              type="number"
              placeholder="Leave blank if none"
            />

            <Field
              label="Stock"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              type="number"
              required
              placeholder="10"
            />
          </div>

          <Field
            label="Points Cost (Rewards)"
            name="pointsCost"
            value={form.pointsCost}
            onChange={handleChange}
            type="number"
            placeholder="0"
          />
        </Section>

        <Section title="Badges & Visibility">
          <Toggle
            label="Featured"
            name="isFeatured"
            checked={form.isFeatured}
            onChange={handleChange}
          />

          <Toggle
            label="Best Seller"
            name="isBestSeller"
            checked={form.isBestSeller}
            onChange={handleChange}
          />

          <Toggle
            label="New Arrival"
            name="isNewArrival"
            checked={form.isNewArrival}
            onChange={handleChange}
          />
        </Section>

        {form.category === 'eyeglasses' && (
          <Section title="Eyeglasses Specifications">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0 16px',
              }}
            >
              <Field
                label="Frame Shape"
                name="frameShape"
                value={form.frameShape}
                onChange={handleChange}
                placeholder="e.g. Aviator"
              />

              <Field
                label="Frame Material"
                name="frameMaterial"
                value={form.frameMaterial}
                onChange={handleChange}
                placeholder="e.g. Metal"
              />

              <Field
                label="Frame Color"
                name="frameColor"
                value={form.frameColor}
                onChange={handleChange}
                placeholder="e.g. Gold"
              />

              <Field
                label="Lens Type"
                name="lensType"
                value={form.lensType}
                onChange={handleChange}
                placeholder="e.g. Polarized"
              />
            </div>
          </Section>
        )}

        {form.category === 'watches' && (
          <Section title="Watch Specifications">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0 16px',
              }}
            >
              <Field
                label="Watch Type"
                name="watchType"
                value={form.watchType}
                onChange={handleChange}
                placeholder="e.g. Analog"
              />

              <Field
                label="Dial Color"
                name="dialColor"
                value={form.dialColor}
                onChange={handleChange}
                placeholder="e.g. Black"
              />

              <Field
                label="Strap Material"
                name="strapMaterial"
                value={form.strapMaterial}
                onChange={handleChange}
                placeholder="e.g. Leather"
              />

              <Field
                label="Case Size"
                name="caseSize"
                value={form.caseSize}
                onChange={handleChange}
                placeholder="e.g. 42mm"
              />

              <Field
                label="Movement Type"
                name="movementType"
                value={form.movementType}
                onChange={handleChange}
                placeholder="e.g. Quartz"
              />

              <Field
                label="Water Resistance"
                name="waterResistance"
                value={form.waterResistance}
                onChange={handleChange}
                placeholder="e.g. 50m"
              />
            </div>
          </Section>
        )}

        {form.category === 'perfumes' && (
          <Section title="Perfume Specifications">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0 16px',
              }}
            >
              <Field
                label="Fragrance Family"
                name="fragranceFamily"
                value={form.fragranceFamily}
                onChange={handleChange}
                placeholder="e.g. Floral"
              />

              <Field
                label="Fragrance Type"
                name="fragranceType"
                value={form.fragranceType}
                onChange={handleChange}
                placeholder="e.g. EDP"
              />

              <Field
                label="Volume"
                name="volume"
                value={form.volume}
                onChange={handleChange}
                placeholder="e.g. 100ml"
              />
            </div>
          </Section>
        )}

        {form.category === 'contact-lenses' && (
          <Section title="Contact Lens Specifications">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0 16px',
              }}
            >
              <Field
                label="Base Curve (BC)"
                name="baseCurve"
                value={form.baseCurve}
                onChange={handleChange}
                placeholder="e.g. 8.5mm"
              />

              <Field
                label="Diameter (DIA)"
                name="diameter"
                value={form.diameter}
                onChange={handleChange}
                placeholder="e.g. 14.3mm"
              />

              <Field
                label="Water Content"
                name="waterContent"
                value={form.waterContent}
                onChange={handleChange}
                placeholder="e.g. 38%"
              />

              <Field
                label="Replacement Schedule"
                name="replacementSchedule"
                value={form.replacementSchedule}
                onChange={handleChange}
                placeholder="e.g. Daily, Weekly, Monthly"
              />

              <Field
                label="Pack Size"
                name="packSize"
                value={form.packSize}
                onChange={handleChange}
                placeholder="e.g. 30 lenses"
              />

              <Field
                label="Lens Type"
                name="lensType"
                value={form.lensType}
                onChange={handleChange}
                placeholder="e.g. Soft Contact Lens"
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <Toggle
                label="Prescription Required"
                name="isPrescriptionRequired"
                checked={form.isPrescriptionRequired}
                onChange={handleChange}
              />

              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginTop: '4px',
                }}
              >
                Enable this for prescription contact lenses.
                Disable for cosmetic/makeup lenses that can be
                worn with zero power.
              </p>
            </div>

            {/* Subcategory Quick Picks for Contact Lenses */}
            <div style={{ marginTop: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '8px',
                }}
              >
                Quick Subcategory Selection
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px',
                }}
              >
                {[
                  'Daily Disposable',
                  'Bi-Weekly Disposable',
                  'Monthly Disposable',
                  'Cosmetic & Makeup',
                  'Color Contact Lenses',
                  'Toric Contact Lenses',
                ].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        subcategory: sub,
                      }))
                    }
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor:
                        form.subcategory === sub
                          ? '#f1f5f9'
                          : '#ffffff',
                      color:
                        form.subcategory === sub
                          ? '#1e293b'
                          : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </Section>
        )}

        <Section title="Product Images">
  {existingImages.length > 0 && (
    <>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>
        Current photos — click × to remove one.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {existingImages.map((img) => (
          <div key={img.public_id} style={{ position: 'relative' }}>
            <img
              src={img.url} alt="Product"
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <button
              type="button"
              onClick={() => removeExistingImage(img.public_id)}
              aria-label="Remove image"
              style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: '#dc2626', color: '#fff', border: 'none',
                fontSize: '0.7rem', lineHeight: 1, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  )}

  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', border: '1px solid #e2e8f0', borderRadius: '8px',
    padding: '8px', backgroundColor: '#ffffff',
  }}>
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      style={{
        padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.8rem',
        fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      Choose Files
    </button>

    <span style={{
      fontSize: '0.8rem', color: '#64748b', textAlign: 'right',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {images.length > 0 ? images.map((f) => f.name).join(', ') : 'No file chosen'}
    </span>

    <input
      ref={fileInputRef}
      type="file" accept="image/*" multiple
      onChange={handleImages}
      style={{ display: 'none' }}
    />
  </div>

  {previews.length > 0 && (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
      {previews.map((url, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <img src={url} alt="Preview"
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #2563eb' }}
          />
          <button
            type="button"
            onClick={() => removeNewImage(i)}
            aria-label="Remove image"
            style={{
              position: 'absolute', top: '-6px', right: '-6px',
              width: '20px', height: '20px', borderRadius: '50%',
              backgroundColor: '#dc2626', color: '#fff', border: 'none',
              fontSize: '0.7rem', lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}

  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
    New photos are added alongside your current ones - nothing is replaced unless you remove it above.
  </p>
</Section>

        <Section title="Color Variants (optional)">
          <p
            style={{
              fontSize: '0.78rem',
              color: '#64748b',
              marginBottom: '16px',
            }}
          >
            Add a variant per color with its own photos and
            stock. Leave empty if this product doesn't come in
            multiple colors.
          </p>

          {variants.map((v, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '14px',
                backgroundColor: '#f8fafc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#0f172a',
                  }}
                >
                  Variant {i + 1}
                </span>

                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <input
                  placeholder="Color name (e.g. Pink)"
                  value={v.color}
                  onChange={(e) =>
                    updateVariantField(
                      i,
                      'color',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

                <input
                  type="color"
                  value={v.colorHex || '#000000'}
                  onChange={(e) =>
                    updateVariantField(
                      i,
                      'colorHex',
                      e.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    padding: '2px',
                    cursor: 'pointer',
                  }}
                />

                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) =>
                    updateVariantField(
                      i,
                      'stock',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

                <input
                  type="number"
                  placeholder="Price delta"
                  value={v.priceDelta}
                  onChange={(e) =>
                    updateVariantField(
                      i,
                      'priceDelta',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <input
                placeholder="SKU (optional)"
                value={v.sku}
                onChange={(e) =>
                  updateVariantField(
                    i,
                    'sku',
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  width: '100%',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />

              {v.existingImages.length > 0 && (
                <>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Current variant photos — click × to remove one:
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '10px',
                    }}
                  >
                    {v.existingImages.map((img) => (
                      <div key={img.public_id} style={{ position: 'relative' }}>
                        <img
                          src={img.url}
                          alt={v.color}
                          style={{
                            width: '56px',
                            height: '56px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantExistingImage(i, img.public_id)}
                          aria-label="Remove image"
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.65rem',
                            lineHeight: 1,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  handleVariantImages(
                    i,
                    e.target.files
                  )
                }
                style={{
                  fontSize: '0.8rem',
                }}
              />

              {v.previews.length > 0 && (
                <>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px', marginBottom: '8px' }}>
                    New photos to add:
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginTop: '10px',
                    }}
                  >
                    {v.previews.map((src, pi) => (
                      <div key={pi} style={{ position: 'relative' }}>
                        <img
                          src={src}
                          alt="preview"
                          style={{
                            width: '56px',
                            height: '56px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '2px solid #2563eb',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantNewImage(i, pi)}
                          aria-label="Remove image"
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.65rem',
                            lineHeight: 1,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addVariant}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px dashed #94a3b8',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Add Color Variant
          </button>
        </Section>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '11px 32px',
              borderRadius: '8px',
              backgroundColor: submitting
                ? '#e2e8f0'
                : 'var(--color-navy)',
              color: submitting
                ? '#94a3b8'
                : '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: submitting
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            {submitting
              ? 'Saving…'
              : isEdit
                ? 'Save Changes'
                : 'Create Product'}
          </button>

          <Link
            to="/admin/products"
            style={{
              padding: '11px 24px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: '600',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: '20px',
      }}
    >
      <h2
        style={{
          fontSize: '0.88rem',
          fontWeight: '700',
          color: '#0f172a',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  )
}

const inputStyle = {
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const inputStyle = {
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
}

export default AdminProductForm