import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRecentlyViewedIds } from "../utils/recentlyViewed";
import { getProductById } from "../api/productClient";
import ProfileEditModal from "../components/ProfileEditModal";
import BusinessSettingsModal from "../components/BusinessSettingsModal";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentProducts, setRecentProducts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showBusinessSettings, setShowBusinessSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

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
      {/* Success Message */}
      {successMessage && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          marginBottom: '20px',
        }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-taupe)", marginBottom: "6px" }}>
            My Account
          </p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 700, color: "#0d1a2a" }}>
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Update Profile Button */}
          <button
            onClick={() => setShowProfileEdit(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'var(--color-navy)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--color-white)',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {/* Edit icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Update Information
          </button>

          {/* Business Settings Button (Admin only) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowBusinessSettings(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-taupe)',
                borderRadius: '8px',
                color: 'var(--color-taupe)',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-taupe)';
                e.currentTarget.style.color = 'var(--color-white)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-taupe)';
              }}
            >
              {/* Settings icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Business Settings
            </button>
          )}

          {/* Sign out button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'transparent',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* Sign out icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

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
      
      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        onSuccess={handleSuccessMessage}
      />

      {/* Business Settings Modal (Admin only) */}
      {user?.role === 'admin' && (
        <BusinessSettingsModal
          isOpen={showBusinessSettings}
          onClose={() => setShowBusinessSettings(false)}
          onSuccess={handleSuccessMessage}
        />
      )}
    </section>
  );
}

export default AccountPage;