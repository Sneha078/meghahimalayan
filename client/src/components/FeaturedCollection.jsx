import { Link } from "react-router-dom";
import products from "../data/products";
import ProductCard from "./ProductCard";

function FeaturedCollection() {
    const featured = products.slice(0,8)

    return (
        <section style={{
            backgroundColor: 'var(--color-sbg)',
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
                             fontSize: '0.72rem',
                             fontWeight: '700',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginBottom: '10px',
 
                 }}>
                    HAND-PICKED FOR YOU</p>
                    <h2 style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: 'var(--color-navy)',
                      lineHeight: '1.2',  
                    }}>
                        Featured Collection</h2>
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
                        onMouseEnter={(e) =>{
                         e.currentTarget.style.backgroundColor='var(--color-navy)'
                         e.currentTarget.style.color = 'var(--color-taupe)'   
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currenttarget.style.color = 'var(--color-navy)'
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
                {featured.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    )
}

export default FeaturedCollection