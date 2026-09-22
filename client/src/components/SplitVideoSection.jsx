import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const PANELS = [
  {
    id: 'eyeglasses',
    video: '/videos/eyeglasses.mp4',
    label: 'Eyewear',
    heading: 'See the World\nDifferently',
    sub: 'Premium frames from the world\'s finest brands',
    link: '/shop?category=eyeglasses',
    cta: 'Shop Eyewear',
  },
  {
    id: 'watches',
    video: '/videos/watch.mp4',
    label: 'Timepieces',
    heading: 'Time Worth\nWearing',
    sub: 'Luxury watches crafted for every moment',
    link: '/shop?category=watches',
    cta: 'Shop Watches',
  },
  {
    id: 'perfumes',
    video: '/videos/perfume.mp4',
    label: 'Fragrances',
    heading: 'Wear Your\nSignature Scent',
    sub: 'Discover luxury fragrances for every occasion',
    link: '/shop?category=perfumes',
    cta: 'Shop Perfumes',
  },
]

function SplitVideoSection() {
  const [active, setActive] = useState(0)
  const videoRefs = useRef({})

  // Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % PANELS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Play active video, pause others
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return
      if (key === PANELS[active].id) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [active])

  return (
    <section style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      {PANELS.map((panel, index) => {
        const isActive = index === active
        return (
          <div
            key={panel.id}
            style={{
              position: 'relative',
              width: '100%',
              height: '80vh',
              minHeight: '500px',
              overflow: 'hidden',
              display: isActive ? 'block' : 'none',
            }}
          >
            <video
              ref={(el) => (videoRefs.current[panel.id] = el)}
              src={panel.video}
              muted
              loop
              playsInline
              preload={isActive ? 'auto' : 'metadata'}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
            }} />

            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 'clamp(24px, 5vw, 60px) clamp(20px, 5vw, 80px)',
              paddingBottom: '60px',
              zIndex: 2,
            }}>
              <p style={{
                color: 'var(--color-taupe)',
                fontSize: 'clamp(0.6rem, 1.2vw, 0.75rem)',
                fontWeight: '700',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}>
                {panel.label}
              </p>

              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                fontWeight: '800',
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '16px',
                whiteSpace: 'pre-line',
              }}>
                {panel.heading}
              </h2>

              <p style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                lineHeight: '1.6',
                marginBottom: '28px',
                maxWidth: '400px',
              }}>
                {panel.sub}
              </p>

              <div>
                <Link
                  to={panel.link}
                  style={{
                    display: 'inline-block',
                    padding: '14px 36px',
                    backgroundColor: 'var(--color-taupe)',
                    color: 'var(--color-navy)',
                    textDecoration: 'none',
                    fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-taupe)'}
                >
                  {panel.cta}
                </Link>
              </div>
            </div>
          </div>
        )
      })}


    </section>
  )
}

export default SplitVideoSection
