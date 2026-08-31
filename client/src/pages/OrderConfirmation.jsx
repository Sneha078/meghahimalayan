import { Link } from "react-router-dom";

function OrderConfirmation() {
  const orderNumber = `MH${Date.now().toString().slice(-6)}`
  
  return (
    <div style={{
      backgroundColor: 'var(--color-sbg)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 5rem',  
    }}>
        <div style={{
          borderRadius: '20px',
        padding: '56px',
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 60px rgba(13,32,49,0.08)',   
        }}>
          <div style={{
            width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 24px',
          }}>
           ✓
            </div>  
            <h1
            style={{
            fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: '800',
          color: 'var(--color-navy)',
          marginBottom: '12px',   
            }}>
                Order Placed
            </h1>

            <p style={{
            color: 'var(--color-muted)',
          fontSize: '0.95rem',
          lineHeight: '1.7',
          marginBottom: '32px',   
            }}>
                Thank you for your order. We'll contact you shortly to confirm your delivery details.
            </p>
            <div style={{
            backgroundColor: 'var(--color-sbg)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid var(--color-border)',
          textAlign: 'left',  
            }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>Order Number</span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-navy)' }}>
              #{orderNumber}
            </span>
          </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>Payment Method</span>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-navy)' }}>
              Cash on Delivery
            </span>
          </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>Estimated Delivery</span>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-navy)' }}>
              3 - 5 Business Days
            </span>
          </div>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>Order Status</span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              color: '#15803D',
              backgroundColor: '#dcfce7',
              padding: '3px 10px',
              borderRadius: '20px',
            }}>
              CONFIRMED
            </span>
          </div>     
            </div>
            <div style={{marginBottom: '32px', textAlign: 'left' }}>
                <p style={{
                fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
            marginBottom: '16px',  
                }}>
                    Order Timeline
                </p>

                {[
                { label: 'Order Placed', done: true },
                { label: 'Order Confirmed', done: true },
                { label: 'Processing', done: false },
                { label: 'Shipped', done: false },
                { label: 'Delivered', done: false },  
                ].map((step, index) => (
                  <div key={step.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: index < 4 ? '8px' : '0',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: step.done ? '#15803D' : 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                color: step.done ? '#ffffff' : 'var(--color-muted)',
                flexShrink: 0,
                fontWeight: '700',
              }}>
                {step.done ? '✓' : '○'}
              </div>
              <span style={{
                fontSize: '0.85rem',
                color: step.done ? 'var(--color-navy)' : 'var(--color-muted)',
                fontWeight: step.done ? '600' : '400',
              }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>   
                {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/"
            style={{
              flex: 1,
              padding: '13px',
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-taupe)',
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            GO HOME
                     </Link>
          <Link
            to="/shop"
            style={{
              flex: 1,
              padding: '13px',
              backgroundColor: 'transparent',
              color: 'var(--color-navy)',
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-navy)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            SHOP MORE
          </Link>
        </div>

      </div>
    </div>
  )
}

export default OrderConfirmation
               