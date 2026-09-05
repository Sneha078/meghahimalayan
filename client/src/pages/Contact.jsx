import { useState } from "react";
import PageBanner from "../components/PageBanner";

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire to a real contact endpoint once one exists
    setSubmitted(true);
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
                style={{
                  alignSelf: "flex-start",
                  padding: "11px 28px",
                  backgroundColor: "var(--color-navy)",
                  color: "var(--color-taupe)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                SEND MESSAGE
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contact;