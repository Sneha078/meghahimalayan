import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/productClient";


const STEPS = ["Delivery", "Payment", "Review"];

function Checkout() {
  const { cartItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
  });

  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const shipping = subtotal >= 5000 ? 0 : 200;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!form.province.trim()) {
      newErrors.province = "Province is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0 && !validateStep1()) {
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

const [orderLoading, setOrderLoading] = useState(false)
const [orderError, setOrderError] = useState('')

const handlePlaceOrder = async ()=> {
  setOrderLoading(true)
  setOrderError('')

  try{
    const orderData = {
      shippingInfo: {
        name: form.fullName,
        address: form.address,
        city: form.city,
        state: form.province,
        pinCode: '00000',
        phoneNo: form.phone,
        country: 'Nepal',
      },
      orderItems: cartItems.map((item) => ({
        product: item._id ?? item.id,
        quantity: item.quantity,
      })),
      paymentInfo: {
        method: 'COD',
        status: 'Pending',
      },
      taxPrice: 0,
    }
    await createOrder(orderData)
    clearCart()
    navigate('/order-confirmation')
  }
  catch(err) {
    setOrderError(err.message)
    setOrderLoading(false)
  }
}

  // Empty cart
  if (cartItems.length === 0 && currentStep !== 2) {
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
          padding: "80px 5rem",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "24px" }}>🛒</div>

        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "2rem",
            fontWeight: "700",
            color: "var(--color-navy)",
            marginBottom: "12px",
          }}
        >
          Your cart is empty
        </h2>

        <p
          style={{
            color: "var(--color-muted)",
            marginBottom: "32px",
          }}
        >
          Add some products before checking out.
        </p>

        <Link
          to="/shop"
          style={{
            backgroundColor: "var(--color-navy)",
            color: "var(--color-taupe)",
            padding: "13px 32px",
            fontSize: "0.82rem",
            fontWeight: "700",
            letterSpacing: "0.12em",
            textDecoration: "none",
          }}
        >
          SHOP NOW
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--color-sbg)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
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
          ALMOST THERE
        </p>

        <h1
          style={{
            fontFamily: "var(--font-serif)",
            color: "#ffffff",
            fontSize: "2.8rem",
            fontWeight: "800",
            marginBottom: "32px",
          }}
        >
          Checkout
        </h1>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
          }}
        >
          {STEPS.map((step, index) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor:
                      index <= currentStep
                        ? "var(--color-taupe)"
                        : "rgba(255,255,255,0.15)",
                    color:
                      index <= currentStep
                        ? "var(--color-navy)"
                        : "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    transition: "all 0.3s ease",
                  }}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>

                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: index === currentStep ? "600" : "400",
                    color:
                      index <= currentStep
                        ? "#ffffff"
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {step}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  style={{
                    width: "60px",
                    height: "1px",
                    backgroundColor:
                      index < currentStep
                        ? "var(--color-taupe)"
                        : "rgba(255,255,255,0.15)",
                    margin: "0 16px",
                    transition: "background-color 0.3s ease",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "32px",
          padding: "40px 5rem",
          alignItems: "flex-start",
        }}
      >
        {/* Left Section */}
        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "16px",
            padding: "36px",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* STEP 1 - DELIVERY */}
          {currentStep === 0 && (
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.4rem",
                  fontWeight: "700",
                  color: "var(--color-navy)",
                  marginBottom: "28px",
                }}
              >
                Delivery Information
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                {/* Full Name */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Full Name</label>

                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Type name"
                    style={inputStyle(errors.fullName)}
                  />

                  {errors.fullName && (
                    <p style={errorStyle}>{errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>Phone Number</label>

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    style={inputStyle(errors.phone)}
                  />

                  {errors.phone && (
                    <p style={errorStyle}>{errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email Address</label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="input your email id"
                    style={inputStyle(errors.email)}
                  />

                  {errors.email && (
                    <p style={errorStyle}>{errors.email}</p>
                  )}
                </div>

                {/* Address */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Street Address</label>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Type your address"
                    style={inputStyle(errors.address)}
                  />

                  {errors.address && (
                    <p style={errorStyle}>{errors.address}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label style={labelStyle}>City</label>

                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Type your city"
                    style={inputStyle(errors.city)}
                  />

                  {errors.city && (
                    <p style={errorStyle}>{errors.city}</p>
                  )}
                </div>

                {/* Province */}
                <div>
                  <label style={labelStyle}>Province</label>

                  <select
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    style={inputStyle(errors.province)}
                  >
                    <option value="">Select Province</option>
                    <option value="gandaki">Gandaki Pradesh</option>
                    <option value="bagmati">Bagmati Pradesh</option>
                    <option value="koshi">Koshi Pradesh</option>
                    <option value="lumbini">Lumbini Pradesh</option>
                    <option value="madhesh">Madhesh Pradesh</option>
                    <option value="karnali">Karnali Pradesh</option>
                    <option value="sudurpashchim">
                      Sudurpashchim Pradesh
                    </option>
                  </select>

                  {errors.province && (
                    <p style={errorStyle}>{errors.province}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 - PAYMENT */}
          {currentStep === 1 && (
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.4rem",
                  fontWeight: "700",
                  color: "var(--color-navy)",
                  marginBottom: "28px",
                }}
              >
                Payment Method
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Cash on Delivery */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px 24px",
                    borderRadius: "12px",
                    border: `2px solid ${
                      paymentMethod === "cod"
                        ? "var(--color-navy)"
                        : "var(--color-border)"
                    }`,
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                    backgroundColor:
                      paymentMethod === "cod"
                        ? "var(--color-sbg)"
                        : "var(--color-white)",
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      accentColor: "var(--color-navy)",
                      width: "18px",
                      height: "18px",
                    }}
                  />

                  <div style={{ fontSize: "1.8rem" }}>💵</div>

                  <div>
                    <p
                      style={{
                        fontWeight: "600",
                        color: "var(--color-navy)",
                        fontSize: "0.95rem",
                        marginBottom: "4px",
                      }}
                    >
                      Cash on Delivery
                    </p>

                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                      }}
                    >
                      Pay when your order arrives at your doorstep
                    </p>
                  </div>

                  {paymentMethod === "cod" && (
                    <span
                      style={{
                        marginLeft: "auto",
                        backgroundColor: "var(--color-navy)",
                        color: "var(--color-taupe)",
                        fontSize: "0.65rem",
                        fontWeight: "700",
                        padding: "4px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      SELECTED
                    </span>
                  )}
                </label>

                {/* Digital Wallet */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px 24px",
                    borderRadius: "12px",
                    border: "2px solid var(--color-border)",
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="esewa"
                    disabled
                    style={{
                      width: "18px",
                      height: "18px",
                    }}
                  />

                  <div style={{ fontSize: "1.8rem" }}>📱</div>

                  <div>
                    <p
                      style={{
                        fontWeight: "600",
                        color: "var(--color-navy)",
                        fontSize: "0.95rem",
                        marginBottom: "4px",
                      }}
                    >
                      eSewa / Khalti
                    </p>

                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                      }}
                    >
                      Digital wallet payment
                    </p>
                  </div>

                  <span
                    style={{
                      marginLeft: "auto",
                      backgroundColor: "var(--color-ivory)",
                      color: "var(--color-muted)",
                      fontSize: "0.65rem",
                      fontWeight: "700",
                      padding: "4px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    COMING SOON
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3 - REVIEW */}
          {currentStep === 2 && (
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.4rem",
                  fontWeight: "700",
                  color: "var(--color-navy)",
                  marginBottom: "28px",
                }}
              >
                Review Your Order
              </h2>

              {/* Delivery Information */}
              <div
                style={{
                  backgroundColor: "var(--color-sbg)",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "24px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-muted)",
                    marginBottom: "12px",
                  }}
                >
                  Delivering To
                </p>

                <p
                  style={{
                    fontWeight: "600",
                    color: "var(--color-navy)",
                    marginBottom: "4px",
                  }}
                >
                  {form.fullName}
                </p>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-muted)",
                    marginBottom: "2px",
                  }}
                >
                  {form.address}, {form.city}
                </p>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-muted)",
                    marginBottom: "2px",
                  }}
                >
                  {form.phone}
                </p>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-muted)",
                  }}
                >
                  {form.email}
                </p>
              </div>

              {/* Payment Method */}
              <div
                style={{
                  backgroundColor: "var(--color-sbg)",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "24px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-muted)",
                    marginBottom: "12px",
                  }}
                >
                  Payment Method
                </p>

                <p
                  style={{
                    fontWeight: "600",
                    color: "var(--color-navy)",
                  }}
                >
                  💵 Cash on Delivery
                </p>
              </div>

              {/* Items */}
              <div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-muted)",
                    marginBottom: "12px",
                  }}
                >
                  Items ({cartItems.length})
                </p>

                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          backgroundColor: "#f3f4f6",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {item.image?.[0]?.url ? (
                          <img
                            src={item.image[0].url}
                            alt={item.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.2rem",
                            }}
                          >
                            {item.category === "watches"
                              ? "⌚"
                              : item.category === "perfumes"
                                ? "🧴"
                                : "👓"}
                          </div>
                        )}
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "var(--color-navy)",
                          }}
                        >
                          {item.name}
                        </p>

                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        fontWeight: "600",
                        color: "var(--color-navy)",
                      }}
                    >
                      Rs.{" "}
                      {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                style={{
                  padding: "12px 28px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-navy)",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor =
                    "var(--color-navy)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor =
                    "var(--color-border)")
                }
              >
                ← Back
              </button>
            ) : (
              <Link
                to="/cart"
                style={{
                  padding: "12px 28px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-navy)",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  borderRadius: "8px",
                }}
              >
                ← Back to Cart
              </Link>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                style={{
                  padding: "12px 32px",
                  backgroundColor: "var(--color-navy)",
                  border: "none",
                  color: "var(--color-taupe)",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  borderRadius: "8px",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.opacity = "0.85")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.opacity = "1")
                }
              >
                CONTINUE →
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
  {orderError && (
    <p style={{ fontSize: '0.8rem', color: '#dc2626', textAlign: 'right' }}>
      {orderError}
    </p>
  )}
  <button
    onClick={handlePlaceOrder}
    disabled={orderLoading}
    style={{
      padding: '12px 32px',
      backgroundColor: orderLoading ? '#e5e7eb' : 'var(--color-taupe)',
      color: orderLoading ? '#9ca3af' : 'var(--color-navy)',
      border: 'none',
      fontSize: '0.82rem',
      fontWeight: '700',
      letterSpacing: '0.1em',
      cursor: orderLoading ? 'not-allowed' : 'pointer',
      borderRadius: '8px',
      transition: 'background-color 0.2s ease',
    }}
  >
    {orderLoading ? 'Placing Order…' : 'PLACE ORDER ✓'}
  </button>
