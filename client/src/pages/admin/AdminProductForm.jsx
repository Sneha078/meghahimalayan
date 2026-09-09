
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getAdminProducts, createProduct, updateProduct } from '../../api/adminClient'

const EMPTY_FORM = {
  name: '', description: '', category: 'eyeglasses', brand: '',
  subcategory: '', gender: 'Unisex', price: '', discountPrice: '',
  stock: '', isFeatured: false, isBestSeller: false, isNewArrival: false,
 
  frameShape: '', frameMaterial: '', frameColor: '', lensType: '',
 
  watchType: '', dialColor: '', strapMaterial: '', caseSize: '',
  movementType: '', waterResistance: '',
 
  fragranceFamily: '', fragranceType: '', volume: '',
  pointsCost: 0,
}

function Field({ label, name, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', fontSize: '0.78rem', fontWeight: '600',
        color: '#475569', marginBottom: '6px',
      }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <input
        type={type} name={name} value={value}
        onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 14px', borderRadius: '8px',
          border: '1px solid #e2e8f0', fontSize: '0.88rem',
          color: '#0f172a', outline: 'none', backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function Toggle({ label, name, checked, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      cursor: 'pointer', marginBottom: '12px',
    }}>
      <input
        type="checkbox" name={name} checked={checked}
        onChange={onChange}
        style={{ accentColor: 'var(--color-navy)', width: '16px', height: '16px' }}
      />
      <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: '500' }}>{label}</span>
    </label>
  )
}

