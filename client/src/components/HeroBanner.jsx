import { useState, useEffect, useRef } from 'react'

// ── Slide data ──────────────────────────────────────────────────────────────
const slides = [
  {
    id: 1,
    brand:        'Ray-Ban',
    brandTagline: 'Never Hide.',
    label:        'EYEWEAR COLLECTION',
    title:        'See The Beauty',
    subtitle:     'Of The World.',
    description:  'Discover iconic frames crafted for clarity, style, and every moment.',
    buttonText:   'SHOP EYEGLASSES',
    bgImage:      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1600&q=80&fit=crop',
  },
  {
    id: 2,
    brand:        'Titan',
    brandTagline: 'Be More.',
    label:        'WATCH COLLECTION',
    title:        'Time,',
    subtitle:     'Redefined.',
    description:  'Premium timepieces crafted for every wrist and every occasion.',
    buttonText:   'SHOP WATCHES',
    bgImage:      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80&fit=crop',
  },
  {
    id: 3,
    brand:        'Dior',
    brandTagline: 'A Fragrance of Love.',
    label:        'FRAGRANCE COLLECTION',
    title:        'A Scent That',
    subtitle:     'Defines You.',
    description:  "Luxury fragrances from the world's most iconic fashion houses.",
    buttonText:   'SHOP PERFUMES',
    bgImage:      'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1600&q=80&fit=crop',
  },
]

// ── Component ────────────────────────────────────────────────────────────────
function HeroBanner() {
  const [current, setCurrent]         = useState(0)
  const [textVisible, setTextVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef(null)

  // Switch to a specific slide
  const goToSlide = (index) => {
    if (isAnimating) return
    setIsAnimating(true)
    setTextVisible(false)
    setTimeout(() => {
      setCurrent(index)
      setIsAnimating(false)
      setTimeout(() => setTextVisible(true), 60)
    }, 500)
  }

  // Auto-advance every 5.5 s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % slides.length
        setIsAnimating(true)
        setTextVisible(false)
        setTimeout(() => {
          setIsAnimating(false)
          setTimeout(() => setTextVisible(true), 60)
        }, 500)
        return next
      })
    }, 5500)
    return () => clearInterval(timerRef.current)
  }, [])

  const slide = slides[current]

  // Staggered text animation helper
  const textAnim = (delay = '0s') => ({
    opacity:    textVisible ? 1 : 0,
    transform:  textVisible ? 'translateY(0px)' : 'translateY(18px)',
    transition: `opacity 0.55s ease ${delay}, transform 0.55s ease ${delay}`,
  })

  return (
    <section style={{ position: 'relative', height: 'calc(100vh - 72px)', overflow: 'hidden', backgroundColor: '#0d2031' }}>

      {/* ── Background image layers (crossfade) ── */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          style={{
            position:   'absolute',
            inset:       0,
            opacity:     i === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            zIndex:      1,
          }}
        >
          {/* Photo with Ken Burns zoom */}
          <div
            style={{
              width:              '100%',
              height:             '100%',
              backgroundImage:    `url(${s.bgImage})`,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              animation:          i === current ? 'kenBurns 6s ease-out forwards' : 'none',
            }}
          />
          {/* Dark gradient so text stays readable */}
          <div style={{
            position:   'absolute',
            inset:       0,
            background: 'linear-gradient(to right, rgba(13,32,49,0.88) 40%, rgba(13,32,49,0.30) 100%)',
          }} />
        </div>
      ))}

      {/* ── Text content ── */}
      <div style={{
        position:   'relative',
        zIndex:      10,
        height:     '100%',
        display:    'flex',
        alignItems: 'center',
        padding:    '0 6rem',
      }}>
        <div style={{ maxWidth: '620px' }}>

          {/* Label + brand name row */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '0.75rem',
            marginBottom: '1.5rem',
            ...textAnim('0.05s'),
          }}>
            <span style={{ color: 'var(--color-taupe)', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              {slide.label}
            </span>
            <span style={{ width: '28px', height: '1px', backgroundColor: 'var(--color-taupe)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: '500', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {slide.brand}
            </span>
          </div>

          {/* Main heading */}
          <h1 style={{
            fontFamily:   'var(--font-serif)',
            color:         '#ffffff',
            fontSize:     'clamp(3.2rem, 5.5vw, 5.5rem)',
            fontWeight:   '800',
            lineHeight:   '1.05',
            marginBottom: '0.4rem',
            ...textAnim('0.12s'),
          }}>
            {slide.title}
          </h1>

          {/* Italic taupe subtitle */}
          <h1 style={{
            fontFamily:   'var(--font-serif)',
            color:         'var(--color-taupe)',
            fontSize:     'clamp(3.2rem, 5.5vw, 5.5rem)',
            fontWeight:   '700',
            fontStyle:    'italic',
            lineHeight:   '1.1',
            marginBottom: '1rem',
            ...textAnim('0.19s'),
          }}>
            {slide.subtitle}
          </h1>

          {/* Brand tagline — minimal pill style */}
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '0.5rem',
            marginBottom: '1.1rem',
            ...textAnim('0.25s'),
          }}>
            <span style={{
              width:           '4px',
              height:          '4px',
              borderRadius:    '50%',
              backgroundColor: 'var(--color-taupe)',
              flexShrink:       0,
            }} />
            <span style={{
              color:         'var(--color-taupe)',
              fontSize:      '0.82rem',
              fontStyle:     'italic',
              fontWeight:    '400',
              letterSpacing: '0.04em',
            }}>
              {slide.brandTagline}
            </span>
          </div>

          {/* Description */}
          <p style={{
            color:        'rgba(255,255,255,0.58)',
            fontSize:     '1rem',
            lineHeight:   '1.75',
            maxWidth:     '460px',
            marginBottom: '2.5rem',
            ...textAnim('0.31s'),
          }}>
            {slide.description}
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', ...textAnim('0.37s') }}>
            <button
              style={{
                backgroundColor: 'var(--color-taupe)',
                color:           'var(--color-navy)',
                padding:         '0.9rem 2.5rem',
                fontSize:        '0.78rem',
                fontWeight:      '700',
                letterSpacing:   '0.18em',
                border:          'none',
                cursor:          'pointer',
                transition:      'background-color 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe-dark)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe)'}
            >
              {slide.buttonText}
            </button>

            <button
              style={{
                backgroundColor: 'transparent',
                color:           'rgba(255,255,255,0.7)',
                padding:         '0.9rem 2rem',
                fontSize:        '0.78rem',
                fontWeight:      '500',
                letterSpacing:   '0.12em',
                border:          '1px solid rgba(255,255,255,0.25)',
                cursor:          'pointer',
                transition:      'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#ffffff'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              }}
            >
              EXPLORE
            </button>
          </div>

        </div>
      </div>

      {/* ── Dot indicators (bottom-left) ── */}
      <div style={{
        position:   'absolute',
        bottom:     '2.5rem',
        left:       '6rem',
        zIndex:      20,
        display:    'flex',
        gap:        '0.55rem',
        alignItems: 'center',
      }}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goToSlide(i)}
            style={{
              width:           i === current ? '2rem' : '0.45rem',
              height:          '0.45rem',
              borderRadius:    '999px',
              backgroundColor: i === current ? 'var(--color-taupe)' : 'rgba(255,255,255,0.3)',
              border:          'none',
              cursor:          'pointer',
              padding:          0,
              transition:      'all 0.4s ease',
            }}
          />
        ))}
      </div>


    </section>
  )
}

export default HeroBanner
