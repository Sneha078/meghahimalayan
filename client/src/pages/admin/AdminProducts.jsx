
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminProducts, deleteProduct } from '../../api/adminClient'
import { getFilterOptions } from '../../api/productClient'

function AdminProducts() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('All')
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    getAdminProducts(page, 15, { category: filter })
      .then((data) => {
        setProducts(data.products ?? [])
        setTotalPages(data.totalPages ?? 1)
        setProductCount(data.productCount ?? (data.products ?? []).length)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [page, filter])

  const handleFilter = (c) => {
    setFilter(c)
    setPage(1)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await deleteProduct(id)
      setProducts((prev) => {
        const next = prev.filter((p) => p._id !== id)
        if (next.length === 0 && page > 1) setPage((p) => p - 1)
        return next
      })
      setProductCount((c) => Math.max(0, c - 1))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    getFilterOptions()
      .then((data) => {
        if (data.categories?.length) setCategories(['All', ...data.categories])
      })
      .catch(() => {})
  }, [])

  const [categories, setCategories] = useState(['All', 'eyeglasses', 'watches', 'perfumes'])

  // Category filtering happens server-side (so pagination + count stay
  // correct); this leaves only the name/brand search to filter locally.
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px' }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
            Products
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            {productCount} total products
          </p>
        </div>
        <Link
          to="/admin/products/new"
          style={{
            padding: '10px 20px', borderRadius: '8px',
            backgroundColor: 'var(--color-navy)', color: '#ffffff',
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600',
          }}
        >
          + Add Product
        </Link>
      </div>

      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '0.88rem',
            outline: 'none', minWidth: '240px',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => handleFilter(c)}
              style={{
                padding: '6px 16px', borderRadius: '20px',
                fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                border: '1px solid',
                backgroundColor: filter === c ? 'var(--color-navy)' : '#ffffff',
                color: filter === c ? '#ffffff' : '#64748b',
                borderColor: filter === c ? 'var(--color-navy)' : '#e2e8f0',
                textTransform: 'capitalize',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: '0.88rem', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading products…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px',
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <p style={{ color: '#64748b' }}>No products found.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Product', 'Category', 'Brand', 'Price', 'Stock', 'Status', ''].map((h) => (
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
                {filtered.map((product) => (
                  <tr key={product._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    {/* Product image + name */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '8px',
                          backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0,
                        }}>
                          {product.image?.[0]?.url ? (
                            <img
                              src={product.image[0].url} alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                              
                            </div>
                          )}
                        </div>
                        <p style={{
                          fontSize: '0.85rem', fontWeight: '600',
                          color: '#0f172a', maxWidth: '180px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {product.name}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569', textTransform: 'capitalize' }}>
                      {product.category}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      {product.brand}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                      Rs. {(product.discountPrice ?? product.price)?.toLocaleString()}
                      {product.discountPrice && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                          Rs. {product.price?.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      {product.stock}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor: Number(product.stock) > 0 ? '#dcfce7' : '#fee2e2',
                        color: Number(product.stock) > 0 ? '#15803d': '#dc2626,'
                      }}>
                        {Number(product.stock)> 0 ? 'In stock' : 'Out of stock'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          style={{
                            fontSize: '0.8rem', fontWeight: '600',
                            color: '#2563eb', textDecoration: 'none',
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleting === product._id}
                          style={{
                            fontSize: '0.8rem', fontWeight: '600',
                            color: deleting === product._id ? '#94a3b8' : '#dc2626',
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          }}
                        >
                          {deleting === product._id ? '…' : 'Delete'}
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

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
              backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff', color: page <= 1 ? '#cbd5e1' : '#0f172a',
              fontSize: '0.82rem', fontWeight: '600', cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
              backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff', color: page >= totalPages ? '#cbd5e1' : '#0f172a',
              fontSize: '0.82rem', fontWeight: '600', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminProducts
