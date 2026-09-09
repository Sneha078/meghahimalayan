import SearchResultRow from "./SearchResultRow";

function SearchDropdown({
  query,
  suggestions = [],
  results = [],
  loading = false,
  highlightedIndex = -1,
  onSuggestionClick,
  onResultSelect,
  onViewAll,
}) {
  if (!query.trim()) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 12px 32px rgba(13,32,49,0.18)",
        padding: "6px",
        zIndex: 60,
      }}
    >
      {loading && (
        <p
          style={{
            padding: "10px 8px",
            fontSize: "0.8rem",
            color: "#6b7280",
            margin: 0,
          }}
        >
          Searching...
        </p>
      )}

      {!loading && suggestions.length > 0 && (
        <div
          style={{
            paddingBottom: "4px",
            marginBottom: results.length > 0 ? "4px" : 0,
            borderBottom:
              results.length > 0 ? "1px solid #f0f0f0" : "none",
          }}
        >
          <p
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#9ca3af",
              textTransform: "uppercase",
              margin: "4px 8px 2px",
            }}
          >
            Suggestions
          </p>

          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              onClick={() => onSuggestionClick?.(suggestion)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "8px",
                background: index === highlightedIndex ? "#f7f5f0" : "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7f5f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0, opacity: 0.45 }}
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="#0d2031"
                  strokeWidth="2"
                />
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="#0d2031"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#0d2031",
                  fontWeight: 500,
                }}
              >
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#9ca3af",
              textTransform: "uppercase",
              margin: "4px 8px 4px",
            }}
          >
            Products
          </p>

          {results.slice(0, 6).map((product, index) => (
            <SearchResultRow
              key={product.id ?? product._id}
              product={product}
              isHighlighted={suggestions.length + index === highlightedIndex}
              onSelect={() => onResultSelect?.(product)}
            />
          ))}

          <button
            type="button"
            onClick={onViewAll}
            style={{
              width: "100%",
              textAlign: "center",
              padding: "8px",
              marginTop: "4px",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#0d2031",
              background: "none",
              border: "none",
              borderTop: "1px solid #eee",
              cursor: "pointer",
            }}
          >
            View all results for "{query.trim()}" →
          </button>
        </div>
      )}

      {!loading &&
        suggestions.length === 0 &&
        results.length === 0 && (
          <p
            style={{
              padding: "10px 8px",
              fontSize: "0.8rem",
              color: "#6b7280",
              margin: 0,
            }}
          >
            No matches found.
          </p>
        )}
    </div>
  );
}

export default SearchDropdown;

