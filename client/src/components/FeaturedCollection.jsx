import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "./ProductCard";

function FeaturedCollection() {
    // Ask the backend to filter server-side (featured=true) instead of
    // fetching a partial page and filtering in JS — getAllProducts
    // defaults to only 12 results/page, so client-side filtering would
    // silently miss most of the catalog otherwise.
    const { products: featured, loading, error } = useProducts({ featured: true, limit: 8 })

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
                            e.currentTarget.style.color = 'var(--color-navy)'
                        }}
                        >
                            VIEW ALL
                        </Link>
            </div>

            {/* Loading / error states — the grid below only renders once data is ready */}
            {loading && (
                <p style={{ color: 'var(--color-navy)', opacity: 0.6 }}>Loading products…</p>
            )}
            {error && (
                <p style={{ color: '#e74c3c' }}>Couldn't load products: {error}</p>
            )}

            {!loading && !error && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                     gap: '20px',  
                }}>
                    {featured.map((product) => (
                        // MongoDB documents use _id, not id
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </section>
    )
}

export default FeaturedCollection