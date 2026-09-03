import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRewards } from "../hooks/useRewards";
import { getMyOrders } from "../api/productClient";

const ORDER_STATUSES = [
  { label: "Processing", icon: "⏳" },
  { label: "Confirmed", icon: "✅" },
  { label: "Shipped", icon: "🚚" },
  { label: "Delivered", icon: "📦" },
  { label: "Cancelled", icon: "✕" },
];

function Account() {
  const { user, loading } = useAuth();
  const {
    balance,
    expiringSoon,
    expiringDate,
    loading: rewardsLoading,
  } = useRewards();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-gray-500">Loading your account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-semibold text-[#0d1a2a]">
          Please sign in
        </h1>

        <p className="mt-2 text-gray-500">Sign in to access your account.</p>

        <Link
          to="/login"
          className="mt-6 rounded-full bg-[#0d1a2a] px-7 py-3 text-sm font-semibold text-white"
          style={{ textDecoration: "none" }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  const expiringDays = expiringDate
    ? Math.ceil(
        (new Date(expiringDate) - Date.now()) / (24 * 60 * 60 * 1000)
      )
    : null;

  const statusCounts = ORDER_STATUSES.map((s) => ({
    ...s,
    count: orders.filter((o) => o.orderStatus === s.label).length,
  }));

  const services = [
    { label: "Customer Service", icon: "🎧", to: "/contact" },
    { label: "FAQ", icon: "❓", to: "/faq" },
    { label: "Shipping", icon: "🚚", to: "/shipping" },
    { label: "Policy", icon: "📄", to: "/returns" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f6f2] px-4 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Profile header */}
        <div className="flex items-center justify-between">
          <Link
            to="/account/profile"
            className="flex items-center gap-3"
            style={{ textDecoration: "none" }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0d1a2a] text-lg font-semibold text-white shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-lg font-semibold text-[#0d1a2a]">
                {user.name}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </Link>

          <Link
            to="/account/profile"
            aria-label="Account settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-[#0d1a2a] hover:border-gray-300 transition"
            style={{ textDecoration: "none" }}
          >
            ⚙️
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mt-5 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <Link
              to="/rewards"
              className="flex flex-col items-center justify-center py-5 hover:bg-gray-50 transition"
              style={{ textDecoration: "none" }}
            >
              <span className="text-xl font-semibold text-[#0d1a2a]">
                {rewardsLoading ? "—" : balance.toLocaleString()}
              </span>
              <span className="mt-1 text-xs text-gray-500">Coins</span>
            </Link>

            <Link
              to="/orders"
              className="flex flex-col items-center justify-center py-5 hover:bg-gray-50 transition"
              style={{ textDecoration: "none" }}
            >
              <span className="text-xl font-semibold text-[#0d1a2a]">
                {ordersLoading ? "—" : orders.length}
              </span>
              <span className="mt-1 text-xs text-gray-500">Orders</span>
            </Link>
          </div>

          {expiringSoon > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-amber-50 px-5 py-3">
              <p className="text-sm text-amber-800">
                ⏳ {expiringSoon.toLocaleString()} coins expiring{" "}
                {expiringDays <= 1 ? "tonight" : `in ${expiringDays} days`}
              </p>

              <Link
                to="/rewards"
                className="text-sm font-medium text-amber-800 underline shrink-0"
                style={{ textDecoration: "underline" }}
              >
                View
              </Link>
            </div>
          )}
        </div>

        {/* Order status row */}
        <div className="mt-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-base font-semibold text-[#0d1a2a]">
              My Orders
            </h2>

            <Link
              to="/orders"
              className="text-sm text-gray-500 hover:text-[#0d1a2a]"
              style={{ textDecoration: "none" }}
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-5 gap-2 px-5 py-5">
            {statusCounts.map((item) => (
              <Link
                key={item.label}
                to={`/orders?status=${item.label}`}
                className="relative flex flex-col items-center gap-2 rounded-xl py-2 hover:bg-gray-50 transition"
                style={{ textDecoration: "none" }}
              >
                <span className="relative text-2xl">
                  {item.icon}
                  {item.count > 0 && (
                    <span
                      className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: "var(--color-error)" }}
                    >
                      {item.count}
                    </span>
                  )}
                </span>
                <span className="text-xs font-medium text-gray-600 text-center">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Services row */}
        <div className="mt-5 rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-5">
          <h2 className="mb-4 text-base font-semibold text-[#0d1a2a]">
            Customer Care
          </h2>

          <div className="grid grid-cols-4 gap-2">
            {services.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex flex-col items-center gap-2 rounded-xl py-2 hover:bg-gray-50 transition"
                style={{ textDecoration: "none" }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium text-gray-600 text-center">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Account settings list */}
        <div className="mt-5 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
          <Link
            to="/account/profile"
            className="flex items-center justify-between border-b border-gray-100 px-5 py-4 hover:bg-gray-50 transition"
            style={{ textDecoration: "none" }}
          >
            <div>
              <h3 className="text-sm font-medium text-[#0d1a2a]">
                Personal Information
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Name, email and phone number
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            to="/account/addresses"
            className="flex items-center justify-between border-b border-gray-100 px-5 py-4 hover:bg-gray-50 transition"
            style={{ textDecoration: "none" }}
          >
            <div>
              <h3 className="text-sm font-medium text-[#0d1a2a]">
                Address Book
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage delivery addresses
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            to="/account/security"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
            style={{ textDecoration: "none" }}
          >
            <div>
              <h3 className="text-sm font-medium text-[#0d1a2a]">
                Password & Security
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Password and account security
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Account;