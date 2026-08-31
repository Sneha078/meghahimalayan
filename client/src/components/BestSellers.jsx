import { useState } from 'react'
import { Link } from 'react-router-dom'
import products from '../data/products'
import ProductCard from './ProductCard'

function BestSellers() {
  const bestSellers = products.filter(p => p.isBestseller).slice(0, 8)

  return (
    <section style={{ backgroundColor: 'var(--color-white)', padding: '80px 5rem' }}>

     
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{
          color: 'var(--color-taupe)',
          fontSize: '0.85rem',
          fontWeight: '800',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom:  '12px',
        }}>
          CUSTOMER FAVOURITES
        </p>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.8rem',
          fontWeight: '700',
          color: 'var(--color-navy)',
          lineHeight: '1.2',
          marginBottom: '16px',
        }}>
          Best Sellers
        </h2>
        <p style={{
          color:'var(--color-muted)',
          fontSize: '1rem',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight:'1.7',
        }}>
          Our most loved products - chosen by customers across Pokhara.
        </p>
      </div>

      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: '24px',
        marginBottom: '48px',
      }}>
        {bestSellers.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

   
      <div style={{ textAlign: 'center' }}>
        <Link
          to="/shop"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-navy)',
            color: 'var(--color-taupe)',
            padding:  '0.9rem 3rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            letterSpacing: '0.18em',
            textDecoration: 'none',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#162436'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-navy)'}
        >
          VIEW ALL PRODUCTS
        </Link>
      </div>

    </section>
  )
}

export default BestSellers
