
import { useState, useEffect } from 'react'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/adminClient'

const EMPTY_FORM = {
  code: '', description: '', type: 'percentage',
  value: '', minOrder: '', maxDiscount: '',
  usageLimit: '', expiresAt: '', isActive: true,
}

function AdminCoupons() {
  const [coupons, setCoupons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = () => {
    setLoading(true)
    getCoupons()
      .then((data) => setCoupons(data.coupons ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (coupon) => {
    setForm({
      code:  coupon.code ?? '',
      description:coupon.description ?? '',
      type: coupon.type ?? 'percentage',
      value: coupon.value ?? '',
      minOrder: coupon.minOrder ?? '',
      maxDiscount:coupon.maxDiscount ?? '',
      usageLimit:coupon.usageLimit ?? '',
      expiresAt:coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      isActive: coupon.isActive ?? true,
    })
    setEditId(coupon._id)
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        value:  Number(form.value),
        minOrder: form.minOrder    ? Number(form.minOrder)    : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit  ? Number(form.usageLimit)  : null,
        expiresAt:   form.expiresAt   ? new Date(form.expiresAt) : null,
      }
      if (editId) {
        await updateCoupon(editId, payload)
      } else {
        await createCoupon(payload)
      }
      setShowForm(false)
      fetchCoupons()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return
    setDeleting(id)
    try {
      await deleteCoupon(id)
      setCoupons((prev) => prev.filter((c) => c._id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ padding: '32px' }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
            Coupons
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>{coupons.length} coupons</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px', borderRadius: '8px',
            backgroundColor: 'var(--color-navy)', color: '#ffffff',
            border: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
          }}
        >
          + New Coupon
        </button>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px', backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.88rem', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

     
      {showForm && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
            {editId ? 'Edit Coupon' : 'New Coupon'}
          </h2>

          {formError && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2',
              border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px',
            }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>

              <div>
                <label style={labelStyle}>Code</label>
                <input name="code" value={form.code} onChange={handleChange} placeholder="SAVE20" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Type</label>
                <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (Rs.)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Value</label>
                <input name="value" type="number" value={form.value} onChange={handleChange} placeholder={form.type === 'percentage' ? '10' : '200'} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Min Order (Rs.)</label>
                <input name="minOrder" type="number" value={form.minOrder} onChange={handleChange} placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Max Discount (Rs.)</label>
                <input name="maxDiscount" type="number" value={form.maxDiscount} onChange={handleChange} placeholder="Optional" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Usage Limit</label>
                <input name="usageLimit" type="number" value={form.usageLimit} onChange={handleChange} placeholder="Unlimited" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Expires At</label>
                <input name="expiresAt" type="date" value={form.expiresAt} onChange={handleChange} style={inputStyle} />
              </div>

            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Description</label>
              <input name="description" value={form.description} onChange={handleChange} placeholder="Optional description" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} style={{ accentColor: 'var(--color-navy)' }} />
              <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: '500' }}>Active</span>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={submitting} style={{
                padding: '9px 24px', borderRadius: '8px',
                backgroundColor: submitting ? '#e2e8f0' : 'var(--color-navy)',
                color: submitting ? '#94a3b8' : '#ffffff',
                border: 'none', fontSize: '0.85rem', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
                {submitting ? 'Saving…' : editId ? 'Save Changes' : 'Create Coupon'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '9px 20px', borderRadius: '8px',
                border: '1px solid #e2e8f0', backgroundColor: '#ffffff',
                color: '#64748b', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading coupons…</p>}

      {!loading && coupons.length === 0 && !showForm && (
        <div style={{
          textAlign: 'center', padding: '60px',
          backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0',
        }}>
          <p style={{ color: '#64748b' }}>No coupons yet. Create one above.</p>
        </div>
      )}

      {!loading && coupons.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Code', 'Type', 'Value', 'Min Order', 'Used', 'Expires', 'Status', ''].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: '700',
                      color: '#64748b', textTransform: 'uppercase',
                      letterSpacing: '0.06em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                      {coupon.code}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569', textTransform: 'capitalize' }}>
                      {coupon.type}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `Rs. ${coupon.value}`}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      Rs. {coupon.minOrder ?? 0}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      {coupon.usedCount ?? 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor: coupon.isActive ? '#dcfce7' : '#f1f5f9',
                        color: coupon.isActive ? '#15803d' : '#64748b',
                      }}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => openEdit(coupon)}
                          style={{ fontSize: '0.8rem', fontWeight: '600', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id, coupon.code)}
                          disabled={deleting === coupon._id}
                          style={{
                            fontSize: '0.8rem', fontWeight: '600',
                            color: deleting === coupon._id ? '#94a3b8' : '#dc2626',
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          }}
                        >
                          {deleting === coupon._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem',
  fontWeight: '600', color: '#475569', marginBottom: '6px',
}

const inputStyle = {
  width: '100%', padding: '9px 14px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '0.88rem',
  color: '#0f172a', outline: 'none', boxSizing: 'border-box',
}

export default AdminCoupons
