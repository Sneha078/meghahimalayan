function PageBanner({ eyebrow, title }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-navy)",
        padding: "clamp(24px, 5vw, 48px) var(--section-px) clamp(20px, 4vw, 36px)",
      }}
    >
      <p
        style={{
          color: "var(--color-taupe)",
          fontSize: "0.72rem",
          fontWeight: "700",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        {eyebrow}
      </p>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          color: "#ffffff",
          fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
          fontWeight: "800",
        }}
      >
        {title}
      </h1>
    </div>
  );
}

export default PageBanner;