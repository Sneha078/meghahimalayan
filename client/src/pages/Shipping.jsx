import PageBanner from "../components/PageBanner";

const SHIPPING_INFO = [
  {
    title: "Standard Delivery",
    detail: "3–5 business days · Rs. 150 flat rate, free on orders over Rs. 5,000",
  },
  {
    title: "Express Delivery",
    detail: "1–2 business days within Kathmandu Valley · Rs. 350",
  },
  {
    title: "Order Processing",
    detail: "Orders are processed within 24 hours on business days. You'll receive a confirmation email once your order ships.",
  },
  {
    title: "Tracking",
    detail: "A tracking link is sent to your email as soon as your order is shipped. You can also check status under My Orders.",
  },
];

function Shipping() {
  return (
    <div style={{ backgroundColor: "var(--color-sbg)", minHeight: "100vh" }}>
      <PageBanner eyebrow="Customer Care" title="Shipping Information" />

      <div style={{ padding: "40px 5rem", maxWidth: "800px" }}>
        <p style={{ color: "var(--color-muted)", fontSize: "0.92rem", marginBottom: "32px" }}>
          Placeholder policy — replace with your actual shipping terms.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {SHIPPING_INFO.map((item) => (
            <div
              key={item.title}
              style={{
                backgroundColor: "var(--color-white)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                padding: "20px 24px",
              }}
            >
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  color: "var(--color-navy)",
                  marginBottom: "6px",
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", lineHeight: "1.6" }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Shipping;