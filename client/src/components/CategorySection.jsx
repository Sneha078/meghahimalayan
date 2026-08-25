import { Link } from 'react-router-dom'
import { useState } from 'react'

const categories = [
  {
    id: 1,
    title:       'Eyeglasses',
    description: 'Ray-Ban, Gucci, Prada, Dior, Oakley & more',
    count:       '15 PRODUCTS',
    tagline:     'VIEW THE WORLD DIFFERENTLY',
    image:       'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=900&q=80&fit=crop',
    link:        '/shop?category=eyeglasses',
  },
  {
    id: 2,
    title:       'Watches',
    description: 'Casio, Omega, Rado, Emporio Armani & more',
    count:       '9 PRODUCTS',
    tagline:     'TIME, REDEFINED',
    image:       'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80&fit=crop',
    link:        '/shop?category=watches',
  },
  {
    id: 3,
    title:       'Perfumes',
    description: 'Dior, Chanel, Tom Ford, YSL, Versace & more',
    count:       '8 PRODUCTS',
    tagline:     'A SCENT THAT DEFINES YOU',
    image:       'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=900&q=80&fit=crop',
    link:        '/shop?category=perfumes',
  },
]


function CategoryCard({ cat }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:   'relative',
        borderRadius: '16px',
        overflow:   'hidden',
        minHeight:  '420px',
        cursor:     'pointer',
        transform:  hovered ? 'scale(1.03)' : 'scale(1)',
        boxShadow:  hovered
          ? '0 24px 60px rgba(13,32,49,0.25)'
          : '0 4px 20px rgba(13,32,49,0.10)',
        transition: 'transform 0.35s ease, box-shadow 0.35s ease',
      }}
    >
 
      <div style={{
        position: 'absolute',
        inset:  0,
        backgroundImage:`url(${cat.image})`,
        backgroundSize: 'cover',
        backgroundPosition:'center',
        transform:  hovered ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 0.5s ease',
      }} />

    
      <div style={{
        position:   'absolute',
        inset:       0,
        background: 'linear-gradient(to top, rgba(13,32,49,0.90) 40%, rgba(13,32,49,0.35) 100%)',
      }} />

    <div style={{
  position: 'absolute',
  top: '28px',
  left: '28px',
  zIndex: 2,
}}>
  <p style={{
    color: '#ffffff',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    marginBottom: '4px',
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
  }}>
    {cat.count}
  </p>

  <p style={{
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
  }}>
    {cat.tagline}
  </p>
</div>

<div style={{
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '28px',
  zIndex: 2,
}}>
     
        
        <h3 style={{
          fontFamily:   'var(--font-serif)',
          color:  '#ffffff',
          fontSize: '2.4rem',
          fontWeight:'700',
          lineHeight: '1.1',
          marginBottom: '8px',
        }}>
          {cat.title}
        </h3>

       
        <p style={{
          color:  'rgba(255,255,255,0.6)',
          fontSize: '0.82rem',
          lineHeight: '1.6',
          marginBottom: '20px',
        }}>
          {cat.description}
        </p>

      
        <Link
          to={cat.link}
          style={{
            display:  'inline-block',
            backgroundColor: 'var(--color-taupe)',
            color:  'var(--color-navy)',
            padding: '10px 24px',
            fontSize: '0.74rem',
            fontWeight: '700',
            letterSpacing:'0.14em',
            textDecoration: 'none',
            borderRadius: '2px',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe-dark)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe)'}
        >
          SHOP NOW
        </Link>
      </div>
    </div>
  )
}


function CategorySection() {
  return (
    <section style={{
      backgroundColor: 'var(--color-white)',
      padding:  '80px 5rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{
          color:  'var(--color-taupe)',
          fontSize: '0.72rem',
          fontWeight:'700',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom:  '12px',
        }}>
          BROWSE BY CATEGORY
        </p>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '2.8rem',
          fontWeight: '700',
          color:      'var(--color-navy)',
          lineHeight: '1.2',
        }}>
          Find Your Perfect Style
        </h2>
      </div>

  
      <div style={{
        display:  'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:'24px',
      }}>
        {categories.map(cat => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>
    </section>
  )
}

export default CategorySection
