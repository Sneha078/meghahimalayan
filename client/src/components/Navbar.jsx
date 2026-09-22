import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import logo from "../assets/hoh_logo.png";
import SearchDropdown from "./SearchDropdown";
import CoinBadge from "./CoinBadge";
import { fetchAutocomplete, fetchSearchResults } from "../services/searchClient";

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

  // Debounced search
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
        const [autocompleteData, searchData] = await Promise.all([
          fetchAutocomplete(query),
          fetchSearchResults(query, SEARCH_PREVIEW_LIMIT),
        ]);
        setSuggestions(autocompleteData.suggestions ?? []);
        setResults(searchData.results ?? []);
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

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav
        className={`w-full sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-white shadow-sm" : "bg-[#0d1a2a]"
        }`}
        style={{ padding: "10px 10px" }}
      >
        <div className="flex items-center justify-between" style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Left: Back arrow (mobile sub-pages) + Hamburger + Logo */}
          <div className="flex items-center" style={{ gap: "6px", flexShrink: 0 }}>
            {/* Back button — mobile only, on sub-pages */}
            {location.pathname !== "/" && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="lg:hidden flex items-center justify-center"
                aria-label="Go back"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: textColor, width: "32px", height: "32px", flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Hamburger — always on mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: textColor, width: "32px", height: "32px", flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link to="/" className="flex items-center" style={{ textDecoration: "none", flexShrink: 0 }}>
              <img src={logo} alt="Mega Himalaya" style={{ height: "32px", width: "auto", maxWidth: "130px", objectFit: "contain" }} />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center" style={{ gap: "24px", marginLeft: "20px" }}>
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
            </div>
          </div>

          {/* Mobile search bar — fills space between logo and icons */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden flex items-center gap-2 flex-1 min-w-0"
            style={{
              marginLeft: "8px", marginRight: "4px",
              padding: "6px 10px", borderRadius: "20px",
              backgroundColor: scrolled ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)",
              border: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.15)",
              color: scrolled ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)",
              fontSize: "0.78rem", cursor: "pointer", textAlign: "left",
              minWidth: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            {location.pathname === "/" && <span className="truncate">Search products...</span>}
          </button>

          {/* Center: Search bar (desktop only) */}
          <div className="hidden md:flex items-center flex-1 max-w-lg relative" ref={searchContainerRef}>
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
                  scrolled ? "text-[#0d1a2a] placeholder-gray-400" : "text-white placeholder-white/50"
                }`}
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

          {/* Right: Icons */}
          <div className="flex items-center shrink-0">

            {/* Mobile icons — tight spacing */}
            <div className="flex md:hidden items-center" style={{ gap: "2px" }}>
              <Link to="/wishlist" className="flex items-center justify-center relative" style={{ color: textColor, width: "32px", height: "32px", lineHeight: 0 }} aria-label="Wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {totalWishlisted > 0 && <span style={{ backgroundColor: "#e74c3c", color: "#fff", fontSize: "0.55rem", fontWeight: "700", width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: "1px", right: "1px" }}>{totalWishlisted}</span>}
              </Link>
              <Link to={user ? "/account" : "/login"} className="flex items-center justify-center" style={{ color: textColor, width: "32px", height: "32px", lineHeight: 0 }} aria-label={user ? "My Account" : "Login"}>
                {user ? (
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--color-taupe)", color: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "700" }}>{user.name?.charAt(0).toUpperCase()}</div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </Link>
              <Link to="/cart" className="flex items-center justify-center relative" style={{ color: textColor, width: "32px", height: "32px", lineHeight: 0 }} aria-label="Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                {totalItems > 0 && <span style={{ backgroundColor: "var(--color-error)", color: "#fff", fontSize: "0.55rem", fontWeight: "700", width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: "1px", right: "1px" }}>{totalItems}</span>}
              </Link>
            </div>

            {/* Desktop icons — spaced like nav links */}
            <div className="hidden md:flex items-center" style={{ gap: "20px" }}>
              <Link to="/wishlist" className="flex items-center justify-center relative" style={{ color: textColor, width: "32px", height: "32px", lineHeight: 0 }} aria-label="Wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {totalWishlisted > 0 && <span style={{ backgroundColor: "#e74c3c", color: "#fff", fontSize: "0.55rem", fontWeight: "700", width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: "1px", right: "1px" }}>{totalWishlisted}</span>}
              </Link>
              <Link to={user ? "/account" : "/login"} className="flex items-center justify-center" style={{ color: textColor, width: "32px", height: "32px", lineHeight: 0 }} aria-label={user ? "My Account" : "Login"}>
                {user ? (
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--color-taupe)", color: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "700" }}>{user.name?.charAt(0).toUpperCase()}</div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </Link>
              <CoinBadge scrolled={scrolled} />
              <Link to="/cart" className="flex items-center relative" style={{ padding: "6px 14px", borderRadius: "8px", gap: "6px", backgroundColor: scrolled ? "var(--color-navy)" : "transparent", border: scrolled ? "none" : "1px solid rgba(255,255,255,0.3)", color: "var(--color-white)", fontSize: "0.8rem", fontWeight: "500", textDecoration: "none", transition: "all 0.3s ease", whiteSpace: "nowrap" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                <span>Cart</span>
                {totalItems > 0 && <span style={{ backgroundColor: "var(--color-error)", color: "#fff", fontSize: "0.55rem", fontWeight: "700", width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: "-4px", right: "-4px" }}>{totalItems}</span>}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Search Overlay ── */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col" style={{ backgroundColor: "var(--color-sbg)" }}>
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
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-xs bg-[#0d2031] text-white shadow-2xl flex flex-col h-full z-10 overflow-y-auto" style={{ paddingLeft: '28px', paddingRight: '16px' }}>

            {/* Header */}
            <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <img src={logo} alt="Mega Himalaya" style={{ height: "36px", width: "auto" }} />
              </Link>
              <button type="button" onClick={() => setMobileMenuOpen(false)}
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
                    backgroundColor: "var(--color-taupe)", color: "var(--color-navy)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: "700", flexShrink: 0,
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
