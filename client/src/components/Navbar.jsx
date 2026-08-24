import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  const [searchValue, setSearchValue] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`w-full px-10 sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm' : 'bg-[#0d1a2a]'
      }`}
      style={{ padding: '20px 40px' }}
    >
      
      <div className="flex items-center justify-between gap-6">

       
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/">
            <span
              className={`font-heading font-bold text-xl tracking-widest select-none ${
                scrolled ? 'text-[#0d1a2a]' : 'text-[#C9A84C]'
              }`}
            >
              HΩH
            </span>
          </Link>

          
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-opacity hover:opacity-70 ${
                scrolled ? 'text-[#0d1a2a]' : 'text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`text-sm font-semibold transition-opacity hover:opacity-70 flex items-center gap-1 ${
                scrolled ? 'text-[#0d1a2a]' : 'text-white'
              }`}
            >
              Products
              <svg
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        
        <div className="flex-1 max-w-md">
          <div
            className={`flex items-center gap-3 rounded-full border transition-all duration-300 ${
              scrolled
                ? 'bg-gray-100 border-gray-200'
                : 'bg-white/10 border-white/20'
            }`}
            style={{ padding: '12px 20px', height: '48px' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={scrolled ? 'text-gray-400' : 'text-white/50'}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={`bg-transparent text-base outline-none w-full ${
                scrolled
                  ? 'text-[#0d1a2a] placeholder-gray-400'
                  : 'text-white placeholder-white/50'
              }`}
            />
          </div>
        </div>

        
        <div className="flex items-center gap-5">
          {/* Wishlist */}
          <button
            className={`transition-opacity hover:opacity-70 ${
              scrolled ? 'text-[#0d1a2a]' : 'text-white'
            }`}
            aria-label="Wishlist"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

   
          <button
            className={`transition-opacity hover:opacity-70 ${
              scrolled ? 'text-[#0d1a2a]' : 'text-white'
            }`}
            aria-label="Account"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

        
          <Link
            to="/cart"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              scrolled
                ? 'bg-[#0d1a2a] text-white border-[#0d1a2a] hover:bg-[#162436]'
                : 'bg-transparent text-white border-white/25 hover:bg-white/5'
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="3"
                y1="6"
                x2="21"
                y2="6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M16 10a4 4 0 0 1-8 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cart
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
