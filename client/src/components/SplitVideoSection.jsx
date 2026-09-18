
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function SplitVideoSection() {
  const [hovered, setHovered] = useState(null)
  const [mobileActive, setMobileActive] = useState(0)
  const videoRefs = useRef({})
  const isMobile = useIsMobile()

  const handleMouseEnter = (id) => {
    setHovered(id)
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return
      if (key === id) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }

  const handleMouseLeave = () => {
    setHovered(null)
    Object.values(videoRefs.current).forEach((video) => {
      if (!video) return
      video.pause()
    })
  }

  // Mobile: auto-advance panels
  useEffect(() => {
    if (!isMobile) return
    const interval = setInterval(() => {
      setMobileActive((prev) => (prev + 1) % PANELS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isMobile])

  // Mobile: play active video, pause others
  useEffect(() => {
    if (!isMobile) return
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return
      if (key === PANELS[mobileActive].id) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [mobileActive, isMobile])

  // Desktop layout
  if (!isMobile) {
    return (
      <section
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: '90vh',
          display: 'flex',
          overflow: 'hidden',
        }}>
        {PANELS.map((panel) => {
          const isHovered = hovered === panel.id
          const isOtherHovered = hovered !== null && hovered !== panel.id

          return (
            <div
              key={panel.id}
              onMouseEnter={() => handleMouseEnter(panel.id)}
              style={{
                position: 'relative',
                flex: isHovered ? '0 0 60%' : isOtherHovered ? '0 0 20%' : '0 0 33.33%',
                transition: 'flex 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <video
                ref={(el) => (videoRefs.current[panel.id] = el)}
                src={panel.video}
                muted
                loop
                playsInline
                preload="auto"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 0.7s ease',
                }}
              />

              <div style={{
                position: 'absolute',
                inset: 0,
                background: isHovered
                  ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
                  : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 100%)',
                transition: 'background 0.5s ease',
              }} />

              {panel.id === 'eyeglasses' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '1px',
                  height: '100%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  zIndex: 2,
                }} />
              )}

              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 'var(--section-px)',
                paddingBottom: '48px',
                zIndex: 2,
              }}>
                <p style={{
                  color: 'var(--color-taupe)',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  opacity: isHovered ? 1 : 0.7,
                  transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                  transition: 'all 0.4s ease',
                }}>
                  {panel.label}
                </p>

                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: isHovered ? '3.2rem' : '2.4rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  lineHeight: 1.15,
                  marginBottom: '16px',
                  whiteSpace: 'pre-line',
                  transition: 'font-size 0.4s ease',
                }}>
                  {panel.heading}
                </h2>

                <p style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  marginBottom: '28px',
                  maxWidth: '320px',
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'all 0.4s ease 0.1s',
                }}>
                  {panel.sub}
                </p>

                <div style={{
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'all 0.4s ease 0.15s',
                }}>
                  <Link
                    to={panel.link}
                    style={{
                      display: 'inline-block',
                      padding: '12px 32px',
                      backgroundColor: 'var(--color-taupe)',
                      color: 'var(--color-navy)',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
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

  // Mobile layout: full-width stacked panels with swipe/tap
  return (
    <section style={{ width: '100%', position: 'relative' }}>
      {PANELS.map((panel, index) => {
        const isActive = index === mobileActive
        return (
          <div
            key={panel.id}
            style={{
              position: 'relative',
              width: '100%',
              height: '75vh',
              minHeight: '480px',
              overflow: 'hidden',
              display: index === mobileActive ? 'block' : 'none',
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
              padding: '24px 20px 40px',
              zIndex: 2,
            }}>
              <p style={{
                color: 'var(--color-taupe)',
                fontSize: '0.65rem',
                fontWeight: '700',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                {panel.label}
              </p>

              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.8rem, 8vw, 2.4rem)',
                fontWeight: '800',
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '12px',
                whiteSpace: 'pre-line',
              }}>
                {panel.heading}
              </h2>

              <p style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                marginBottom: '24px',
                maxWidth: '320px',
              }}>
                {panel.sub}
              </p>

              <div>
                <Link
                  to={panel.link}
                  style={{
                    display: 'inline-block',
                    padding: '12px 28px',
                    backgroundColor: 'var(--color-taupe)',
                    color: 'var(--color-navy)',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                  }}
                >
                  {panel.cta}
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      {/* Dot indicators */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 3,
      }}>
        {PANELS.map((panel, index) => (
          <button
            key={panel.id}
            onClick={() => setMobileActive(index)}
            aria-label={`Go to ${panel.label}`}
            style={{
              width: index === mobileActive ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: index === mobileActive ? 'var(--color-taupe)' : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  )
}

export default SplitVideoSection
