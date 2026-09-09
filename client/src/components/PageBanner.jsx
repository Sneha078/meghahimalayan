function PageBanner({ eyebrow, title }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-navy)",
        padding: "48px 5rem 36px",
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
          fontSize: "2.4rem",
          fontWeight: "800",
        }}
      >
        {title}
      </h1>
    </div>
  );
}

export default PageBanner;