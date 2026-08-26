import { Link } from 'react-router-dom'
import products from '../data/products'
import ProductCard from './ProductCard'

function BestSellers(){
    const bestSellers = products.filter((p) => p.isBestseller)
    return(
        <section style={{
            backgroundColor: 'var(--color-ivory)',
            padding: '80px 5rem',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '48px',
            }}>
                <div>
                    <p style={{
                        color: 'var(--color-taupe)',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        marginBottom: '10px',
                    }}>
                        CUSTOMER FAVOURITES
                    </p>
                    <h2 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: 'var(--color-navy)',
                    lineHeight: '1.2',
                    }}>
                        Best Sellers
                    </h2>
                </div>
            

            <Link
            to="/shop"
            style={{
            padding: '10px 24px',
            border: '1px solid var(--color-navy)',
            color: 'var(--color-navy)',
            fontSize: '0.78rem',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor= 'var(--color-navy)'
                e.currentTarget.style.color = 'var(--color-taupe)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--color-navy)'
            }}
            >
                VIEW ALL
            </Link>
            </div>
         <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
         }}>
            {bestSellers.slice(0,8).map((product) =>(
              <ProductCard key={product.id} product={product} />))}
                </div>   
        </section>
    )
}

export default BestSellers