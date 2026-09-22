import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "./ProductCard";

function FeaturedCollection() {
    const { products: featured, loading, error } = useProducts({ featured: true, limit: 8 })

    return (
        <section style={{
            backgroundColor: 'var(--color-sbg)',
            padding: 'var(--section-py) var(--section-px)',
            overflow: 'hidden',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 'clamp(24px, 4vw, 48px)',
                flexWrap: 'wrap',
                gap: '16px',
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
                      fontSize: 'var(--text-3xl)',
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

            {loading && (
                <p style={{ color: 'var(--color-navy)', opacity: 0.6 }}>Loading products…</p>
            )}
            {error && (
                <p style={{ color: '#e74c3c' }}>Couldn't load products: {error}</p>
            )}

            {!loading && !error && (
                <div
                className="grid grid-cols-2 lg:grid-cols-4"
                style={{ gap: 'var(--section-gap)', minWidth: 0 }}
                >
                    {featured.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </section>
    )
}

export default FeaturedCollection
