
import React from 'react'

function Privacy() {
  return (
    <main
      style={{
        backgroundColor: '#f8f6f2',
        minHeight: '100vh',
        padding: '60px 20px 80px',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '50px' }}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-taupe)',
              marginBottom: '10px',
            }}
          >
            Legal
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 700,
              color: '#0d2031',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Privacy Policy
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: '#6b6862',
              marginTop: '12px',
            }}
          >
            Last updated: September 6, 2026
          </p>
        </div>

        {/* Introduction */}
        <section style={{ marginBottom: '38px' }}>
          <p>
            At Mega Himalaya Optical, we respect your privacy and are committed
            to protecting the personal information you share with us. This
            Privacy Policy explains what information we collect, how we use it,
            and how we protect it when you use our website and services.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <p>
            We may collect information that you provide directly when you
            create an account, place an order, contact us, or use other
            features of our website.
          </p>

          <p>This may include:</p>

          <ul>
            <li>Your name and contact information.</li>
            <li>Email address and phone number.</li>
            <li>Shipping and billing information.</li>
            <li>Account login information.</li>
            <li>Order and purchase history.</li>
            <li>Information you provide when contacting customer support.</li>
          </ul>

          <p>
            We may also automatically collect limited technical information,
            such as browser type, device information, IP address, and website
            usage data, to help us maintain and improve our services.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>
            We use the information we collect for purposes such as:
          </p>

          <ul>
            <li>Creating and managing your account.</li>
            <li>Processing and delivering your orders.</li>
            <li>Processing payments and related transactions.</li>
            <li>Providing customer support.</li>
            <li>Sending order and account-related notifications.</li>
            <li>Improving our website, products, and services.</li>
            <li>Preventing fraud, abuse, and unauthorized activity.</li>
            <li>Complying with applicable legal requirements.</li>
          </ul>
        </Section>

        <Section title="3. Payment Information">
          <p>
            Payment information is used only for processing your transactions.
            We do not intentionally store complete payment-card information
            unless required and securely supported by our payment-processing
            systems.
          </p>

          <p>
            Where third-party payment providers are used, their own privacy
            policies and terms may also apply.
          </p>
        </Section>

        <Section title="4. Cookies and Similar Technologies">
          <p>
            Our website may use cookies or similar technologies to maintain
            sessions, remember preferences, understand website usage, and
            improve your browsing experience.
          </p>

          <p>
            You can manage or disable cookies through your browser settings.
            Disabling certain cookies may affect some functionality of the
            website.
          </p>
        </Section>

        <Section title="5. Sharing of Information">
          <p>
            We do not sell your personal information.
          </p>

          <p>
            We may share necessary information with trusted service providers
            when required to operate our business, including services involved
            in payment processing, order delivery, website hosting, analytics,
            and customer support.
          </p>

          <p>
            We may also disclose information when required by law, to protect
            our legal rights, or to prevent fraud or security threats.
          </p>
        </Section>

        <Section title="6. Data Security">
          <p>
            We take reasonable technical and organizational measures to protect
            your personal information against unauthorized access, alteration,
            disclosure, or destruction.
          </p>

          <p>
            However, no method of transmitting or storing information online
            can be guaranteed to be completely secure.
          </p>
        </Section>

        <Section title="7. Your Account">
          <p>
            If you create an account with us, you are responsible for keeping
            your account credentials confidential and for notifying us if you
            believe your account has been accessed without authorization.
          </p>

          <p>
            You may contact us regarding your personal information or account
            information where applicable.
          </p>
        </Section>

        <Section title="8. Third-Party Services">
          <p>
            Our website may use third-party services for functions such as
            payments, maps, analytics, authentication, hosting, or delivery.
            These services may process information according to their own
            privacy policies.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Our website is not intended to knowingly collect personal
            information from children without appropriate consent. If you
            believe that a child has provided personal information to us,
            please contact us so that we can take appropriate action.
          </p>
        </Section>

        <Section title="10. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes to our services, practices, or legal requirements.
          </p>

          <p>
            When changes are made, the updated policy will be posted on this
            page with a revised "Last updated" date.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            If you have questions, concerns, or requests regarding this
            Privacy Policy or your personal information, please contact Mega
            Himalaya Optical through the contact information provided on our
            website.
          </p>
        </Section>

        {/* Footer note */}
        <div
          style={{
            marginTop: '55px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(13, 32, 49, 0.12)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              color: '#6b6862',
              margin: 0,
            }}
          >
            Mega Himalaya Optical · Pokhara, Nepal
          </p>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }) {
  return (
    <section
      style={{
        marginBottom: '38px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.35rem',
          fontWeight: 700,
          color: '#0d2031',
          marginBottom: '14px',
        }}
      >
        {title}
      </h2>

      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.92rem',
          lineHeight: 1.8,
          color: '#4f4c47',
        }}
      >
        {children}
      </div>
    </section>
  )
}

export default Privacy

