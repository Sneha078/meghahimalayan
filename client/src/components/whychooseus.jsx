const features =[
  {
     id: 1,
    icon: '🚚',  
    title: 'Free Shipping',
    description: 'On orders above Rs 5,000 across Nepal',
    },
    {
        id: 2,
        icon:'🎁',
        title: 'Daily Surprises',
        description: 'Up to 10% discount every day on selected items',
    },
    {
        id: 3,
        icon:'🏭',
        title: 'Factory Prices',
        description: "Direct sourcing keeps prices affordable without compromise",
    },
    {
        id: 4,
        icon: '🔒',
        title: '100% Secure',
        description: 'Protected payments and safe shopping guaranteed',
    },
    {
        id: 5,
        icon:'✅',
        title: 'Genuine Products',
        description: 'Only authentic international brand eyewear, watches and perfumes', 
    },

]

function WhyChooseus() {
    return(
        <section style={{
        backgroundColor: 'var(--color-white)',
        padding: '80px 5rem', 
        }}>
            <div style={{textAlign: 'center', marginBottom: '56px'}}>
                <p style={{
                color: 'var(--color-taupe)',
                fontSize: '0.85rem',
                fontWeight: '800',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',  
                }}>
                    WHY CHOOSE US
                </p>
                <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.5rem',
                fontWeight: '700',
                color: 'var(--color-navy)',
                lineHeight: '1.2', 
                }}>
                    The Mega Himalaya Difference
                </h2>
            </div>

            <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '24px',
            }}>
                {features.map((feature) => (
                    <div
                    key={feature.id}
                    style={{
                    backgroundColor: 'var(--color-sbg)',
                    borderRadius: '16px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    border: '3px solid var(--color-border)',
                    borderTop: '3px solid var(--color-taupe)',
                    boxShadow: '0 4px 16px rgba(13,32,49,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'default',  
                    }}
                    onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)'
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(13,32,49,0.1)'  
                    }}
                    onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none' 
                    }} 
                     >
                        <div style={{
                        fontSize: '2.5rem',
                        marginBottom: '16px',  
                        }}>
                            {feature.icon} 
                            </div>
                            <h3 style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--color-navy)',
                            marginBottom: '10px',  
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{
                            fontSize: '0.82rem',
                            color: 'var(--color-muted)',
                            lineHeight: '1.6', 
                            }}>
                                {feature.description}
                            </p>
                     </div> 
                ))}
            </div>
        </section>
    )
}

export default WhyChooseus
