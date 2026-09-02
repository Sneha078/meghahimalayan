import { useState } from "react";
import { Link } from "react-router-dom";
import { useRewards } from "../hooks/useRewards"; // adjust path to match where you place useRewards.js

/**
 * Usage in Navbar.jsx, between the Account block and the Cart Link:
 *   <CoinBadge scrolled={scrolled} />
 */
function CoinBadge({ scrolled }) {
  const { balance, cashValue, expiringSoon, expiringDate, loading } = useRewards();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  const expiringDays = expiringDate
    ? Math.ceil((new Date(expiringDate) - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-full border transition-all duration-300 ${
          scrolled ? "bg-gray-100 border-gray-200 text-[#0d1a2a]" : "bg-white/10 border-white/20 text-white"
        }`}
        style={{ padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
      >
        🪙 {balance.toLocaleString()}
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            width: "260px",
            backgroundColor: "#ffffff",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            boxShadow: "0 12px 40px rgba(13,32,49,0.12)",
            padding: "16px",
            zIndex: 100,
          }}
        >
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0d1a2a", margin: 0 }}>
            {balance.toLocaleString()} Coins
          </p>
          <p style={{ fontSize: "0.8rem", color: "#6b6862", margin: "2px 0 12px" }}>
            = Rs. {cashValue.toLocaleString()} rewards points
          </p>

          {expiringSoon > 0 && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "#b45309",
                backgroundColor: "#fef3c7",
                borderRadius: "6px",
                padding: "8px 10px",
                marginBottom: "12px",
              }}
            >
              ⏳ {expiringSoon.toLocaleString()} coins expiring{" "}
              {expiringDays <= 1 ? "tonight" : `in ${expiringDays} days`}.
            </p>
          )}

          <Link
            to="/rewards"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              textAlign: "center",
              backgroundColor: "#0d1a2a",
              color: "#f4f0eb",
              textDecoration: "none",
              borderRadius: "999px",
              padding: "9px 0",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            View Rewards
          </Link>
        </div>
      )}
    </div>
  );
}

export default CoinBadge;