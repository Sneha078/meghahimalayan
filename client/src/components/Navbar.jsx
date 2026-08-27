import { useCart } from '../context/CartContext'
import logo from '../assets/hoh_logo.png'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  const [searchValue, setSearchValue] = useState('')
  const [scrolled, setScrolled]       = useState(false)
  const { totalItems } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const textColor = scrolled ? '#0d1a2a' : '#ffffff'

  return (
    <nav
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm' : 'bg-[#0d1a2a]'
      }`}
      style={{ padding: '20px 40px' }}
    >
      <div className="flex items-center justify-between gap-6">

        {/* ── Left: Logo + Nav ── */}
        <div className="flex items-center gap-8">

          <Link to="/" style={{ textDecoration: 'none' }}>
            <img src={logo} alt="Mega Himalaya"
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </Link>

          <div className="flex items-center gap-6">

            {/* Home */}
            <Link
              to="/"
              style={{ color: textColor, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Home
            </Link>

            {/* Products — simple link, no dropdown */}
            <Link
              to="/shop"
              style={{ color: textColor, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Products
            </Link>

          </div>
        </div>

        {/* ── Center: Search ── */}
        <div className="flex-1 max-w-md">
          <div
            className={`flex items-center gap-3 rounded-full border transition-all duration-300 ${
              scrolled ? 'bg-gray-100 border-gray-200' : 'bg-white/10 border-white/20'
            }`}
            style={{ padding: '12px 20px', height: '48px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              className={scrolled ? 'text-gray-400' : 'text-white/50'}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className={`bg-transparent text-base outline-none w-full ${
                scrolled ? 'text-[#0d1a2a] placeholder-gray-400' : 'text-white placeholder-white/50'
              }`}
            />
          </div>
        </div>

        {/* ── Right: Icons ── */}
        <div className="flex items-center gap-5">

          {/* Wishlist */}
          <button
            className={`transition-opacity hover:opacity-70 ${scrolled ? 'text-[#0d1a2a]' : 'text-white'}`}
            aria-label="Wishlist"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Account */}
          <button
            className={`transition-opacity hover:opacity-70 ${scrolled ? 'text-[#0d1a2a]' : 'text-white'}`}
            aria-label="Account"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="7" r="4"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Cart with count badge */}
          <Link
            to="/cart"
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '6px',
              padding:         '9px 20px',
              borderRadius:    '8px',
              backgroundColor: scrolled ? 'var(--color-navy)' : 'transparent',
              border:          scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
              color:           '#ffffff',
              fontSize:        '0.875rem',
              fontWeight:      '500',
              textDecoration:  'none',
              transition:      'all 0.3s ease',
              position:        'relative',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart
            {totalItems > 0 && (
              <span style={{
                backgroundColor: 'var(--color-error)',
                color:           '#ffffff',
                fontSize:        '0.65rem',
                fontWeight:      '700',
                width:           '18px',
                height:          '18px',
                borderRadius:    '50%',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                position:        'absolute',
                top:             '-6px',
                right:           '-6px',
              }}>
                {totalItems}
              </span>
            )}
          </Link>

        </div>
      </div>
    </nav>
  )
}

export default Navbar
