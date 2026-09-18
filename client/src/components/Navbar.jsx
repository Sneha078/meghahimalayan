import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import logo from "../assets/hoh_logo.png";
import SearchDropdown from "./SearchDropdown";
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
  const [accountOpen, setAccountOpen] = useState(false);
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
    setAccountOpen(false);
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

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountOpen && !e.target.closest("[data-account-menu]")) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountOpen]);

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
        style={{ padding: "clamp(12px, 2.5vw, 20px) clamp(16px, 4vw, 40px)" }}
      >
        <div className="flex items-center justify-between gap-3 md:gap-6">

          {/* Left: Logo + Nav links */}
          <div className="flex items-center gap-4 md:gap-8 shrink-0">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              style={{ background: "none", border: "none", cursor: "pointer", color: textColor, padding: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link to="/" style={{ textDecoration: "none" }}>
              <img src={logo} alt="Mega Himalaya" style={{ height: "clamp(32px, 4vw, 48px)", width: "auto", objectFit: "contain" }} />
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" style={{ color: textColor, textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Home
              </Link>
              <Link to="/shop" style={{ color: textColor, textDecoration: "none", fontSize: "0.875rem", fontWeight: "600", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Products
              </Link>
            </div>
          </div>

          {/* Center: Search (desktop only) */}
          <div className="hidden md:block flex-1 max-w-md relative" ref={searchContainerRef}>
            <div className={`flex items-center gap-3 rounded-full border transition-all duration-300 ${
              scrolled ? "bg-gray-100 border-gray-200" : "bg-white/10 border-white/20"
            }`} style={{ padding: "12px 20px", height: "48px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={scrolled ? "text-gray-400" : "text-white/50"}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text" placeholder="Search products, brands..."
                value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => { if (searchValue.trim().length >= SEARCH_MIN_CHARS) setDropdownOpen(true); }}
                onKeyDown={handleKeyDown}
                className={`bg-transparent text-base outline-none w-full ${
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
          <div className="flex items-center gap-3 md:gap-5">

            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden"
              aria-label="Search products"
              style={{ color: textColor, background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" style={{ position: "relative", color: textColor, lineHeight: 0 }} aria-label="Wishlist">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {totalWishlisted > 0 && (
                <span style={{
                  backgroundColor: "#e74c3c", color: "#ffffff", fontSize: "0.65rem", fontWeight: "700",
                  width: "18px", height: "18px", borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", position: "absolute", top: "-6px", right: "-6px",
                }}>
                  {totalWishlisted}
                </span>
              )}
            </Link>

            {/* Account */}
            <div style={{ position: "relative" }} data-account-menu>
              {user ? (
                <div>
                  <button onClick={() => setAccountOpen((prev) => !prev)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: textColor }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      backgroundColor: "var(--color-taupe)", color: "var(--color-navy)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.82rem", fontWeight: "700",
                    }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:inline" style={{ fontSize: "0.82rem", fontWeight: "600", color: textColor, maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name?.split(" ")[0]}
                    </span>
                  </button>
                  {accountOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 12px)", right: 0,
                      backgroundColor: "#ffffff", border: "1px solid var(--color-border)",
                      borderRadius: "12px", boxShadow: "0 12px 40px rgba(13,32,49,0.12)",
                      minWidth: "200px", zIndex: 100, overflow: "hidden",
                    }}>
                      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--color-border)" }}>
                        <p style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "2px" }}>{user.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                      </div>
                      <div style={{ padding: "8px 0" }}>
                        <Link to="/orders" onClick={() => setAccountOpen(false)} style={dropdownItemStyle}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-sbg)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                          My Orders
                        </Link>
                        <button onClick={handleLogout}
                          style={{ ...dropdownItemStyle, width: "100%", textAlign: "left", border: "none", cursor: "pointer", borderTop: "1px solid var(--color-border)", color: "#dc2626", marginTop: "4px" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className={`transition-opacity hover:opacity-70 ${scrolled ? "text-[#0d1a2a]" : "text-white"}`} aria-label="Account">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="flex items-center gap-1.5 relative" style={{
              padding: "9px 12px", borderRadius: "8px",
              backgroundColor: scrolled ? "var(--color-navy)" : "transparent",
              border: scrolled ? "none" : "1px solid rgba(255,255,255,0.3)",
              color: "var(--color-white)", fontSize: "0.875rem", fontWeight: "500",
              textDecoration: "none", transition: "all 0.3s ease",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="hidden md:inline">Cart</span>
              {totalItems > 0 && (
                <span style={{
                  backgroundColor: "var(--color-error)", color: "#ffffff", fontSize: "0.65rem", fontWeight: "700",
                  width: "18px", height: "18px", borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", position: "absolute", top: "-6px", right: "-6px",
                }}>
                  {totalItems}
                </span>
              )}
            </Link>
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
          <div className="relative w-[85%] max-w-xs bg-[#0d2031] text-white shadow-2xl flex flex-col h-full z-10 overflow-y-auto">

            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
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

            {/* Search in drawer */}
            <div className="px-5 pt-4 pb-2">
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setMobileSearchOpen(true); }}
                className="w-full flex items-center gap-3 rounded-lg bg-white/10 border border-white/10 text-left"
                style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-50">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Search products...
              </button>
            </div>

            {/* User */}
            <div className="p-5 bg-white/5 border-b border-white/10">
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
            <div className="p-5 flex-1 space-y-1">
              {[
                { to: "/", label: "Home" },
                { to: "/shop", label: "All Products" },
                { to: "/shop?category=eyeglasses", label: "Eyeglasses" },
                { to: "/shop?category=watches", label: "Watches" },
                { to: "/shop?category=perfumes", label: "Perfumes" },
                { to: "/cart", label: "My Cart" },
                { to: "/wishlist", label: "Wishlist" },
                { to: "/orders", label: "My Orders" },
                { to: "/account", label: "My Account" },
              ].map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm hover:bg-white/10 transition-colors"
                  style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Footer */}
            {user && (
              <div className="p-5 border-t border-white/10">
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

const dropdownItemStyle = {
  display: "block", padding: "10px 18px", fontSize: "0.85rem", fontWeight: "500",
  color: "var(--color-navy)", textDecoration: "none", backgroundColor: "transparent",
  transition: "background-color 0.15s ease",
};

export default Navbar;
