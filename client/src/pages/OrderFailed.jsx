import { Link } from "react-router-dom";

// paymentController.js redirects here (FRONTEND_URL/order-failed) whenever
// eSewa/Khalti verification fails, the signature check fails, or a bank
// transfer is rejected. There's no orderId query param guaranteed on this
// route, so this page stays generic rather than trying to look up an order.
function OrderFailed() {
  return (
    <div
      style={{
        backgroundColor: "var(--color-sbg)",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(24px, 5vw, 80px) var(--section-px)",
      }}
    >
      <div style={{ fontSize: "4rem", marginBottom: "24px" }}>⚠️</div>

      <p
        style={{
          color: "var(--color-error, #dc2626)",
          fontSize: "0.72rem",
          fontWeight: "700",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        PAYMENT UNSUCCESSFUL
      </p>

      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "2rem",
          fontWeight: "700",
          color: "var(--color-navy)",
          marginBottom: "12px",
        }}
      >
        We couldn't complete your payment
      </h2>

      <p
        style={{
          color: "var(--color-muted)",
          marginBottom: "8px",
          maxWidth: "480px",
        }}
      >
        Your payment wasn't confirmed, so the order wasn't placed and any
        stock or coupon reserved for it has been released.
      </p>

      <p
        style={{
          color: "var(--color-muted)",
          marginBottom: "32px",
          maxWidth: "480px",
        }}
      >
        You haven't been charged. You can try again, or choose Cash on
        Delivery instead.
      </p>

      {/*
        Wraps on narrow screens — three full-width-ish buttons in a single
        non-wrapping row would overflow on mobile.
      */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/*
          The gateway never confirmed, so the order was never created and
          the cart was deliberately left intact (see Checkout.jsx) — the
          items are still there to review before trying again.
        */}
        <Link
          to="/cart"
          style={{
            backgroundColor: "var(--color-navy)",
            color: "var(--color-taupe)",
            padding: "13px 32px",
            fontSize: "0.82rem",
            fontWeight: "700",
            letterSpacing: "0.12em",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          BACK TO CART
        </Link>

        <Link
          to="/checkout"
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--color-navy)",
            color: "var(--color-navy)",
            padding: "13px 32px",
            fontSize: "0.82rem",
            fontWeight: "700",
            letterSpacing: "0.12em",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          TRY AGAIN
        </Link>

        <Link
          to="/shop"
          style={{
            backgroundColor: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-navy)",
            padding: "13px 32px",
            fontSize: "0.82rem",
            fontWeight: "700",
            letterSpacing: "0.12em",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  );
}

export default OrderFailed;