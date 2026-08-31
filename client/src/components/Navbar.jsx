import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  const [highlightedIndex, setHightlightedIndex] = useState(-1)

  const searchContainerRef = useRef(null);
  const debounceRef = useRef(null);

  const navigate = useNavigate();

  // Handle navbar scroll state
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced autocomplete + product preview search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

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
        setHightlightedIndex(-1)
      } catch (error) {
        console.error("Search request failed:", error);

        setSuggestions([]);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue]);

  // Navigate to full search results
  const goToFullResults = () => {
    const query = searchValue.trim();

    if (!query) return;

    setDropdownOpen(false);

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // Handle keyboard actions
  const handleKeyDown = (e) => {
    const visibleResults = results.slice(0, 6)
    const combinedLength = suggestions.length + visibleResults.length
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!combinedLength) return
      setHightlightedIndex((prev) => (prev + 1) % combinedLength)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!combinedLength) return
      setHightlightedIndex((prev) => (prev -1 + combinedLength) % combinedLength)
    }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === -1) {

        goToFullResults();
      } else if (highlightedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[highlightedIndex])
      } else {
        const product = visibleResults[highlightedIndex - suggestions.length]
        if (product) handleResultSelect(product)
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  // Handle autocomplete suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion);
    setDropdownOpen(true);
  };

  // Handle product selection
  const handleResultSelect = (product) => {
    setDropdownOpen(false);

    const productId = product.id ?? product._id;

    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const showDropdown =
    dropdownOpen &&
    searchValue.trim().length >= SEARCH_MIN_CHARS;

  return (
    <nav
      className={`w-full px-10 sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-sm" : "bg-[#0d1a2a]"
      }`}
      style={{ padding: "20px 40px" }}
    >
      <div className="flex items-center justify-between gap-6">

        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link to="/">
            <span
              className={`font-heading font-bold text-xl tracking-widest select-none ${
                scrolled ? "text-[#0d1a2a]" : "text-[#C9A84C]"
              }`}
            >
              HΩH
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-opacity hover:opacity-70 ${
                scrolled ? "text-[#0d1a2a]" : "text-white"
              }`}
            >
              Home
            </Link>

            <Link
              to="/shop"
              className={`text-sm font-semibold transition-opacity hover:opacity-70 flex items-center gap-1 ${
                scrolled ? "text-[#0d1a2a]" : "text-white"
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

        {/* Search */}
        <div
          className="flex-1 max-w-md relative"
          ref={searchContainerRef}
        >
          <div
            className={`flex items-center gap-3 rounded-full border transition-all duration-300 ${
              scrolled
                ? "bg-gray-100 border-gray-200"
                : "bg-white/10 border-white/20"
            }`}
            style={{
              padding: "12px 20px",
              height: "48px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={
                scrolled ? "text-gray-400" : "text-white/50"
              }
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />

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
              onFocus={() => {
                if (
                  searchValue.trim().length >= SEARCH_MIN_CHARS
                ) {
                  setDropdownOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              className={`bg-transparent text-base outline-none w-full ${
                scrolled
                  ? "text-[#0d1a2a] placeholder-gray-400"
                  : "text-white placeholder-white/50"
              }`}
            />

            {searchValue && (
              <button
              type = "button"
              onClick={() => {
                setSearchValue("")
                setSuggestions([])
                setResults([])
                setDropdownOpen(false)
              }}
              aria-label="Clear search"
              className={`flex-shrink-0 ${scrolled ? "text-gray-400": "text-white/60"}`}
              style={{ background: "none", border: "none", cursor: "pointer", padding:0}} >
                
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              </button>
            )}
          </div>

          {/* Search dropdown */}
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

        {/* Right side */}
        <div className="flex items-center gap-5">

          {/* Wishlist */}
          <button
            className={`transition-opacity hover:opacity-70 ${
              scrolled ? "text-[#0d1a2a]" : "text-white"
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

          {/* Account */}
          <button
            className={`transition-opacity hover:opacity-70 ${
              scrolled ? "text-[#0d1a2a]" : "text-white"
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

          {/* Cart */}
          <Link
            to="/cart"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              scrolled
                ? "bg-[#0d1a2a] text-white border-[#0d1a2a] hover:bg-[#162436]"
                : "bg-transparent text-white border-white/25 hover:bg-white/5"
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
              />
            </svg>

            Cart
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

