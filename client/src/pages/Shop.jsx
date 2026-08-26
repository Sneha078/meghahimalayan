import { useState, useEffect, useCallback } from 'react'
import { useProducts } from '../hooks/useProducts'
import { getFilterOptions } from '../api/productClient'
import ProductCard from '../components/ProductCard'

const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: '-createdAt', label: 'Newest' },
  { value: 'price',      label: 'Price: Low to High' },
  { value: '-price',     label: 'Price: High to Low' },
  { value: '-ratings',   label: 'Best Rated' },
  { value: '-isBestSeller', label: 'Best Selling' },
]

const GENDER_OPTIONS = [
  { value: '',        label: 'All' },
  { value: 'Men',     label: 'Men' },
  { value: 'Women',   label: 'Women' },
  { value: 'Unisex',  label: 'Unisex' },
]

const PRICE_RANGES = [
  { label: 'All Prices',        min: 0,     max: undefined },
  { label: 'Under Rs 10,000',   min: 0,     max: 10000 },
  { label: 'Rs 10,000 – 25,000', min: 10000, max: 25000 },
  { label: 'Rs 25,000 – 40,000', min: 25000, max: 40000 },
  { label: 'Above Rs 40,000',   min: 40000, max: undefined },
]

function Shop() {
  // Filter state
  const [category,       setCategory]       = useState('')
  const [gender,         setGender]         = useState('')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [priceRange,     setPriceRange]     = useState({ min: 0, max: undefined })
  const [sortBy,         setSortBy]         = useState('featured')
  const [page,           setPage]           = useState(1)

  // Filter options fetched from the backend
  const [filterOpts, setFilterOpts] = useState({ categories: [], brands: [], genders: [] })

  useEffect(() => {
    getFilterOptions()
      .then((data) => setFilterOpts(data))
      .catch(() => {/* non-critical */})
  }, [])

  // Build the query object sent to useProducts / the API
  const query = {
    ...(category                  && { category }),
    ...(gender                    && { gender }),
    ...(selectedBrands.length > 0 && { brand: selectedBrands.join(',') }),
    ...(priceRange.min > 0        && { minPrice: priceRange.min }),
    ...(priceRange.max            && { maxPrice: priceRange.max }),
    ...(sortBy !== 'featured'     && { sort: sortBy }),
    limit: 24,
    page,
  }

  const { products, loading, error } = useProducts(query)

  // Reset to page 1 whenever filters change
  const resetPage = useCallback(() => setPage(1), [])

  const handleCategory = (val) => { setCategory(val);       resetPage() }
  const handleGender   = (val) => { setGender(val);         resetPage() }
  const handleSort     = (val) => { setSortBy(val);         resetPage() }
  const handlePrice    = (range) => { setPriceRange(range); resetPage() }

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
    resetPage()
  }

  const clearFilters = () => {
    setCategory('')
    setGender('')
    setSelectedBrands([])
    setPriceRange({ min: 0, max: undefined })
    setSortBy('featured')
    setPage(1)
  }

  const activeFilterCount =
    (category ? 1 : 0) +
    (gender ? 1 : 0) +
    selectedBrands.length +
    (priceRange.min > 0 || priceRange.max ? 1 : 0)

  // Use backend categories if loaded, otherwise a sensible fallback
  const categoryTabs = [
    { value: '', label: 'All Products' },
    ...( filterOpts.categories.length > 0
      ? filterOpts.categories.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
      : [
          { value: 'eyeglasses', label: 'Eyeglasses' },
          { value: 'watches',    label: 'Watches' },
          { value: 'perfumes',   label: 'Perfumes' },
        ]
    ),
  ]

  const brandList = filterOpts.brands.length > 0
    ? filterOpts.brands
    : ['Ray-Ban', 'Gucci', 'Prada', 'Oakley', 'Titan', 'Fastrack', 'Casio', 'Seiko', 'Citizen', 'Tissot']

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

      {/* Page Header */}
      <div style={{
        backgroundColor: 'var(--color-navy)',
        padding: '64px 5rem 48px',
      }}>
        <p style={{
          color: 'var(--color-taupe)',
          fontSize: '0.72rem',
          fontWeight: '700',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          Mega Himalaya Optical House
        </p>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          color: '#ffffff',
          fontSize: '3rem',
          fontWeight: '800',
          marginBottom: '12px',
          lineHeight: '1.1',
        }}>
          Our Collection
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: '1.6' }}>
          Discover our complete collection of premium eyewear, watches and fragrances
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflowX: 'auto',
      }}>
        {categoryTabs.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            style={{
              padding: '16px 20px',
              border: 'none',
              borderBottom: category === cat.value
                ? '2px solid var(--color-navy)'
                : '2px solid transparent',
              backgroundColor: 'transparent',
              fontSize: '0.85rem',
              fontWeight: category === cat.value ? '600' : '400',
              color: category === cat.value ? 'var(--color-navy)' : 'var(--color-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{
        display: 'flex',
        gap: '28px',
        padding: '36px 5rem',
        alignItems: 'flex-start',
      }}>

        {/* Sidebar Filters */}
        <aside style={{
          width: '240px',
          flexShrink: 0,
          backgroundColor: 'var(--color-white)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--color-border)',
          position: 'sticky',
          top: '88px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-navy)',
            }}>Filters</h2>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{ fontSize: '0.72rem', color: 'var(--color-taupe)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Clear all
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

          {/* Gender */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '10px' }}>
              Gender
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => handleGender(g.value)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${gender === g.value ? 'var(--color-navy)' : 'var(--color-border)'}`,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: gender === g.value ? '600' : '400',
                    backgroundColor: gender === g.value ? 'var(--color-navy)' : 'transparent',
                    color: gender === g.value ? 'var(--color-taupe)' : 'var(--color-navy)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

          {/* Brand */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '10px' }}>
              Brand
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {brandList.map((brand) => (
                <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    style={{ accentColor: 'var(--color-navy)', width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  <span style={{
                    fontSize: '0.83rem',
                    color: selectedBrands.includes(brand) ? 'var(--color-navy)' : 'var(--color-muted)',
                    fontWeight: selectedBrands.includes(brand) ? '600' : '400',
                  }}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

          {/* Price Range */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '10px' }}>
              Price Range
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PRICE_RANGES.map((range) => {
                const active = priceRange.min === range.min && priceRange.max === range.max
                return (
                  <button
                    key={range.label}
                    onClick={() => handlePrice({ min: range.min, max: range.max })}
                    style={{
                      textAlign: 'left',
                      padding: '7px 10px',
                      borderRadius: '7px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      backgroundColor: active ? 'var(--color-navy)' : 'transparent',
                      color: active ? 'var(--color-taupe)' : 'var(--color-muted)',
                      fontWeight: active ? '600' : '400',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {range.label}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              <span style={{ fontWeight: '600', color: 'var(--color-navy)' }}>
                {loading ? '…' : products.length}
              </span> products found
              {activeFilterCount > 0 && (
                <span style={{ marginLeft: '8px', color: 'var(--color-taupe)', fontWeight: '600' }}>
                  · {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </span>
              )}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '7px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.8rem',
                  color: 'var(--color-navy)',
                  backgroundColor: 'var(--color-white)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* States */}
          {loading && (
            <p style={{ color: 'var(--color-navy)', opacity: 0.6 }}>Loading products…</p>
          )}
          {error && (
            <p style={{ color: '#e74c3c' }}>Couldn't load products: {error}</p>
          )}

          {!loading && !error && products.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              backgroundColor: 'var(--color-white)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '8px' }}>
                No products found
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '16px' }}>
                Try adjusting or clearing your filters
              </p>
              <button
                onClick={clearFilters}
                style={{
                  padding: '9px 24px',
                  backgroundColor: 'var(--color-navy)',
                  color: 'var(--color-taupe)',
                  border: 'none',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && products.length === 24 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '40px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '7px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: page === 1 ? 'transparent' : 'var(--color-navy)',
                  color: page === 1 ? 'var(--color-muted)' : 'var(--color-taupe)',
                  cursor: page === 1 ? 'default' : 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                }}
              >
                ← Prev
              </button>
              <span style={{ padding: '8px 16px', fontSize: '0.82rem', color: 'var(--color-navy)', fontWeight: '600' }}>
                Page {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: 'var(--color-navy)',
                  color: 'var(--color-taupe)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                }}
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Shop
