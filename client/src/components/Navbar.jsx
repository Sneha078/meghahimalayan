import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/hoh_logo.png";
import SearchDropdown from "./SearchDropdown";
import { fetchAutocomplete, fetchSearchResults } from "../services/searchClient";
import CoinBadge from "./CoinBadge";

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PREVIEW_LIMIT = 5;

function Navbar() {
  const [searchValue, setSearchValue] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  

  const { totalItems } = useCart();
  const { user } = useAuth();

  const searchContainerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  // Debounced autocomplete + product preview search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = searchValue.trim();
    if (query.length < SEARCH_MIN_CHARS) {
      setSuggestions([]);
      setResults([]);
      setSearchLoading(false);
      setDropdownOpen(false);
      return;
    }

    setSearchLoading(true);
    setDropdownOpen(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const [autocompleteData, searchData] = await Promise.all([
          fetchAutocomplete(query),
          fetchSearchResults(query, SEARCH_PREVIEW_LIMIT),
        ]);
        setSuggestions(autocompleteData.suggestions ?? []);
        setResults(searchData.results ?? []);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("Search request failed:", error);
        setSuggestions([]);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchValue]);

  const goToFullResults = () => {
    const query = searchValue.trim();
    if (!query) return;
    setDropdownOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e) => {
    const visibleResults = results.slice(0, 6);
    const combinedLength = suggestions.length + visibleResults.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!combinedLength) return;
      setHighlightedIndex((prev) => (prev + 1) % combinedLength);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!combinedLength) return;
      setHighlightedIndex((prev) => (prev - 1 + combinedLength) % combinedLength);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === -1) {
        goToFullResults();
      } else if (highlightedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else {
        const product = visibleResults[highlightedIndex - suggestions.length];
        if (product) handleResultSelect(product);
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion);
    setDropdownOpen(true);
  };

  const handleResultSelect = (product) => {
    setDropdownOpen(false);
    const productId = product.id ?? product._id;
    if (productId) navigate(`/product/${productId}`);
  };

  const showDropdown = dropdownOpen && searchValue.trim().length >= SEARCH_MIN_CHARS;
  const textColor = scrolled ? "#0d1a2a" : "#ffffff";

  return (
    <nav
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-sm" : "bg-[#0d1a2a]"
      }`}
      style={{ padding: "20px 40px" }}
    >
      <div className="flex items-center justify-between gap-6">

        {/* Logo + Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" style={{ textDecoration: "none" }}>
            <img src={logo} alt="Mega Himalaya" style={{ height: "48px", width: "auto", objectFit: "contain" }} />
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              style={{ color: textColor, textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Home
            </Link>
            <Link
              to="/shop"
              style={{ color: textColor, textDecoration: "none", fontSize: "0.875rem", fontWeight: "600", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Products
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative" ref={searchContainerRef}>
          <div
            className={`flex items-center gap-3 rounded-full border transition-all duration-300 ${
              scrolled ? "bg-gray-100 border-gray-200" : "bg-white/10 border-white/20"
            }`}
            style={{ padding: "12px 20px", height: "48px" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              className={scrolled ? "text-gray-400" : "text-white/50"}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => { if (searchValue.trim().length >= SEARCH_MIN_CHARS) setDropdownOpen(true); }}
              onKeyDown={handleKeyDown}
              className={`bg-transparent text-base outline-none w-full ${
                scrolled ? "text-[#0d1a2a] placeholder-gray-400" : "text-white placeholder-white/50"
              }`}
            />

            {searchValue && (
              <button
                type="button"
                onClick={() => { setSearchValue(""); setSuggestions([]); setResults([]); setDropdownOpen(false); }}
                aria-label="Clear search"
                className={`shrink-0 ${scrolled ? "text-gray-400" : "text-white/60"}`}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {showDropdown && (
            <SearchDropdown
              query={searchValue}
              suggestions={suggestions}
              results={results}
              loading={searchLoading}
              highlightedIndex={highlightedIndex}
              onSuggestionClick={handleSuggestionClick}
              onResultSelect={handleResultSelect}
              onViewAll={goToFullResults}
            />
          )}
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-5">

          {/* Wishlist */}
          <button
            className={`transition-opacity hover:opacity-70 ${scrolled ? "text-[#0d1a2a]" : "text-white"}`}
            aria-label="Wishlist"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>

         
          {/* Account */}
{user ? (
  <Link
    to="/account"
    style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      textDecoration: 'none',
      color: scrolled ? '#0d1a2a' : '#ffffff',
    }}
  >
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      backgroundColor: 'var(--color-taupe)', color: 'var(--color-navy)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.82rem', fontWeight: '700',
    }}>
      {user.name?.charAt(0).toUpperCase()}
    </div>
    <span style={{
      fontSize: '0.82rem', fontWeight: '600',
      color: scrolled ? '#0d1a2a' : '#ffffff',
      maxWidth: '80px', overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {user.name?.split(' ')[0]}
    </span>
  </Link>
) : (
  <Link
    to="/login"
    className={`transition-opacity hover:opacity-70 ${scrolled ? "text-[#0d1a2a]" : "text-white"}`}
    aria-label="Account"
  >
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Link>
)}

          {/* Coin Balance */}
          <CoinBadge scrolled={scrolled} />

          {/* Cart */}
          <Link
            to="/cart"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 20px', borderRadius: '8px',
              backgroundColor: scrolled ? 'var(--color-navy)' : 'transparent',
              border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
              color: 'var(--color-white)', fontSize: '0.875rem', fontWeight: '500',
              textDecoration: 'none', transition: 'all 0.3s ease', position: 'relative',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart
            {totalItems > 0 && (
              <span style={{
                backgroundColor: 'var(--color-error)', color: '#ffffff',
                fontSize: '0.65rem', fontWeight: '700',
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'absolute', top: '-6px', right: '-6px',
              }}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}

const dropdownItemStyle = {
  display: 'block',
  padding: '10px 18px',
  fontSize: '0.85rem',
  fontWeight: '500',
  color: 'var(--color-navy)',
  textDecoration: 'none',
  backgroundColor: 'transparent',
  transition: 'background-color 0.15s ease',
}

export default Navbar;
