import { useState } from "react";
import { Link } from "react-router-dom";
import { useRewards } from "../hooks/useRewards";

function CoinBadge({ scrolled }) {
  const [open, setOpen] = useState(false);

  const {
    balance,
    cashValue,
    expiringSoon,
    expiringDate,
    loading,
  } = useRewards();

  if (loading) return null;

  const expiringDays = expiringDate
    ? Math.ceil(
        (new Date(expiringDate) - Date.now()) /
          (24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div
      style={{ position: "relative" }}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Coin badge */}
      <Link
        to="/rewards"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-full border transition-all duration-300 ${
          scrolled
            ? "bg-gray-100 border-gray-200 text-[#0d1a2a]"
            : "bg-white/10 border-white/20 text-white"
        }`}
        style={{
          padding: "8px 16px",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        🪙 {balance.toLocaleString()}
      </Link>

      {/* Expiring coins popover */}
      {open && expiringSoon > 0 && (
        <p
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "220px",
            fontSize: "0.78rem",
            color: "#b45309",
            backgroundColor: "#fef3c7",
            borderRadius: "6px",
            padding: "8px 10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 10,
          }}
        >
          ⏳ {expiringSoon.toLocaleString()} coins expiring{" "}
          {expiringDays <= 1 ? "tonight" : `in ${expiringDays} days`}.
        </p>
      )}
    </div>
  );
}

export default CoinBadge;