function AdminProductForm() {
  const { id } = useParams()        
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm]         = useState(EMPTY_FORM)
  const [images, setImages]     = useState([])   
  const [previews, setPreviews] = useState([])  
  const [existingImages, setExistingImages] = useState([])  
  const [loading, setLoading]   = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState(null)

  
  useEffect(() => {
    if (!isEdit) return
    getAdminProducts()
      .then((data) => {
        const product = (data.products ?? []).find((p) => p._id === id)
        if (!product) { setError('Product not found'); return }
        setForm({
          name:   product.name ?? '',
          description:  product.description ?? '',
          category:  product.category ?? 'eyeglasses',
          brand:  product.brand ?? '',
          subcategory:  product.subcategory ?? '',
          gender:  product.gender ?? 'Unisex',
          price:  product.price ?? '',
          discountPrice:  product.discountPrice ?? '',
          stock: product.stock ?? '',
          isFeatured: product.isFeatured ?? false,
          isBestSeller:  product.isBestSeller ?? false,
          isNewArrival:  product.isNewArrival ?? false,
          frameShape:  product.frameShape ?? '',
          frameMaterial: product.frameMaterial ?? '',
          frameColor:  product.frameColor ?? '',
          lensType: product.lensType ?? '',
          watchType:  product.watchType ?? '',
          dialColor:  product.dialColor ?? '',
          strapMaterial: product.strapMaterial ?? '',
          caseSize: product.caseSize ?? '',
          movementType:  product.movementType ?? '',
          waterResistance: product.waterResistance ?? '',
          fragranceFamily: product.fragranceFamily ?? '',
          fragranceType:  product.fragranceType ?? '',
          volume:  product.volume ?? '',
          pointsCost: product.pointsCost ?? 0,
        })
        setExistingImages(product.image ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleImages = (e) => {
    const files = [...e.target.files]
    setImages(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const toBase64 = (file) => new Promise((res, rej) => {
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
      
      const imageBase64 = await Promise.all(images.map(toBase64))

      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stock:  Number(form.stock),
        pointsCost:Number(form.pointsCost),
        ...(imageBase64.length > 0 && { images: imageBase64 }),
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

  if (loading) return <div style={{ padding: '32px', color: '#64748b' }}>Loading product…</div>

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>

    
      <Link to="/admin/products" style={{
        fontSize: '0.85rem', color: '#64748b',
        textDecoration: 'none', display: 'inline-block', marginBottom: '20px',
      }}>
        ← Back to Products
      </Link>

      <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '28px' }}>
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: '0.88rem', marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

      
        <Section title="Basic Information">
          <Field label="Product Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Ray-Ban Aviator Classic" />
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Product description…" rows={4}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '0.88rem',
                color: '#0f172a', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Category <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select name="category" value={form.category} onChange={handleChange}
                style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="eyeglasses">Eyeglasses</option>
                <option value="watches">Watches</option>
                <option value="perfumes">Perfumes</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Gender
              </label>
              <select name="gender" value={form.gender} onChange={handleChange}
                style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              >
                {['Men', 'Women', 'Kids', 'Unisex'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Brand" name="brand" value={form.brand} onChange={handleChange} required placeholder="e.g. Ray-Ban" />
            <Field label="Subcategory" name="subcategory" value={form.subcategory} onChange={handleChange} placeholder="e.g. Sunglasses" />
          </div>
        </Section>

      
        <Section title="Pricing & Stock">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Field label="Price (Rs.)" name="price" value={form.price} onChange={handleChange} type="number" required placeholder="5000" />
            <Field label="Discount Price (Rs.)" name="discountPrice" value={form.discountPrice} onChange={handleChange} type="number" placeholder="Leave blank if none" />
            <Field label="Stock" name="stock" value={form.stock} onChange={handleChange} type="number" required placeholder="10" />
          </div>
          <Field label="Points Cost (Rewards)" name="pointsCost" value={form.pointsCost} onChange={handleChange} type="number" placeholder="0" />
        </Section>

       
        <Section title="Badges & Visibility">
          <Toggle label="Featured" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
          <Toggle label="Best Seller" name="isBestSeller" checked={form.isBestSeller} onChange={handleChange} />
          <Toggle label="New Arrival" name="isNewArrival" checked={form.isNewArrival} onChange={handleChange} />
        </Section>

        
        {form.category === 'eyeglasses' && (
          <Section title="Eyeglasses Specifications">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Frame Shape" name="frameShape" value={form.frameShape} onChange={handleChange} placeholder="e.g. Aviator" />
              <Field label="Frame Material" name="frameMaterial" value={form.frameMaterial} onChange={handleChange} placeholder="e.g. Metal" />
              <Field label="Frame Color" name="frameColor" value={form.frameColor} onChange={handleChange} placeholder="e.g. Gold" />
              <Field label="Lens Type" name="lensType" value={form.lensType} onChange={handleChange} placeholder="e.g. Polarized" />
            </div>
          </Section>
        )}

        {form.category === 'watches' && (
          <Section title="Watch Specifications">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Watch Type" name="watchType" value={form.watchType} onChange={handleChange} placeholder="e.g. Analog" />
              <Field label="Dial Color" name="dialColor" value={form.dialColor} onChange={handleChange} placeholder="e.g. Black" />
              <Field label="Strap Material" name="strapMaterial" value={form.strapMaterial} onChange={handleChange} placeholder="e.g. Leather" />
              <Field label="Case Size" name="caseSize" value={form.caseSize} onChange={handleChange} placeholder="e.g. 42mm" />
              <Field label="Movement Type" name="movementType" value={form.movementType} onChange={handleChange} placeholder="e.g. Quartz" />
              <Field label="Water Resistance" name="waterResistance" value={form.waterResistance} onChange={handleChange} placeholder="e.g. 50m" />
            </div>
          </Section>
        )}

        {form.category === 'perfumes' && (
          <Section title="Perfume Specifications">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
              <Field label="Fragrance Family" name="fragranceFamily" value={form.fragranceFamily} onChange={handleChange} placeholder="e.g. Floral" />
              <Field label="Fragrance Type" name="fragranceType" value={form.fragranceType} onChange={handleChange} placeholder="e.g. EDP" />
              <Field label="Volume" name="volume" value={form.volume} onChange={handleChange} placeholder="e.g. 100ml" />
            </div>
          </Section>
        )}

      
        <Section title="Product Images">
          {/* Existing images */}
          {existingImages.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {existingImages.map((img) => (
                <img
                  key={img.public_id}
                  src={img.url} alt="Product"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              ))}
            </div>
          )}
          <input type="file" accept="image/*" multiple onChange={handleImages}
            style={{ fontSize: '0.85rem', color: '#64748b' }}
          />
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
              {previews.map((url, i) => (
                <img key={i} src={url} alt="Preview"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #2563eb' }}
                />
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
            {isEdit ? 'Uploading new images will replace existing ones.' : 'Select up to 5 images.'}
          </p>
        </Section>

      
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '11px 32px', borderRadius: '8px',
              backgroundColor: submitting ? '#e2e8f0' : 'var(--color-navy)',
              color: submitting ? '#94a3b8' : '#ffffff',
              border: 'none', fontSize: '0.88rem', fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <Link to="/admin/products" style={{
            padding: '11px 24px', borderRadius: '8px',
            border: '1px solid #e2e8f0', backgroundColor: '#ffffff',
            color: '#64748b', textDecoration: 'none',
            fontSize: '0.88rem', fontWeight: '600',
          }}>
            Cancel
          </Link>
        </div>

      </form>
    </div>
  )
}


function Section({ title, children }) {
  return (
    <div style={{
      backgroundColor: '#ffffff', borderRadius: '12px',
      border: '1px solid #e2e8f0', padding: '24px',
      marginBottom: '20px',
    }}>
      <h2 style={{
        fontSize: '0.88rem', fontWeight: '700', color: '#0f172a',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '20px', paddingBottom: '12px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default AdminProductForm
