const testimonials = [
    {
        id: 1,
        name: 'Manisha Shahi',
        rating: 5,
        review:
            'Absolutely love this product. The quality is outstanding and it looks even better in person.',
        location: 'Pokhara, Nepal',
    },
    {
        id: 2,
        name: 'Biswas Adhikari',
        rating: 4,
        review:
            'Great product for the price. Fast delivery from Mega Himalaya. Will buy again.',
        location: 'Pokhara, Nepal',
    },
    {
        id: 3,
        name: 'Anisha Bhandari',
        rating: 5,
        review:
            'Premium quality. Exactly as described. Highly recommend.',
        location: 'Pokhara, Nepal',
    },
];

function Testimonials() {
    return (
        <section
            style={{
                backgroundColor: 'var(--color-sbg)',
                padding: '80px 5rem',
            }}
        >
            {/* Section Header */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: '56px',
                }}
            >
                <p
                    style={{
                        color: 'var(--color-taupe)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        marginBottom: '12px',
                    }}
                >
                    CUSTOMER FAVOURITES
                </p>

                <h2
                    style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        color: 'var(--color-navy)',
                        lineHeight: '1.2',
                    }}
                >
                    What Pokhara Says
                </h2>
            </div>

            {/* Testimonials Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                }}
            >
                {testimonials.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            backgroundColor: 'var(--color-sbg)',
                            borderRadius: '16px',
                            padding: '32px',
                            border: '3px solid var(--color-border)',
                            borderTop: '3px solid var(--color-taupe)',
                            boxShadow: '0 4px 16px rgba(13,32,49,0.08)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 16px 40px rgba(13,32,49,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,32,49,0.08)';
                        }}
                    >
                        {/* Stars */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '4px',
                                marginBottom: '16px',
                            }}
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill={
                                        star <= t.rating
                                            ? 'var(--color-taupe)'
                                            : 'none'
                                    }
                                    stroke="var(--color-taupe)"
                                    strokeWidth="2"
                                >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            ))}
                        </div>

                        {/* Review */}
                        <p
                            style={{
                                fontSize: '0.9rem',
                                color: 'var(--color-muted)',
                                lineHeight: '1.7',
                                marginBottom: '24px',
                                fontStyle: 'italic',
                            }}
                        >
                            "{t.review}"
                        </p>

                        {/* Customer Information */}
                        <div
                            style={{
                                borderTop:
                                    '1px solid var(--color-border)',
                                paddingTop: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            {/* Avatar */}
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-navy)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-taupe)',
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    fontFamily: 'var(--font-serif)',
                                    flexShrink: 0,
                                }}
                            >
                                {t.name.charAt(0)}
                            </div>

                            {/* Name and Location */}
                            <div>
                                <p
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: 'var(--color-navy)',
                                        marginBottom: '2px',
                                    }}
                                >
                                    {t.name}
                                </p>

                                <p
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--color-muted)',
                                    }}
                                >
                                    {t.location}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Testimonials;