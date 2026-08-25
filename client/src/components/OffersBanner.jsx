import { Link } from "react-router-dom";

function OffersBanner(){
    return (
        <section style={{
           backgroundColor: 'var(--color-navy)',
           padding: '80px 5rem',
           textAlign: 'center',
           position: 'relative',
           overflow: 'hidden',  
        }}>

            <div style={{
            position: 'absolute',
            top: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.03)',
            pointerEvents: 'none',   
            }} />

            <div style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.03)',
            pointerEvents: 'none', 
            }} />

            <div style={{ position: 'relative', zIndex:2}}>
                <p style={{
                color: 'var(--color-taupe)',
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '16px', 
                }}>
                    DAILY OFFERS
                </p>
                <h2 style={{
                fontFamily: 'var(--font-serif)',
                color: '#ffffff',
                fontSize: '3.5rem',
                fontWeight: '800',
                lineHeight: '1.1',
                marginBottom: '20px', 
                }}>
                    Up to 10% Off - Every Day
                </h2>

                <p style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: '1rem',
                lineHeight: '1.7',
                maxWidth: '540px',
                margin: '0 auto 36px',
                }}>
                  At Mega Himalaya Optical House, we believe premium eyewear, watches and perfumes should be
                  accessible. Discover daily surprises and factory-direct pricing on all
                  top international brands. 
                </p>

                <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                alignItems: 'center',
                }}>
                    <Link
                    to="/shop"
                    style={{
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    padding: '13px 32px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    letterSpacing: '0.15em',
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.3s ease', 
                            }}
               onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
  }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
  }}>   
            SHOP EYEGLASSES
          </Link>
         <Link
  to="/shop"
  style={{
    backgroundColor: 'transparent',
    color: '#ffffff',
    padding: '13px 32px',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.15em',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.3)',
    transition: 'all 0.3s ease',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent'
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
  }}
>
  SHOP WATCHES
</Link>

          <Link
          to="/shop"
          style={{
            backgroundColor: 'transparent',
            color: '#ffffff',
            padding: '13px 32px',
            fontSize: '0.8rem',
            fontWeight: '600',
            letterSpacing: '0.15em',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
             e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
             e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
          }} 
          onMouseLeave={(e) =>{
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
          }} >
            SHOP PERFUMES
          </Link>
            </div>
         </div>
        </section>
    )
}

export default OffersBanner