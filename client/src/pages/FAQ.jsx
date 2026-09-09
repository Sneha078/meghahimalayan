import { useState } from "react";
import PageBanner from "../components/PageBanner";

const FAQ_ITEMS = [
  {
    q: "How long does delivery take?",
    a: "Standard delivery takes 3–5 business days. Express delivery within Pokhara Valley takes 1–2 business days.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept eSewa, Khalti, major debit/credit cards, and cash on delivery for selected locations.",
  },
  {
    q: "Can I cancel my order?",
    a: "Orders can be cancelled from My Orders as long as they're still in Processing or Confirmed status.",
  },
  {
    q: "How do I earn Mega Rewards coins?",
    a: "You earn coins automatically on every completed purchase. Coins can be redeemed toward future orders.",
  },
  {
    q: "Do you ship outside the Pokhara Valley?",
    a: "Yes, we deliver nationwide. Delivery times outside the valley may take 1–2 extra business days.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div style={{ backgroundColor: "var(--color-sbg)", minHeight: "100vh" }}>
      <PageBanner eyebrow="Customer Care" title="Frequently Asked Questions" />

      <div style={{ padding: "40px 5rem", maxWidth: "800px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={item.q}
                style={{
                  backgroundColor: "var(--color-white)",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 22px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-navy)" }}>
                    {item.q}
                  </span>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      color: "var(--color-muted)",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div style={{ padding: "0 22px 18px" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", lineHeight: "1.6" }}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FAQ;