import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import { useProducts } from '../hooks/useProducts'
import ProductCard from './ProductCard'

function NewArrivals() {
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  // Ask the backend to filter server-side (new=true) instead of fetching
  // a partial page and filtering in JS — getAllProducts defaults to only
  // 12 results/page, so client-side filtering would silently miss most
  // of the catalog otherwise.
  const { products: newProducts, loading, error } = useProducts({ new: true, limit: 8 })

  return (
    <section style={{
      backgroundColor: 'var(--color-sbg)',
      padding: '80px 5rem',
    }}>

      {/* Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
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
            JUST ARRIVED
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            lineHeight: '1.2',
          }}>
            New Arrivals
          </h2>
        </div>

        {/* Arrow Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            ref={prevRef}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-white)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: 'var(--color-navy)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-navy)'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-white)'
              e.currentTarget.style.color = 'var(--color-navy)'
            }}
          >
            ←
          </button>
          <button
            ref={nextRef}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--color-navy)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: '#ffffff',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-taupe)'
              e.currentTarget.style.color = 'var(--color-navy)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-navy)'
              e.currentTarget.style.color = '#ffffff'
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Loading / error states */}
      {loading && (
        <p style={{ color: 'var(--color-navy)', opacity: 0.6 }}>Loading new arrivals…</p>
      )}
      {error && (
        <p style={{ color: '#e74c3c' }}>Couldn't load products: {error}</p>
      )}
      {!loading && !error && newProducts.length === 0 && (
        <p style={{ color: 'var(--color-navy)', opacity: 0.6 }}>No new arrivals right now.</p>
      )}

      {/* Swiper */}
      {!loading && !error && newProducts.length > 0 && (
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current
            swiper.params.navigation.nextEl = nextRef.current
          }}
          slidesPerView={4}
          spaceBetween={20}
          grabCursor={true}
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 12 },
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 20 },
          }}
          style={{ width: '100%' }}
        >
          {newProducts.map((product) => (
            <SwiperSlide key={product._id} style={{ height: 'auto' }}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

    </section>
  )
}

export default NewArrivals