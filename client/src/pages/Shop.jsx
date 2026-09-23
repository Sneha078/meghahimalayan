import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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

const PRICE_RANGES = [
  { label: 'All Prices',        min: 0,     max: undefined },
  { label: 'Under Rs 10,000',   min: 0,     max: 10000 },
  { label: 'Rs 10,000 – 25,000', min: 10000, max: 25000 },
  { label: 'Rs 25,000 – 40,000', min: 25000, max: 40000 },
  { label: 'Above Rs 40,000',   min: 40000, max: undefined },
]

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [category,       setCategory]       = useState(searchParams.get('category') || '')
  const [gender,         setGender]         = useState('')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [priceRange,     setPriceRange]     = useState({ min: 0, max: undefined })
  const [discount,       setDiscount]       = useState(searchParams.get('discount') === 'true')
  const [sortBy,         setSortBy]         = useState('featured')
  const [page,           setPage]           = useState(1)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const [filterOpts, setFilterOpts] = useState({ categories: [], brands: [], genders: [] })

  useEffect(() => {
    getFilterOptions(category ? { category } : {})
      .then((data) => setFilterOpts(data))
      .catch(() => {/* non-critical */})
  }, [category])

  useEffect(() => {
    setCategory(searchParams.get('category') || '')
    setDiscount(searchParams.get('discount') === 'true')
  }, [searchParams])

  const query = {
    ...(category                  && { category }),
    ...(gender                    && { gender }),
    ...(selectedBrands.length > 0 && { brand: selectedBrands.join(',') }),
    ...(priceRange.min > 0        && { minPrice: priceRange.min }),
    ...(priceRange.max            && { maxPrice: priceRange.max }),
    ...(discount                  && { discount: 'true' }),
    ...(sortBy !== 'featured'     && { sort: sortBy }),
    limit: 24,
    page,
  }

  const { products, productCount, totalPages, loading, error } = useProducts(query)

  const resetPage = useCallback(() => setPage(1), [])

  const handleCategory = (val) => {
    setCategory(val)
    setSelectedBrands([])
    setGender('')
    resetPage()
    setFilterDrawerOpen(false)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (val) next.set('category', val)
      else next.delete('category')
      return next
    })
  }

  const handleGender = (val) => { setGender(val); resetPage() }
  const handleSort   = (val) => { setSortBy(val); resetPage() }
  const handlePrice  = (range) => { setPriceRange(range); resetPage() }

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
    resetPage()
  }

  const toggleDiscount = () => {
    const next = !discount
    setDiscount(next)
    resetPage()
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (next) p.set('discount', 'true')
      else p.delete('discount')
      return p
    })
  }

  const clearFilters = () => {
    setCategory('')
    setGender('')
    setSelectedBrands([])
    setPriceRange({ min: 0, max: undefined })
    setDiscount(false)
    setSortBy('featured')
    setPage(1)
    setFilterDrawerOpen(false)
    setSearchParams({})
  }

  const activeFilterCount =
    (category ? 1 : 0) +
    (gender ? 1 : 0) +
    selectedBrands.length +
    (priceRange.min > 0 || priceRange.max ? 1 : 0) +
    (discount ? 1 : 0)

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

  const genderOptions = [
    { value: '', label: 'All' },
    ...(filterOpts.genders.length > 0
      ? filterOpts.genders.map((g) => ({ value: g, label: g }))
      : [
          { value: 'Men',    label: 'Men' },
          { value: 'Women',  label: 'Women' },
          { value: 'Unisex', label: 'Unisex' },
        ]
    ),
  ]

  // Shared filter panel content — just the actual filters, no headers
  const filterContent = (
    <>
      {/* Gender */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: '800',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginBottom: '10px',
        }}>
          Gender
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {genderOptions.map((g) => (
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

      {/* On Sale */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={discount}
            onChange={toggleDiscount}
            style={{ accentColor: 'var(--color-navy)', width: '14px', height: '14px', cursor: 'pointer' }}
          />
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '700',
            color: discount ? 'var(--color-navy)' : 'var(--color-muted)',
          }}>
            On Sale Only
          </span>
        </label>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

      {/* Brand */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: '800',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginBottom: '10px',
        }}>
          Brand
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
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
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: '800',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginBottom: '10px',
        }}>
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
    </>
  )

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

      {/* Page Header */}
      <div style={{
        backgroundColor: 'var(--color-navy)',
        padding: 'clamp(32px, 5vw, 64px) var(--section-px) clamp(24px, 4vw, 48px)',
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
          fontSize: 'var(--text-5xl)',
          fontWeight: '800',
          marginBottom: '12px',
          lineHeight: '1.1',
        }}>
          Our Collection
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>
          Discover our complete collection of premium eyewear, watches and fragrances
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--section-px)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      className="hide-scrollbar"
      >
        {categoryTabs.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            style={{
              flexShrink: 0,
              padding: '14px 16px',
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

      {/* Eyewear Guide Banner */}
      {category === 'eyeglasses' && (
        <div style={{
          padding: '12px var(--section-px)',
          backgroundColor: '#f0ebe3',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-navy)' }}>
            Not sure which frame suits you? Read our guide →
          </p>
          <a
            href="/how-to-choose-eyewear"
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              color: 'var(--color-navy)',
              textDecoration: 'underline',
              whiteSpace: 'nowrap',
            }}
          >
            How to Choose Eyewear
          </a>
        </div>
      )}

      {/* Mobile Filter Toggle */}
      <div
        className="flex md:hidden"
        style={{
          padding: '12px var(--section-px)',
          backgroundColor: 'var(--color-white)',
          borderBottom: '1px solid var(--color-border)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => setFilterDrawerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-white)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--color-navy)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              backgroundColor: 'var(--color-navy)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: '700',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Layout */}
      <div style={{
        display: 'flex',
        gap: '28px',
        padding: 'clamp(16px, 3vw, 36px) var(--section-px)',
        alignItems: 'flex-start',
      }}>

        {/* Desktop Sidebar */}
        <aside
          className="hidden md:block"
          style={{
            width: '260px',
            flexShrink: 0,
            backgroundColor: 'var(--color-white)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--color-border)',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
        >
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
          {filterContent}
        </aside>

        {/* Product Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Mobile Product Count */}
          <div className="md:hidden" style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
              <span style={{ fontWeight: '600', color: 'var(--color-navy)' }}>{loading ? '…' : productCount}</span> products found
            </p>
          </div>

          {/* Desktop Toolbar */}
          <div
            className="hidden md:flex"
            style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              <span style={{ fontWeight: '600', color: 'var(--color-navy)' }}>
                {loading ? '…' : productCount}
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
              padding: 'clamp(40px, 8vw, 80px) 20px',
              backgroundColor: 'var(--color-white)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}>
              <p style={{ fontSize: 'var(--text-base)', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '8px' }}>
                No products found
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginBottom: '16px' }}>
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
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '12px' }}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: page === totalPages ? 'transparent' : 'var(--color-navy)',
                  color: page === totalPages ? 'var(--color-muted)' : 'var(--color-taupe)',
                  cursor: page === totalPages ? 'default' : 'pointer',
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

      {/* Mobile Filter Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="relative ml-auto w-[85%] max-w-sm bg-[var(--color-white)] shadow-2xl flex flex-col h-full z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--color-white)',
              zIndex: 1,
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-navy)' }}>Filters</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    style={{ fontSize: '0.72rem', color: 'var(--color-taupe)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy)', padding: '4px' }}
                  aria-label="Close filters"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Content */}
            <div style={{ padding: '20px', flex: 1 }}>
              {/* Mobile Sort By */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-muted)',
                  marginBottom: '10px',
                }}>
                  Sort By
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem',
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
              <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />
              {filterContent}
            </div>

            {/* Apply button */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--color-border)',
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'var(--color-white)',
            }}>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--color-navy)',
                  color: 'var(--color-taupe)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Show {productCount} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Shop
