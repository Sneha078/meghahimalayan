
import { useRef, useState } from 'react'
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
  const [hovered, setHovered] = useState(null)
  const videoRefs = useRef({})

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
              padding: '48px',
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

export default SplitVideoSection
