import { Link } from 'react-router-dom'
import { useState } from 'react'

function OurStory() {
  const [hoveredShop, setHoveredShop] = useState(false)
  const [hoveredStore, setHoveredStore] = useState(false)

  return (
    <section style={{ backgroundColor: 'var(--color-navy)', padding: '80px 5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>

        
        <div>
          <p style={{
            color: 'var(--color-taupe)',
            fontSize: '0.85rem',
            fontWeight: '800',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom:  '16px',
          }}>
            OUR STORY
          </p>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            color: '#ffffff',
            fontSize:'2.8rem',
            fontWeight: '700',
            lineHeight: '1.2',
            marginBottom: '24px',
          }}>
            Over 50 Years of Serving Pokhara
          </h2>

          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.95rem',
            lineHeight: '1.8',
            marginBottom: '16px',
            textAlign: 'justify',
          }}>
            Founded in 2001 by Mr. Suraj Singh, Mega Himalaya Optical House has been serving
            the people of Pokhara for over two decades with premium international eyewear
            and timepieces.
          </p>

          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.95rem',
            lineHeight: '1.8',
            marginBottom: '16px',
            textAlign: 'justify',
          }}>
            Conveniently located at Mahendra Pool, Pokhara's bustling hub, we bring you the
            world's finest brands — Ray-Ban, Gucci, Prada, Casio, Omega and many more at
            honest, factory-direct prices.
          </p>

          <p style={{
            color: 'var(--color-taupe)',
            fontSize: '0.95rem',
            lineHeight: '1.8',
            fontStyle: 'italic',
            marginBottom: '32px',
            textAlign: 'justify',
          }}>
            "SEE THE BEAUTY OF THE WORLD." That's not just our tagline, it's our
            commitment to every customer.
          </p>

          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              to="/shop"
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--color-taupe)',
                color: 'var(--color-navy)',
                padding: '0.9rem 2rem',
                fontSize: '0.78rem',
                fontWeight: '700',
                letterSpacing:  '0.15em',
                textDecoration: 'none',
                transition:      'background-color 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe-dark)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe)'}
            >
              SHOP COLLECTION
            </Link>

            <Link
              to="/contact"
              style={{
                display: 'inline-block',
                backgroundColor: 'transparent',
                color:'rgba(255,255,255,0.7)',
                padding: '0.9rem 2rem',
                fontSize: '0.78rem',
                fontWeight: '500',
                letterSpacing:'0.12em',
                textDecoration:'none',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              }}
            >
              FIND OUR STORE
            </Link>
          </div>
        </div>


        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap:'16px',
          height:'460px',
        }}>
          
          <div style={{ gridRow: '1 / 3', borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80&fit=crop"
              alt="Eyeglasses"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
       
          <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop"
              alt="Watches"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        
          <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80&fit=crop"
              alt="Perfumes"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>

      </div>
    </section>
  )
}

export default OurStory
