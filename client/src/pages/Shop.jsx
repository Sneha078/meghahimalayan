import { useState, useMemo } from 'react'
import products from '../data/products'
import ProductCard from '../components/ProductCard'

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'eyeglasses', label: 'Eyeglasses' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'watches', label: 'Watches' },
  { value: 'perfumes', label: 'Perfumes' },
  { value: 'prescription', label: 'Prescription' },
]

const BRANDS = ['Ray-Ban', 'Gucci', 'Prada', 'Oakley', 'Titan', 'Fastrack', 'Dior', 'Chanel', 'Tom Ford', 'YSL', 'Versace', 'Carolina Herrera']

const GENDERS = [
  { value: 'all', label: 'All' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'unisex', label: 'Unisex' },
]

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
  { value: 'bestselling', label: 'Best Selling' },
]

function Shop() {
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [gender, setGender] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 60000])

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    )
  }

  const clearFilters = () => {
    setCategory('all')
    setGender('all')
    setSelectedBrands([])
    setPriceRange([0, 60000])
    setSortBy('featured')
  }

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) +
    (gender !== 'all' ? 1 : 0) +
    selectedBrands.length +
    (priceRange[0] > 0 || priceRange[1] < 60000 ? 1 : 0)

  const filtered = useMemo(() => {
    let result = [...products]

    if (category !== 'all') {
      result = result.filter((p) => p.category === category)
    }
    if (gender !== 'all') {
      result = result.filter((p) => p.gender === gender)
    }
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand))
    }
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    )

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case 'bestselling':
        result.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
        break
      default:
        break
    }

    return result
  }, [category, gender, selectedBrands, priceRange, sortBy])

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

     
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
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '1rem',
          lineHeight: '1.6',
        }}>
          Discover our complete collection of premium eyewear, watches and fragrances
        </p>
      </div>

      
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflowX: 'auto',
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            style={{
              padding: '16px 20px',
              border: 'none',
              borderBottom: category === cat.value
                ? '2px solid var(--color-navy)'
                : '2px solid transparent',
              backgroundColor: 'transparent',
              fontSize: '0.85rem',
              fontWeight: category === cat.value ? '600' : '400',
              color: category === cat.value
                ? 'var(--color-navy)'
                : 'var(--color-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      
      <div style={{
        display: 'flex',
        gap: '28px',
        padding: '36px 5rem',
        alignItems: 'flex-start',
      }}>

       
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

          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h2 style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-navy)',
            }}>
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-taupe)',
                  fontWeight: '600',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            )}
          </div>

         
          <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

          {/* Gender Filter */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginBottom: '10px',
            }}>
              Gender
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
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

          
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginBottom: '10px',
            }}>
              Brand
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {BRANDS.map((brand) => (
                <label
                  key={brand}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    style={{
                      accentColor: 'var(--color-navy)',
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{
                    fontSize: '0.83rem',
                    color: selectedBrands.includes(brand)
                      ? 'var(--color-navy)'
                      : 'var(--color-muted)',
                    fontWeight: selectedBrands.includes(brand) ? '600' : '400',
                  }}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          
          <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

                 
          <div>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginBottom: '10px',
            }}>
              Price Range
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'All Prices', min: 0, max: 60000 },
                { label: 'Under Rs 10,000', min: 0, max: 10000 },
                { label: 'Rs 10,000 – 25,000', min: 10000, max: 25000 },
                { label: 'Rs 25,000 – 40,000', min: 25000, max: 40000 },
                { label: 'Above Rs 40,000', min: 40000, max: 60000 },
              ].map((range) => (
                <button
                  key={range.label}
                  onClick={() => setPriceRange([range.min, range.max])}
                  style={{
                    textAlign: 'left',
                    padding: '7px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    backgroundColor: priceRange[0] === range.min && priceRange[1] === range.max
                      ? 'var(--color-navy)'
                      : 'transparent',
                    color: priceRange[0] === range.min && priceRange[1] === range.max
                      ? 'var(--color-taupe)'
                      : 'var(--color-muted)',
                    fontWeight: priceRange[0] === range.min && priceRange[1] === range.max
                      ? '600' : '400',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

        </aside>

       
        <div style={{ flex: 1, minWidth: 0 }}>

         
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              <span style={{ fontWeight: '600', color: 'var(--color-navy)' }}>
                {filtered.length}
              </span> products found
              {activeFilterCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  color: 'var(--color-taupe)',
                  fontWeight: '600',
                }}>
                  · {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </span>
              )}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              backgroundColor: 'var(--color-white)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}>
              <p style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--color-navy)',
                marginBottom: '8px',
              }}>
                No products found
              </p>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-muted)',
                marginBottom: '16px',
              }}>
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
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}>
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Shop