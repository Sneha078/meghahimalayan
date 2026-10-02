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
      className="relative shrink-0 grow-0 w-fit"
      onMouseLeave={() => setOpen(false)}
    >
           {/* Coin badge */}
      <Link
        to="/rewards"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center justify-center rounded-full transition-all duration-300 h-7 px-2 gap-1 lg:h-8 lg:gap-1.5 lg:px-3"
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
          color: "#0d1a2a",
          backgroundColor: scrolled ? "#f3f4f6" : "#ffffff",
          border: scrolled
            ? "1px solid #e5e7eb"
            : "1px solid rgba(255,255,255,0.9)",
          boxShadow: scrolled ? "none" : "0 1px 4px rgba(0,0,0,0.25)",
        }}
      >
        🪙 <span>{balance.toLocaleString()}</span>
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