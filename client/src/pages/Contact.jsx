import { useState } from "react";
import PageBanner from "../components/PageBanner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // ASSUMPTION: endpoint is POST /api/v1/contact, paired with the
      // AdminMessages.jsx admin view. If your route is named differently
      // (e.g. /messages), change this one URL.
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",   // sends cookie so logged-in user is linked to the message
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send message");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    fontSize: "0.88rem",
    fontFamily: "var(--font-sans)",
    outline: "none",
  };

  return (
    <div style={{ backgroundColor: "var(--color-sbg)", minHeight: "100vh" }}>
      <PageBanner eyebrow="Customer Care" title="Contact Us" />

      <div style={{ padding: "40px 5rem", maxWidth: "700px" }}>
        <p style={{ color: "var(--color-muted)", fontSize: "0.92rem", marginBottom: "28px" }}>
          Have a question about an order, product, or your account? Send us a message and we'll get back to you within 1–2 business days.
        </p>

        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            padding: "28px",
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-navy)", marginBottom: "8px" }}>
                Message sent
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
                We'll get back to you at {form.email} soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {error && (
                <p style={{ fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
              )}

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px", display: "block" }}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px", display: "block" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px", display: "block" }}>
                  Phone <span style={{ fontWeight: "400", color: "var(--color-muted)" }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+977 98XXXXXXXX"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px", display: "block" }}>
                  Subject
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  style={{
                    ...inputStyle,
                    backgroundColor: "var(--color-white)",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b6862' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: "36px",
                  }}
                >
                  <option value="" disabled>Select a subject…</option>
                  <option value="Product Inquiry">Product Inquiry</option>
                  <option value="Return & Refund">Return &amp; Refund</option>
                  <option value="Wholesale / Bulk Order">Wholesale / Bulk Order</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-navy)", marginBottom: "6px", display: "block" }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  alignSelf: "flex-start",
                  padding: "11px 28px",
                  backgroundColor: submitting ? "#e5e7eb" : "var(--color-navy)",
                  color: submitting ? "#9ca3af" : "var(--color-taupe)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "SENDING…" : "SEND MESSAGE"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contact;