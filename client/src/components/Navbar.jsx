import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import logo from "../assets/hoh_logo.png";
import SearchDropdown from "./SearchDropdown";
import { fetchAutocomplete } from "../services/searchClient";
import { fetchSearchPreview } from "../services/searchPreview";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { totalWishlisted } = useWishlist();

  const searchContainerRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu or search open
  useEffect(() => {
    const open = mobileMenuOpen || mobileSearchOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen, mobileSearchOpen]);

  // Auto-focus mobile search input when overlay opens
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [mobileSearchOpen]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  // Navbar scroll state
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 // Close search dropdown when clicking outside
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
      setSuggestions([]); setResults([]); setSearchLoading(false); setDropdownOpen(false);
      return;
    }
    setSearchLoading(true);
    setDropdownOpen(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [autocompleteData, previewResults] = await Promise.all([
          fetchAutocomplete(query),
          fetchSearchPreview(query, SEARCH_PREVIEW_LIMIT),
        ]);
        setSuggestions(autocompleteData.suggestions ?? []);
        setResults(previewResults);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]); setResults([]);
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
    setMobileSearchOpen(false);
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
      if (highlightedIndex === -1) { goToFullResults(); }
      else if (highlightedIndex < suggestions.length) { handleSuggestionClick(suggestions[highlightedIndex]); }
      else {
        const product = visibleResults[highlightedIndex - suggestions.length];
        if (product) handleResultSelect(product);
      }
    } else if (e.key === "Escape") {
      if (mobileSearchOpen) {
        setMobileSearchOpen(false);
      } else {
        setDropdownOpen(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => { setSearchValue(suggestion); setDropdownOpen(true); };
  const handleResultSelect = (product) => {
    setDropdownOpen(false);
    setMobileSearchOpen(false);
    const productId = product.id ?? product._id;
    if (productId) navigate(`/product/${productId}`);
  };

  const showDropdown = dropdownOpen && searchValue.trim().length >= SEARCH_MIN_CHARS;
  const textColor = scrolled ? "#0d1a2a" : "#ffffff";
  const isHome = location.pathname === "/";

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav
        className={`w-full sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-white shadow-sm" : "bg-[#0d1a2a]"
        }`}
        style={{ padding: isHome ? "10px clamp(6px, 2vw, 10px)" : "10px 4px" }}
      >
        <div className="flex items-center justify-between" style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Left: Back arrow (sub-pages) + Hamburger + Logo */}
          <div className={`flex items-center ${isHome ? "gap-1" : "gap-2 sm:gap-3"}`} style={{ flexShrink: 0 }}>
            {/* Back button — on sub-pages */}
            {location.pathname !== "/" && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="lg:hidden flex items-center justify-center"
                aria-label="Go back"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: textColor, width: "24px", height: "24px", flexShrink: 0,
                  padding: 0, marginRight: "-4px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Hamburger — on phones + tablets */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: textColor, width: isHome ? "26px" : "24px", height: isHome ? "26px" : "24px", flexShrink: 0,
                padding: 0,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link to="/" className="flex items-center" style={{ textDecoration: "none", flexShrink: 0 }}>
              <img src={logo} alt="Mega Himalaya" style={{ height: isHome ? "30px" : "26px", width: "auto", maxWidth: "clamp(46px, 15vw, 130px)", objectFit: "contain" }} />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center" style={{ gap: "24px", marginLeft: "20px" }}>
              <Link to="/" style={{ color: textColor, textDecoration: "none", fontSize: "0.85rem", fontWeight: "500", transition: "opacity 0.2s", display: "flex", alignItems: "center", height: "32px" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Home
              </Link>
              <Link to="/shop" style={{ color: textColor, textDecoration: "none", fontSize: "0.85rem", fontWeight: "600", transition: "opacity 0.2s", display: "flex", alignItems: "center", height: "32px" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Products
              </Link>
              <Link
              to="/shop?category=contact-lenses"
              style={{ color: textColor, textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", transition: "opacity 0.2s", display: "flex", alignItems: "center", height: "32px" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Contact Lenses
            </Link>
          </div>
          </div>

          {/* Center: Search bar (desktop only) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md relative" ref={searchContainerRef} style={{ marginLeft: "20px", marginRight: "20px" }}>
            <div className={`flex items-center gap-3 w-full rounded-full border transition-all duration-300 ${
              scrolled ? "bg-gray-100 border-gray-200" : "bg-white/10 border-white/20"
            }`} style={{ padding: "6px 16px", height: "32px", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={scrolled ? "text-gray-400" : "text-white/50"}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text" placeholder="Search products, brands..."
                value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => { if (searchValue.trim().length >= SEARCH_MIN_CHARS) setDropdownOpen(true); }}
                onKeyDown={handleKeyDown}
                className={`bg-transparent text-sm outline-none w-full ${
                  scrolled ? "text-[[#0d1a2a]]placeholder-gray-400" : "text-white"
                }`}
                style={{ minWidth: 0 }}
              />
              {searchValue && (
                <button type="button"
                  onClick={() => { setSearchValue(""); setSuggestions([]); setResults([]); setDropdownOpen(false); }}
                  aria-label="Clear search"
                  className={`shrink-0 ${scrolled ? "text-gray-400" : "text-white/60"}`}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
            {showDropdown && (
              <SearchDropdown query={searchValue} suggestions={suggestions} results={results}
                loading={searchLoading} highlightedIndex={highlightedIndex}
                onSuggestionClick={handleSuggestionClick} onResultSelect={handleResultSelect} onViewAll={goToFullResults} />
            )}
          </div>

          {/* Spacer — equal gap between logo and search icon */}
          <div
            className={`lg:hidden ${isHome ? "" : "w-2 sm:w-3 shrink-0"}`}
            aria-hidden
            style={isHome ? { flex: '1 1 auto', maxWidth: '28px' } : { flex: '0 0 auto' }}
          />

          {/* Right: Icons */}
          <div className={`flex items-center shrink-0 ${isHome ? "gap-[clamp(4px,1.6vw,18px)] mr-4" : "gap-[8px] mr-2 sm:gap-3 sm:mr-4 lg:gap-5"}`}>

          {/* Mobile search — icon only */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className="lg:hidden flex items-center justify-center"
            aria-label="Search"
            style={{
              width: isHome ? "24px" : "22px", height: isHome ? "24px" : "22px", flexShrink: 0,
              background: "none", border: "none", cursor: "pointer",
              color: textColor, padding: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="flex items-center justify-center"
            style={{ position: 'relative', width: isHome ? '24px' : '22px', height: isHome ? '24px' : '22px', color: scrolled ? '#0d1a2a' : '#ffffff', lineHeight: 0, flexShrink: 0 }}
            aria-label="Wishlist"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            {totalWishlisted > 0 && (
              <span style={{
                backgroundColor: '#e74c3c', color: '#ffffff',
                fontSize: '0.65rem', fontWeight: '700',
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'absolute', top: '-6px', right: '-6px',
              }}>
                {totalWishlisted}
              </span>
            )}
          </Link>

          {/* Account */}
          {user ? (
            <Link
              to="/account"
              className="flex items-center justify-center"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                textDecoration: 'none',
                color: scrolled ? '#0d1a2a' : '#ffffff',
                width: isHome ? '24px' : '22px', height: isHome ? '24px' : '22px',
                flexShrink: 0, lineHeight: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ filter: scrolled ? 'none' : 'drop-shadow(0 0 3px rgba(255,255,255,0.75))' }}>
                <circle cx="12" cy="7.5" r="4.2" />
                <path d="M20.5 21.5v-1.8c0-2.5-2.2-4.5-5-4.5H8.5c-2.8 0-5 2-5 4.5v1.8z" />
              </svg>
              <span className="hidden lg:inline" style={{
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
              className={`flex items-center justify-center ${isHome ? "w-[26px] h-[26px]" : "w-[22px] h-[22px]"} ${scrolled ? "text-[#0d1a2a]" : "text-white"}`}
              aria-label="Account"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ filter: scrolled ? 'none' : 'drop-shadow(0 0 3px rgba(255,255,255,0.75))' }}>
                <circle cx="12" cy="7.5" r="4.2" />
                <path d="M20.5 21.5v-1.8c0-2.5-2.2-4.5-5-4.5H8.5c-2.8 0-5 2-5 4.5v1.8z" />
              </svg>
            </Link>
          )}

          {/* Coin Balance */}
          <CoinBadge scrolled={scrolled} />

          {/* Cart */}
          <Link
            to="/cart"
            className={`flex items-center justify-center relative ${isHome ? "ml-1.5" : ""} sm:ml-0`}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: scrolled ? 'var(--color-navy)' : 'rgba(255,255,255,0.08)',
              border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
              color: 'var(--color-white)', fontSize: '0.875rem', fontWeight: '500',
              textDecoration: 'none', transition: 'all 0.3s ease', flexShrink: 0,
            }}
            aria-label="Cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span style={{
                backgroundColor: 'var(--color-error)', color: '#ffffff',
                fontSize: '0.65rem', fontWeight: '700',
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'absolute', top: '-5px', right: '-4px', zIndex: 2,
              }}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Trailing spacer — absorbs leftover space so cart never overflows (small screens) */}
        <div className="lg:hidden" aria-hidden style={{ flex: '1 1 auto' }} />
      </div>
    </nav>

      {/* ── Mobile Search Overlay ── */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col" style={{ backgroundColor: "var(--color-sbg)" }}>
          {/* Search Header */}
          <div className="flex items-center gap-3 shrink-0" style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
            <button
              type="button"
              onClick={() => { setMobileSearchOpen(false); setSearchValue(""); setSuggestions([]); setResults([]); setDropdownOpen(false); }}
              aria-label="Close search"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-navy)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 flex items-center gap-3 rounded-full bg-white border border-[var(--color-border)]" style={{ padding: "10px 16px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search products, brands..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm outline-none text-[var(--color-navy)] placeholder-gray-400"
                style={{ minWidth: 0 }}
              />
              {searchValue && (
                <button type="button"
                  onClick={() => { setSearchValue(""); setSuggestions([]); setResults([]); setDropdownOpen(false); }}
                  aria-label="Clear search"
                  className="text-gray-400 shrink-0"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "8px 16px" }}>
            {searchValue.trim().length >= SEARCH_MIN_CHARS ? (
              <div className="relative">
                {showDropdown && (
                  <SearchDropdown query={searchValue} suggestions={suggestions} results={results}
                    loading={searchLoading} highlightedIndex={highlightedIndex}
                    onSuggestionClick={handleSuggestionClick} onResultSelect={handleResultSelect} onViewAll={goToFullResults} />
                )}
              </div>
            ) : (
              /* Quick Links when no search */
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-muted)", textTransform: "uppercase", margin: "12px 0 8px" }}>
                  Quick Links
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Eyeglasses", "Watches", "Perfumes", "New Arrivals", "Best Sellers"].map((tag) => (
                    <Link
                      key={tag}
                      to={`/shop?search=${encodeURIComponent(tag)}`}
                      onClick={() => setMobileSearchOpen(false)}
                      className="text-xs font-medium rounded-full border"
                      style={{
                        padding: "8px 14px",
                        color: "var(--color-navy)",
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-white)",
                        textDecoration: "none",
                      }}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>

                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-muted)", textTransform: "uppercase", margin: "20px 0 8px" }}>
                  Categories
                </p>
                <div className="space-y-1">
                  {[
                    { to: "/shop?category=eyeglasses", label: "Eyeglasses" },
                    { to: "/shop?category=contact-lenses", label: "Contact Lenses" },
                    { to: "/shop?category=watches", label: "Watches" },
                    { to: "/shop?category=perfumes", label: "Perfumes" },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSearchOpen(false)}
                      className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-white transition-colors"
                      style={{ textDecoration: "none", color: "var(--color-navy)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-taupe)]">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-xs bg-[#0d2031] text-white shadow-2xl flex flex-col h-full z-10 overflow-y-auto" style={{ paddingLeft: '28px', paddingRight: '16px' }}>

            {/* Header */}
            <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <img src={logo} alt="Mega Himalaya" style={{ height: "36px", width: "auto" }} />
              </Link>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User */}
            <div className="px-4 py-5 bg-white/5 border-b border-white/10">
              {user ? (
                <div className="flex items-center gap-3">
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    backgroundColor: "#ffffff", color: "var(--color-navy)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: "900", flexShrink: 0,
                  }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/50 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 px-3 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: "var(--color-taupe)", color: "var(--color-navy)" }}>
                    Sign In
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 px-3 rounded-lg text-xs font-semibold border border-white/20 hover:bg-white/10"
                    style={{ color: "#ffffff", textDecoration: "none" }}>
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="px-4 py-6 flex-1 space-y-1" style={{ marginTop: '8px' }}>
              {[
                { to: "/", label: "Home" },
                { to: "/shop", label: "All Products" },
                { to: "/shop?category=eyeglasses", label: "Eyeglasses" },
                { to: "/shop?category=contact-lenses", label: "Contact Lenses" },
                { to: "/shop?category=watches", label: "Watches" },
                { to: "/shop?category=perfumes", label: "Perfumes" },
                { to: "/cart", label: "My Cart" },
                { to: "/rewards", label: "Rewards & Coins" },
                { to: "/wishlist", label: "Wishlist" },
                { to: "/orders", label: "My Orders" },
                { to: "/account", label: "My Account" },
              ].map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-4 rounded-lg text-sm hover:bg-white/10 transition-colors"
                  style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Footer */}
            {user && (
              <div className="px-4 py-5 border-t border-white/10">
                <button type="button" onClick={handleLogout}
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  style={{ background: "none" }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
  </>
  );
}

export default Navbar;