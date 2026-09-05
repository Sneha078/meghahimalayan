import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner";

const RETURN_STEPS = [
  "Go to My Orders and select the item you'd like to return.",
  "Choose a reason and confirm your return request.",
  "Pack the item in its original packaging with tags attached.",
  "Drop it off at any partner courier point, or schedule a pickup.",
  "Refunds are issued within 5–7 business days of us receiving the item.",
];

function Returns() {
  return (
    <div style={{ backgroundColor: "var(--color-sbg)", minHeight: "100vh" }}>
      <PageBanner eyebrow="Customer Care" title="Returns & Refunds" />

      <div style={{ padding: "40px 5rem", maxWidth: "800px" }}>
        <p style={{ color: "var(--color-muted)", fontSize: "0.92rem", marginBottom: "32px" }}>
          Placeholder policy - replace with your actual return conditions.
        </p>

        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            padding: "28px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "18px" }}>
            How to return an item
          </h2>

          <ol style={{ display: "flex", flexDirection: "column", gap: "14px", paddingLeft: "20px" }}>
            {RETURN_STEPS.map((step, i) => (
              <li key={i} style={{ fontSize: "0.88rem", color: "var(--color-muted)", lineHeight: "1.6" }}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div
          style={{
            backgroundColor: "#fef9c3",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "18px 22px",
            fontSize: "0.85rem",
            color: "#854d0e",
          }}
        >
          Items must be returned within 14 days of delivery. Final sale items are not eligible for return.
        </div>

        <Link
          to="/orders"
          style={{
            display: "inline-block",
            marginTop: "24px",
            padding: "11px 28px",
            backgroundColor: "var(--color-navy)",
            color: "var(--color-taupe)",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "0.82rem",
            fontWeight: "700",
            letterSpacing: "0.1em",
          }}
        >
          START A RETURN
        </Link>
      </div>
    </div>
  );
}

export default Returns;