import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRewards } from "../hooks/useRewards";
import {
  getCatalog,
  redeemProduct,
  getHistory,
} from "../api/rewardsClient";

const HISTORY_TABS = [
  { key: "all", label: "All" },
  { key: "earn", label: "Earned" },
  { key: "redeem", label: "Used" },
  { key: "expire", label: "Expired" },
];

function RewardsPage() {
  const navigate = useNavigate();

  const {
    balance,
    cashValue,
    expiringSoon,
    expiringDate,
    loading: balanceLoading,
    refresh,
  } = useRewards();

  // Catalog state
  const [tiers, setTiers] = useState({});
  const [tierOrder, setTierOrder] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeTier, setActiveTier] = useState("all");
  const [redeeming, setRedeeming] = useState(null);

  // History state
  const [historyTab, setHistoryTab] = useState("all");
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ============================================================
  // LOAD REWARD CATALOG
  // ============================================================

  useEffect(() => {
    getCatalog()
      .then((data) => {
        console.log("REWARDS CATALOG:", data);
        console.log("REWARD TIERS:", data.tiers);
        console.log("TIER ORDER:", data.tierOrder);

        setTiers(data.tiers || {});

        setTierOrder(
          data.tierOrder || Object.keys(data.tiers || {})
        );
      })
      .catch((err) => {
        console.error("CATALOG ERROR:", err);
        setTiers({});
        setTierOrder([]);
      })
      .finally(() => {
        setCatalogLoading(false);
      });
  }, []);

  // ============================================================
  // LOAD REWARD HISTORY
  // ============================================================

  useEffect(() => {
    setHistoryLoading(true);

    getHistory(historyTab)
      .then((data) => {
        setHistoryEntries(data.entries || []);
      })
      .catch((err) => {
        console.error("HISTORY ERROR:", err);
        setHistoryEntries([]);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [historyTab]);

  // ============================================================
  // REDEEM
  // ============================================================

  const handleRedeem = async (productId) => {
    setRedeeming(productId);

    try {
      await redeemProduct(productId);
      await refresh();

      if (
        historyTab === "all" ||
        historyTab === "redeem"
      ) {
        getHistory(historyTab).then((data) =>
          setHistoryEntries(data.entries || [])
        );
      }

      alert(
        "Redeemed! Check your orders for fulfillment status."
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setRedeeming(null);
    }
  };

  // ============================================================
  // OPEN ORDER FROM REWARD HISTORY
  // ============================================================

  const handleOrderClick = (entry) => {
    if (!entry?.reason) return;

    /*
      Your history currently stores the order number inside
      entry.reason, for example:

      "Order #MH-1789028498100-1F5767A5"
    */

    const match = entry.reason.match(
      /Order\s+#([A-Za-z0-9-]+)/i
    );

    if (!match) return;

    const orderNumber = match[1];

    navigate(
      `/orders?orderNumber=${encodeURIComponent(
        orderNumber
      )}`
    );
  };

  // ============================================================
  // AVAILABLE TIERS
  // ============================================================

  const tierKeys = tierOrder.filter(
    (tier) =>
      Array.isArray(tiers[tier]) &&
      tiers[tier].length > 0
  );

  // ============================================================
  // VISIBLE TIERS
  // ============================================================

  const visibleTierKeys =
    activeTier === "all"
      ? tierKeys
      : tierKeys.filter(
          (tier) => tier === activeTier
        );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px) var(--section-px)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
          fontWeight: 700,
          color: "#0d1a2a",
          marginBottom: "24px",
        }}
      >
        Rewards for You
      </h1>

      {/* ========================================================
          BALANCE SHOWCASE
          ======================================================== */}

      <div
        style={{
          backgroundColor: "#0d1a2a",
          borderRadius: "14px",
          padding: "clamp(20px, 4vw, 32px)",
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        {balanceLoading ? (
          <p
            style={{
              color: "rgba(244,240,235,0.6)",
              fontSize: "0.85rem",
            }}
          >
            Loading…
          </p>
        ) : (
          <>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--color-taupe)",
                marginBottom: "8px",
              }}
            >
              Your Balance
            </p>

            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
                fontWeight: 700,
                color: "#f4f0eb",
                margin: 0,
              }}
            >
              {Number(
                balance || 0
              ).toLocaleString()}{" "}
              Coins
            </p>

            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(244,240,235,0.6)",
                marginTop: "4px",
              }}
            >
              = Rs.{" "}
              {Number(
                cashValue || 0
              ).toLocaleString()}{" "}
              rewards points
            </p>
          </>
        )}
      </div>

      {/* Expiring points */}

      {expiringSoon > 0 && (
        <p
          style={{
            fontSize: "0.82rem",
            color: "#b45309",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "32px",
          }}
        >
          ⏳{" "}
          {expiringSoon.toLocaleString()} coins
          expiring{" "}
          {expiringDate
            ? `on ${new Date(
                expiringDate
              ).toLocaleDateString()}`
            : "soon"}
          .
        </p>
      )}

      {/* ========================================================
          HISTORY
          ======================================================== */}

      <div
        style={{
          marginBottom: "40px",
        }}
      >
        {/* History tabs */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          {HISTORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setHistoryTab(tab.key)
              }
              style={{
                padding: "7px 16px",
                borderRadius: "999px",
                border: `1px solid ${
                  historyTab === tab.key
                    ? "#0d1a2a"
                    : "var(--color-border)"
                }`,
                backgroundColor:
                  historyTab === tab.key
                    ? "#0d1a2a"
                    : "transparent",
                color:
                  historyTab === tab.key
                    ? "#f4f0eb"
                    : "#0d1a2a",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* History list */}

        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {historyLoading ? (
            <p
              style={{
                padding: "20px",
                fontSize: "0.85rem",
                color: "#6b6862",
                margin: 0,
              }}
            >
              Loading…
            </p>
          ) : historyEntries.length === 0 ? (
            <p
              style={{
                padding: "20px",
                fontSize: "0.85rem",
                color: "#6b6862",
                margin: 0,
              }}
            >
              No activity here yet.
            </p>
          ) : (
            historyEntries.map((entry, i) => {
              const isOrderEntry =
                /^Order\s+#/i.test(
                  entry.reason || ""
                );

              return (
                <div
                  key={entry._id}
                  onClick={() => {
                    if (isOrderEntry) {
                      handleOrderClick(entry);
                    }
                  }}
                  role={
                    isOrderEntry
                      ? "button"
                      : undefined
                  }
                  tabIndex={
                    isOrderEntry ? 0 : undefined
                  }
                  onKeyDown={(e) => {
                    if (
                      !isOrderEntry
                    ) {
                      return;
                    }

                    if (
                      e.key === "Enter" ||
                      e.key === " "
                    ) {
                      e.preventDefault();
                      handleOrderClick(entry);
                    }
                  }}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderTop:
                      i > 0
                        ? "1px solid var(--color-border)"
                        : "none",
                    cursor: isOrderEntry
                      ? "pointer"
                      : "default",
                    transition:
                      "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (isOrderEntry) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(165, 152, 135, 0.10)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "transparent";
                  }}
                >
                  {/* Left side */}

                  <div>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#0d1a2a",
                        margin: 0,
                      }}
                    >
                      {entry.reason}
                    </p>

                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b6862",
                        marginTop: "2px",
                      }}
                    >
                      {new Date(
                        entry.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Right side */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color:
                          entry.amount > 0
                            ? "#16a34a"
                            : "#dc2626",
                        margin: 0,
                      }}
                    >
                      {entry.amount > 0
                        ? "+"
                        : ""}
                      {Number(
                        entry.amount || 0
                      ).toLocaleString()}
                    </p>

                    {isOrderEntry && (
                      <span
                        style={{
                          fontSize: "1rem",
                          color: "#a59887",
                        }}
                      >
                        →
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          REDEEM REWARDS
          ======================================================== */}

      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.3rem",
          fontWeight: 700,
          color: "#0d1a2a",
          marginBottom: "16px",
        }}
      >
        Redeem Rewards
      </h2>

      {/* Tier filter buttons */}

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() =>
            setActiveTier("all")
          }
          style={{
            padding: "7px 16px",
            borderRadius: "999px",
            border: `1px solid ${
              activeTier === "all"
                ? "var(--color-taupe)"
                : "var(--color-border)"
            }`,
            backgroundColor:
              activeTier === "all"
                ? "rgba(165,152,135,0.15)"
                : "transparent",
            color: "#0d1a2a",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          All
        </button>

        {tierKeys.map((tier) => (
          <button
            key={tier}
            onClick={() =>
              setActiveTier(tier)
            }
            style={{
              padding: "7px 16px",
              borderRadius: "999px",
              border: `1px solid ${
                activeTier === tier
                  ? "var(--color-taupe)"
                  : "var(--color-border)"
              }`,
              backgroundColor:
                activeTier === tier
                  ? "rgba(165,152,135,0.15)"
                  : "transparent",
              color: "#0d1a2a",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tier} points
          </button>
        ))}
      </div>

      {/* ========================================================
          PRODUCT GRID
          ======================================================== */}

      {catalogLoading ? (
        <p
          style={{
            textAlign: "center",
            color: "#6b6862",
            padding: "2rem 0",
          }}
        >
          Loading rewards…
        </p>
      ) : tierKeys.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            color: "#6b6862",
            padding: "2rem 0",
          }}
        >
          No rewards available right now - check back soon.
        </p>
      ) : (
        visibleTierKeys.map(
          (tierPoints) => (
            <div
              key={tierPoints}
              style={{
                marginBottom: "36px",
              }}
            >
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#0d1a2a",
                  marginBottom: "14px",
                }}
              >
                {tierPoints} Points
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "16px",
                }}
              >
                {tiers[tierPoints].map(
                  (product) => {
                    const canAfford =
                      Number(balance || 0) >=
                      Number(
                        product.pointsCost || 0
                      );

                    return (
                      <div
                        key={product._id}
                        style={{
                          border:
                            "1px solid var(--color-border)",
                          borderRadius: "10px",
                          overflow: "hidden",
                          backgroundColor:
                            "#fff",
                          display: "flex",
                          flexDirection:
                            "column",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "1/1",
                            backgroundColor:
                              "#f4f0eb",
                            overflow:
                              "hidden",
                            position:
                              "relative",
                          }}
                        >
                          {product.image?.[0]
                            ?.url && (
                            <img
                              src={
                                product
                                  .image[0]
                                  .url
                              }
                              alt={
                                product.name
                              }
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                                objectFit:
                                  "contain",
                                padding:
                                  "10px",
                                display:
                                  "block",
                                transition:
                                  "transform 0.35s ease",
                              }}
                            />
                          )}
                        </div>

                        <div
                          style={{
                            padding: "12px",
                            flex: 1,
                            display:
                              "flex",
                            flexDirection:
                              "column",
                          }}
                        >
                          <p
                            style={{
                              fontSize:
                                "0.82rem",
                              fontWeight: 600,
                              color:
                                "#0d1a2a",
                              marginBottom:
                                "4px",
                            }}
                          >
                            {product.name}
                          </p>

                          <p
                            style={{
                              fontSize:
                                "0.78rem",
                              color:
                                "var(--color-taupe)",
                              fontWeight: 700,
                              marginBottom:
                                "10px",
                            }}
                          >
                            {Number(
                              product.pointsCost ||
                                0
                            ).toLocaleString()}{" "}
                            points
                          </p>

                          <button
                            onClick={() =>
                              handleRedeem(
                                product._id
                              )
                            }
                            disabled={
                              !canAfford ||
                              redeeming ===
                                product._id
                            }
                            style={{
                              marginTop:
                                "auto",
                              backgroundColor:
                                canAfford
                                  ? "#0d1a2a"
                                  : "#e5e2dc",
                              color:
                                canAfford
                                  ? "#f4f0eb"
                                  : "#a59887",
                              border:
                                "none",
                              borderRadius:
                                "999px",
                              padding:
                                "8px 0",
                              fontSize:
                                "0.75rem",
                              fontWeight: 600,
                              cursor:
                                canAfford
                                  ? "pointer"
                                  : "not-allowed",
                            }}
                          >
                            {redeeming ===
                            product._id
                              ? "Redeeming…"
                              : canAfford
                              ? "Redeem"
                              : "Not enough coins"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )
        )
      )}
    </section>
  );
}

export default RewardsPage;