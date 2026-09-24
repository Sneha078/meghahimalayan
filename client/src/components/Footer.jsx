import { Link } from 'react-router-dom'
import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, CalendarDays, Ban, Shield, Truck, Gem, Tag } from 'lucide-react'
import { useStoreLocator } from '../hooks/useStoreLocator'
import { useBusinessSettings } from '../context/BusinessSettingsContext'

function FooterLink({ to, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <li>
      <Link
        to={to}
        style={{
          color: hovered ? 'var(--color-taupe)' : 'rgba(255,255,255,0.5)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          transition: 'color 0.25s ease',
          display: 'inline-block',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}
      </Link>
    </li>
  )
}

function SocialBtn({ href, label, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        border: `1px solid ${hovered ? 'var(--color-taupe)' : 'rgba(255,255,255,0.30)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered ? 'var(--color-taupe)' : 'rgba(255,255,255,0.80)',
        transition: 'all 0.25s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </a>
  )
}

function Footer() {
  const {openStoreLocator, StoreLocatorModal} = useStoreLocator()
  const { businessSettings, loading } = useBusinessSettings()

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '9779840604668'
    // Remove any existing +977 prefix and add it back
    let cleanPhone = phone.replace(/^\+?977/, '')
    return `977${cleanPhone}`
  }

  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '984-0604668'
    // Remove +977 prefix and format with dashes
    let cleanPhone = phone.replace(/^\+?977/, '')
    return cleanPhone.replace(/(\d{3})(\d{7})/, '$1-$2')
  }

  if (loading) {
    return (
      <footer style={{ backgroundColor: 'var(--color-navy)', color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
          Loading...
        </div>
      </footer>
    )
  }
  return (
    <footer style={{ backgroundColor: 'var(--color-navy)', color: 'rgba(255,255,255,0.5)' }}>
      {/* Main Grid */}
      <div style={{ maxWidth: '80rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(36px, 8vw, 64px)', paddingRight: 'clamp(16px, 8vw, 64px)', paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        className="lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-6 md:gap-12">

          {/* Brand title + details — mobile: full width top, desktop: col 1 */}
          <div>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-taupe)',
                fontSize: '1.4rem',
                fontWeight: '700',
                letterSpacing: '0.06em',
              }}
            >
              {businessSettings?.companyName || 'Mega Himalaya'}
            </span>
            <p style={{
              color:         'rgba(255,255,255,0.3)',
              fontSize:      '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop:     '2px',
            }}>
              {businessSettings?.tagline || 'Optical House'}
            </p>
          </div>

     
          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.85rem',
            lineHeight: '1.75',
            marginBottom: '1.25rem',
            maxWidth: '260px',
            textAlign:'justify',
          }}>
            {businessSettings?.description || "Pokhara's premier destination for international eyewear, watches and fragrances founded by Mr. Suraj Singh in 2001."}
          </p>

          
          <div 
          onClick={openStoreLocator}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <span style={{ color: 'var(--color-taupe)', flexShrink: 0, width: '16px', display: 'flex', justifyContent: 'center', marginTop: '1px' }}>
                <MapPin size={15} strokeWidth={2} />
              </span>
              <span>
                {businessSettings?.address 
                  ? `${businessSettings.address.street}, ${businessSettings.address.city} ${businessSettings.address.postalCode}, ${businessSettings.address.country}`
                  : 'Mahendra Pool, Pokhara 33700, Nepal'
                }
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: 'var(--color-taupe)', flexShrink: 0, width: '16px', display: 'flex', justifyContent: 'center' }}>
                <Phone size={15} strokeWidth={2} />
              </span>
              <span>{formatPhoneForDisplay(businessSettings?.phone)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: 'var(--color-taupe)', flexShrink: 0, width: '16px', display: 'flex', justifyContent: 'center' }}>
                <Mail size={15} strokeWidth={2} />
              </span>
              <span>{businessSettings?.email || 'mail@megahimalaya.com'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: 'var(--color-taupe)', flexShrink: 0, width: '16px', display: 'flex', justifyContent: 'center' }}>
                <Clock size={15} strokeWidth={2} />
              </span>
              <span>{businessSettings?.openingHours?.weekdays || 'Sun–Fri: 10:00 AM – 6:00 PM'}</span>
            </div>
            {businessSettings?.openingHours?.saturday && businessSettings.openingHours.saturday !== 'Closed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: 'var(--color-taupe)', flexShrink: 0, width: '16px', display: 'flex', justifyContent: 'center' }}>
                  <CalendarDays size={15} strokeWidth={2} />
                </span>
                <span>{businessSettings.openingHours.saturday}</span>
              </div>
            )}
            {(!businessSettings?.openingHours?.saturday || businessSettings.openingHours.saturday === 'Closed') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ flexShrink: 0, width: '16px', display: 'flex', justifyContent: 'center' }}>
                  <Ban size={15} strokeWidth={2} />
                </span>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>
                  Closed on Saturdays
                </span>
              </div>
            )}
          </div>

         
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
            <SocialBtn href="https://facebook.com" label="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </SocialBtn>
            <SocialBtn href="https://instagram.com" label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </SocialBtn>
            <SocialBtn href="https://tiktok.com" label="TikTok">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </SocialBtn>
            <SocialBtn href={`https://wa.me/${formatPhoneForWhatsApp(businessSettings?.whatsapp)}`} label="WhatsApp">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
            </SocialBtn>
          </div>
        </div>

          {/* 3 link columns — mobile: row 2 (3 cols), desktop: expands into col 2/3/4 */}
          <div className="md:contents">
            <div className="grid grid-cols-3 md:contents gap-6">

              {/* Shop */}
              <div>
                <h4
                  style={{
                    color: 'var(--color-taupe)',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    marginBottom: '1.4rem',
                  }}
                >
                  Shop
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <FooterLink to="/shop">All Products</FooterLink>
                  <FooterLink to="/shop?category=eyeglasses">Eyeglasses</FooterLink>
                  <FooterLink to="/shop?category=sunglasses">Sunglasses</FooterLink>
                  <FooterLink to="/shop?category=watches">Watches</FooterLink>
                  <FooterLink to="/shop?category=perfumes">Perfumes</FooterLink>
                  <FooterLink to="/shop?discount=true">Sale & Offers</FooterLink>
                </ul>
              </div>

              {/* Account */}
              <div>
                <h4
                  style={{
                    color: 'var(--color-taupe)',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    marginBottom: '1.4rem',
                  }}
                >
                  Account
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <FooterLink to="/account">My Account</FooterLink>
                  <FooterLink to="/orders">My Orders</FooterLink>
                  <FooterLink to="/wishlist">Wishlist</FooterLink>
                  <FooterLink to="/rewards">Rewards & Coins</FooterLink>
                  <FooterLink to="/cart">My Cart</FooterLink>
                </ul>
              </div>

              {/* Information */}
              <div>
                <h4
                  style={{
                    color: 'var(--color-taupe)',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    marginBottom: '1.4rem',
                  }}
                >
                  Information
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <FooterLink to="/how-to-choose-eyewear">How to Choose Eyewear</FooterLink>
                  <FooterLink to="/shipping">Shipping Info</FooterLink>
                  <FooterLink to="/returns">Return & Refund</FooterLink>
                  <FooterLink to="/privacy">Privacy Policy</FooterLink>
                  <FooterLink to="/terms">Terms of Service</FooterLink>
                  <FooterLink to="/contact">Contact Us</FooterLink>
                  <FooterLink to="/faq">FAQ</FooterLink>
                </ul>

                <div
                  style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    border: '1px solid rgba(165,152,135,0.25)',
                    textAlign: 'center',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      color: 'var(--color-taupe)',
                      fontSize: '1.8rem',
                      fontWeight: '700',
                      lineHeight: '1',
                      marginBottom: '4px',
                    }}
                  >
                    50+
                  </p>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Years of Service
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Feature Badges Bar */}
      <div className="border-b border-white/10">
        <div style={{ maxWidth: '80rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(36px, 8vw, 64px)', paddingRight: 'clamp(16px, 8vw, 64px)', paddingTop: '1rem', paddingBottom: '1rem' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { Icon: Shield, text: 'Secure Payments' },
            { Icon: Truck, text: 'Free Shipping Over Rs.5k' },
            { Icon: Gem, text: 'Genuine Products' },
            { Icon: Tag, text: 'Daily Discounts' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2.5">
              <item.Icon size={18} strokeWidth={2} className="text-white/70 shrink-0" />
              <span className="text-white/70 text-xs sm:text-sm font-medium">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div style={{ maxWidth: '80rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(36px, 8vw, 64px)', paddingRight: 'clamp(16px, 8vw, 64px)', paddingTop: '1rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
        className="sm:flex-row sm:justify-between sm:items-center sm:text-left text-xs text-center text-white/40">
        <p>© 2026 Mega Himalaya Optical House, Pokhara. All rights reserved.</p>
        <p>Developed by POCOMAT</p>
      </div>

      <StoreLocatorModal />
    </footer>
  )
}

export default Footer