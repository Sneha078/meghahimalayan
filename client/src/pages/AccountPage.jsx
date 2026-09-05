import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRecentlyViewedIds } from "../utils/recentlyViewed";
import { getProductById } from "../api/productClient";

const QUICK_LINKS = [
  { to: "/orders", label: "My Orders" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/cart", label: "My Cart" },
];

const CUSTOMER_CARE_LINKS = [
  { to: "/shipping", label: "Shipping" },
  { to: "/returns", label: "Returns" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact Us" },
];

function AccountPage() {
  const { user } = useAuth();
  const [recentProducts, setRecentProducts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    if (!ids.length) {
      setLoadingRecent(false);
      return;
    }

    Promise.all(
      ids.map((id) =>
        getProductById(id).catch((err)=>{
          console.error(`Failed to load recently viewed product ${id}:`, err)
         return null})
      )
    )
      .then((results) => {

        setRecentProducts(results.filter(Boolean))
      })
      .finally(() => setLoadingRecent(false));
  }, []);

  return (
    <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "40px 24px 64px" }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-taupe)", marginBottom: "6px" }}>
        My Account
      </p>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 700, color: "#0d1a2a", marginBottom: "28px" }}>
        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
      </h1>

      {/* Quick-link cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              display: "block",
              textAlign: "center",
              padding: "20px 16px",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "#0d1a2a",
              fontSize: "0.9rem",
              fontWeight: 600,
              transition: "border-color 0.2s ease, background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-taupe)";
              e.currentTarget.style.backgroundColor = "rgba(165,152,135,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Rewards banner */}
      <Link
        to="/rewards"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 24px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #0d1a2a, #16324a)",
          textDecoration: "none",
          marginBottom: "48px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <p style={{ color: "#f4f0eb", fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            🪙 Mega Rewards
          </p>
          <p style={{ color: "rgba(244,240,235,0.65)", fontSize: "0.82rem", marginTop: "4px" }}>
            Manage your points and redeem rewards
          </p>
        </div>
        <span style={{ color: "var(--color-taupe)", fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap" }}>
          View Rewards →
        </span>
      </Link>

      {/* Recently viewed */}
      {(loadingRecent || recentProducts.length > 0) && (
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b6862", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
            Recently Viewed
          </h2>

          {loadingRecent ? (
            <p style={{ fontSize: "0.85rem", color: "#6b6862" }}>Loading…</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
              {recentProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "#f4f0eb", borderRadius: "8px", overflow: "hidden", marginBottom: "8px" }}>
                    {product.image?.[0]?.url ? (
                      <img src={product.image[0].url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain",
                        display:"block",
                        padding:"12px",
                        boxSizing: "border-box"
                       }} />
                    ):(
                      <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:"center",
                        color: "#999",
                        fontSize: "0.8rem",
                      }}> 
                      No image
                      </div>
              
                    )}
                  </div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0d1a2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {product.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer care */}
      <div>
        <h2 style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b6862", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
          Customer Care
        </h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {CUSTOMER_CARE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: "9px 18px",
                border: "1px solid var(--color-border)",
                borderRadius: "999px",
                textDecoration: "none",
                color: "#0d1a2a",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AccountPage;