</div>

            )}
          </div>
        </div>

        {/* Order Summary */}
        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "16px",
            padding: "28px",
            border: "1px solid var(--color-border)",
            position: "sticky",
            top: "100px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.2rem",
              fontWeight: "700",
              color: "var(--color-navy)",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            Order Summary
          </h2>

          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minWidth: 0,
                }}
              >
                {/* Product Image */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "6px",
                    backgroundColor: "#f3f4f6",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {item.image?.[0]?.url ? (
                    <img
                      src={item.image[0].url}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                      }}
                    >
                      {item.category === "watches"
                        ? "⌚"
                        : item.category === "perfumes"
                          ? "🧴"
                          : "👓"}
                    </div>
                  )}
                </div>

                {/* Product Name & Quantity */}
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      color: "var(--color-navy)",
                    }}
                  >
                    {item.name}
                  </p>

                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-muted)",
                    }}
                  >
                    × {item.quantity}
                  </p>
                </div>
              </div>

              {/* Product Price */}
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "var(--color-navy)",
                }}
              >
                Rs. {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}

          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              margin: "16px 0",
            }}
          />

          {/* Subtotal & Shipping */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-muted)",
                }}
              >
                Subtotal
              </span>

              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "var(--color-navy)",
                }}
              >
                Rs. {subtotal.toLocaleString()}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-muted)",
                }}
              >
                Shipping
              </span>

              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color:
                    shipping === 0
                      ? "#15803D"
                      : "var(--color-navy)",
                }}
              >
                {shipping === 0 ? "FREE" : `Rs. ${shipping}`}
              </span>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              margin: "16px 0",
            }}
          />

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                color: "var(--color-navy)",
              }}
            >
              Total
            </span>

            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.2rem",
                fontWeight: "800",
                color: "var(--color-navy)",
              }}
            >
              Rs. {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: "600",
  color: "var(--color-navy)",
  marginBottom: "6px",
  letterSpacing: "0.04em",
};

const inputStyle = (hasError) => ({
  width: "100%",
  padding: "11px 14px",
  borderRadius: "8px",
  border: `1px solid ${
    hasError ? "var(--color-error)" : "var(--color-border)"
  }`,
  fontSize: "0.88rem",
  color: "var(--color-navy)",
  backgroundColor: "var(--color-white)",
  outline: "none",
  transition: "border-color 0.2s ease",
});

const errorStyle = {
  fontSize: "0.72rem",
  color: "var(--color-error)",
  marginTop: "4px",
};

export default Checkout;