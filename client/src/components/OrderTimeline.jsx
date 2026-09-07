function OrderTimeline({ status, statusHistory = [] }) {
  const steps = [
    {
      key: 'Processing',
      label: 'Order Placed',
      description: 'Your order has been received',
    },
    {
      key: 'Confirmed',
      label: 'Order Confirmed',
      description: 'Your order has been confirmed',
    },
    {
      key: 'Shipped',
      label: 'Shipped',
      description: 'Your order is on its way',
    },
    {
      key: 'Delivered',
      label: 'Delivered',
      description: 'Your order has been delivered',
    },
  ]

  const getHistoryEntry = (statusKey) => {
    return statusHistory.find((entry) => entry.status === statusKey)
  }

  const formatDate = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const statusIndex = steps.findIndex((step) => step.key === status)

  // Cancelled order
  if (status === 'Cancelled') {
    const cancelledEntry = getHistoryEntry('Cancelled')

    return (
      <div
        style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <p
          style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
            marginBottom: '18px',
          }}
        >
          Order Tracking
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            ×
          </div>

          <div>
            <p
              style={{
                fontSize: '0.82rem',
                fontWeight: '700',
                color: '#dc2626',
                marginBottom: '3px',
              }}
            >
              Order Cancelled
            </p>

            <p
              style={{
                fontSize: '0.74rem',
                color: 'var(--color-muted)',
              }}
            >
              {cancelledEntry?.changedAt
                ? formatDate(cancelledEntry.changedAt)
                : 'Order cancelled'}
            </p>

            {cancelledEntry?.note && (
              <p
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--color-muted)',
                  marginTop: '4px',
                }}
              >
                {cancelledEntry.note}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <p
        style={{
          fontSize: '0.72rem',
          fontWeight: '700',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginBottom: '18px',
        }}
      >
        Order Tracking
      </p>

      <div>
        {steps.map((step, index) => {
          const isCompleted = index < statusIndex
          const isCurrent = index === statusIndex
          const isLast = index === steps.length - 1

          const historyEntry = getHistoryEntry(step.key)

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                position: 'relative',
                minHeight: isLast ? '42px' : '70px',
              }}
            >
              {/* Vertical line */}
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '26px',
                    width: '2px',
                    height: '44px',
                    backgroundColor:
                      index < statusIndex
                        ? 'var(--color-navy)'
                        : 'var(--color-border)',
                  }}
                />
              )}

              {/* Status circle */}
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  zIndex: 1,
                  backgroundColor:
                    isCompleted || isCurrent
                      ? 'var(--color-navy)'
                      : 'var(--color-white)',
                  color:
                    isCompleted || isCurrent
                      ? '#ffffff'
                      : 'var(--color-muted)',
                  border:
                    isCompleted || isCurrent
                      ? '2px solid var(--color-navy)'
                      : '2px solid var(--color-border)',
                }}
              >
                {isCompleted ? '✓' : isCurrent ? '●' : ''}
              </div>

              {/* Status information */}
              <div
                style={{
                  marginLeft: '14px',
                  paddingBottom: isLast ? '0' : '20px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: isCurrent ? '700' : '600',
                    color:
                      isCompleted || isCurrent
                        ? 'var(--color-navy)'
                        : 'var(--color-muted)',
                    marginBottom: '3px',
                  }}
                >
                  {step.label}
                </p>

                <p
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-muted)',
                    marginBottom: '3px',
                  }}
                >
                  {step.description}
                </p>

                {historyEntry?.changedAt && (
                  <p
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--color-muted)',
                    }}
                  >
                    {formatDate(historyEntry.changedAt)}
                  </p>
                )}

                {historyEntry?.note && (
                    <p
                    style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-muted)',
                        marginTop: '4px',
                        lineHeight: '1.5',
                    }}
                    >
                        {historyEntry.note}
                    </p>
                ) }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderTimeline