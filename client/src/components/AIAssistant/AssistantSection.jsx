import AssistantChat from './AssistantChat'

function AssistantSection() {
  return (
    <section
      style={{
        backgroundColor: '#f4f0eb',
        padding: '72px 24px',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: '#a59887',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '10px',
          }}
        >
          Personal Concierge
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 700,
            color: '#0d2031',
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Not sure what you're looking for?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: '#6b6862',
            textAlign: 'center',
            marginBottom: '32px',
            lineHeight: 1.6,
          }}
        >
          Describe the occasion, budget, or style you have in mind - our AI assistant will pull
          matching pieces from the collection.
        </p>

        <AssistantChat />
      </div>
    </section>
  )
}

export default AssistantSection