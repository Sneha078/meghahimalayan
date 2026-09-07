import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getAdminReturnById,
  updateReturnStatus,
  processReturnRefund,
  deleteReturn,
} from '../../api/adminClient'

const STATUS_COLORS = {
  Pending:          { bg: '#fef9c3', color: '#854d0e' },
  Approved:         { bg: '#dbeafe', color: '#1e40af' },
  'Item Received':  { bg: '#ede9fe', color: '#6d28d9' },
  Completed:        { bg: '#dcfce7', color: '#15803d' },
  Rejected:         { bg: '#fee2e2', color: '#dc2626' },
  Cancelled:        { bg: '#f1f5f9', color: '#64748b' },
  Expired:          { bg: '#f1f5f9', color: '#64748b' },
}

const ITEM_CONDITIONS = ['Unopened', 'Opened/Good', 'Damaged/Defective', 'Missing Parts']
const REFUND_METHODS = ['Bank Transfer', 'eSewa/Khalti', 'Store Credit', 'Original Payment Method']
const DELETABLE_STATUSES = ['Completed', 'Rejected', 'Cancelled', 'Expired']

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '24px',
  marginBottom: '20px',
}

const sectionLabel = {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '12px',
}

const fieldInput = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '0.85rem',
  outline: 'none',
}

const primaryBtn = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'var(--color-navy)',
  color: '#ffffff',
  fontSize: '0.82rem',
  fontWeight: '700',
  cursor: 'pointer',
}

const dangerBtn = { ...primaryBtn, backgroundColor: '#dc2626' }
const secondaryBtn = {
  ...primaryBtn,
  backgroundColor: '#ffffff',
  color: '#334155',
  border: '1px solid #e2e8f0',
}

function AdminReturnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ret, setRet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [adminRemarks, setAdminRemarks] = useState('')
  const [inspections, setInspections] = useState({}) // productId -> { itemCondition, restockable }
  const [refundMethod, setRefundMethod] = useState('')
  const [refundDetails, setRefundDetails] = useState({})
  const [refundAmount, setRefundAmount] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getAdminReturnById(id)
      .then((data) => {
        const doc = data.return ?? data
        setRet(doc)
        setRefundMethod(doc.refund?.method ?? '')
        setRefundDetails(doc.refund?.details ?? {})
        setRefundAmount(doc.refund?.approvedAmount || doc.refund?.requestedAmount || '')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const runAction = async (payload, { refundEndpoint = false } = {}) => {
    setActionLoading(true)
    setActionError('')
    try {
      if (refundEndpoint) {
        await processReturnRefund(id, payload)
      } else {
        await updateReturnStatus(id, payload)
      }
      setAdminRemarks('')
      load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleInspectionChange = (productId, field, value) => {
    setInspections((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }))
  }

  const submitItemReceived = () => {
    const itemInspections = (ret.items ?? []).map((item) => {
      const productId = item.product?._id ?? item.product
      const insp = inspections[productId] ?? {}
      return {
        productId,
        itemCondition: insp.itemCondition ?? 'Opened/Good',
        restockable: insp.restockable ?? false,
      }
    })
    runAction({ status: 'Item Received', itemInspections, adminRemarks: adminRemarks || undefined })
  }

  const submitRefundApproval = () => {
    runAction({
      status: 'Item Received', // self-transition — just updates refund fields
      refundMethod,
      refundDetails,
      refundAmount: Number(refundAmount),
      adminRemarks: adminRemarks || undefined,
    })
  }

  const submitProcessRefund = () => {
    runAction({ markCompleted: true }, { refundEndpoint: true })
  }

  const handleDelete = async () => {
    if (!window.confirm('Archive this return request? This cannot be undone.')) return
    setActionLoading(true)
    try {
      await deleteReturn(id)
      navigate('/admin/returns')
    } catch (err) {
      setActionError(err.message)
      setActionLoading(false)
    }
  }

  if (loading) return <div style={{ padding: '32px', color: '#64748b' }}>Loading return…</div>

  if (error || !ret) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: '0.88rem',
        }}>
          {error || 'Return not found'}
        </div>
      </div>
    )
  }

  const s = STATUS_COLORS[ret.status] ?? STATUS_COLORS.Pending
  const requestedAmount = ret.refund?.requestedAmount ?? 0

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/admin/returns" style={{ fontSize: '0.82rem', color: '#64748b', textDecoration: 'none' }}>
          ← Back to Returns
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
            Return #{ret.returnNumber ?? ret._id.slice(-6).toUpperCase()}
          </h1>
          <span style={{
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '0.75rem', fontWeight: '700',
            backgroundColor: s.bg, color: s.color,
          }}>
            {ret.status}
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
          Order #{ret.order?.orderNumber ?? '—'} · Refund status: {ret.refundStatus}
        </p>
      </div>

      {actionError && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: '0.88rem', marginBottom: '20px',
        }}>
          {actionError}
        </div>
      )}

      {/* Customer & reason */}
      <div style={card}>
        <p style={sectionLabel}>Customer</p>
        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{ret.user?.name ?? '—'}</p>
        <p style={{ fontSize: '0.82rem', color: '#64748b' }}>{ret.user?.email} {ret.user?.phone ? `· ${ret.user.phone}` : ''}</p>

        <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '16px 0' }} />

        <p style={sectionLabel}>Reason</p>
        <p style={{ fontSize: '0.88rem', color: '#0f172a', marginBottom: '8px' }}>{ret.reason}</p>
        {ret.description && (
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>{ret.description}</p>
        )}
      </div>

      {/* Items */}
      <div style={card}>
        <p style={sectionLabel}>Items ({ret.items?.length ?? 0})</p>

        {(ret.items ?? []).map((item) => {
          const productId = item.product?._id ?? item.product
          const insp = inspections[productId] ?? {}
          const showInspection = ret.status === 'Approved'

          return (
            <div key={productId} style={{
              padding: '14px 0', borderTop: '1px solid #f1f5f9',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: '600', color: '#0f172a' }}>{item.name}</p>
                  <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Qty: {item.quantity} · Rs. {item.itemPrice?.toLocaleString()} each · Reason: {item.reason}
                  </p>
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                  Rs. {(item.refundUnitPrice * item.quantity)?.toLocaleString()}
                </p>
              </div>

              {!showInspection && item.itemCondition && item.itemCondition !== 'Not Evaluated' && (
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Condition: {item.itemCondition} · {item.restockable ? 'Restockable' : 'Not restockable'}
                </p>
              )}

              {showInspection && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={insp.itemCondition ?? ''}
                    onChange={(e) => handleInspectionChange(productId, 'itemCondition', e.target.value)}
                    style={{ ...fieldInput, width: 'auto' }}
                  >
                    <option value="">Select condition…</option>
                    {ITEM_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={insp.restockable ?? false}
                      disabled={['Damaged/Defective', 'Missing Parts'].includes(insp.itemCondition)}
                      onChange={(e) => handleInspectionChange(productId, 'restockable', e.target.checked)}
                    />
                    Restockable
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Refund summary */}
      <div style={card}>
        <p style={sectionLabel}>Refund</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Requested</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>Rs. {requestedAmount.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Approved</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>Rs. {(ret.refund?.approvedAmount ?? 0).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Method</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{ret.refund?.method ?? '—'}</span>
        </div>

        {ret.refundTransaction?.transactionId && (
          <>
            <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '16px 0' }} />
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Payout: {ret.refundTransaction.provider} · {ret.refundTransaction.transactionId} · Rs. {ret.refundTransaction.amount?.toLocaleString()}
            </p>
          </>
        )}
      </div>

      {/* ACTIONS — vary by current status */}
      <div style={card}>
        <p style={sectionLabel}>Actions</p>

        {(ret.status === 'Pending' || ret.status === 'Approved') && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
              Admin remarks {ret.status === 'Pending' ? '(required to reject)' : ''}
            </label>
            <textarea
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              rows={2}
              style={{ ...fieldInput, resize: 'vertical' }}
              placeholder="Optional note for status history"
            />
          </div>
        )}

        {ret.status === 'Pending' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              disabled={actionLoading}
              onClick={() => runAction({ status: 'Approved', adminRemarks: adminRemarks || undefined })}
              style={primaryBtn}
            >
              Approve Return
            </button>
            <button
              disabled={actionLoading || !adminRemarks.trim()}
              onClick={() => runAction({ status: 'Rejected', adminRemarks })}
              style={dangerBtn}
            >
              Reject Return
            </button>
          </div>
        )}

        {ret.status === 'Approved' && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button disabled={actionLoading} onClick={submitItemReceived} style={primaryBtn}>
              Mark Item Received
            </button>
            <button
              disabled={actionLoading || !adminRemarks.trim()}
              onClick={() => runAction({ status: 'Rejected', adminRemarks })}
              style={dangerBtn}
            >
              Reject Return
            </button>
            <button
              disabled={actionLoading}
              onClick={() => runAction({ status: 'Expired', adminRemarks: adminRemarks || undefined })}
              style={secondaryBtn}
            >
              Mark Expired
            </button>
          </div>
        )}

        {ret.status === 'Item Received' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Refund method
                </label>
                <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} style={fieldInput}>
                  <option value="">Select method…</option>
                  {REFUND_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Approve amount (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  max={requestedAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  style={fieldInput}
                />
              </div>
            </div>

            {refundMethod === 'Bank Transfer' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <input
                  placeholder="Account holder name"
                  value={refundDetails.accountHolderName ?? ''}
                  onChange={(e) => setRefundDetails((p) => ({ ...p, accountHolderName: e.target.value }))}
                  style={{ ...fieldInput, flex: '1 1 180px' }}
                />
                <input
                  placeholder="Account number"
                  value={refundDetails.accountNumber ?? ''}
                  onChange={(e) => setRefundDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                  style={{ ...fieldInput, flex: '1 1 160px' }}
                />
                <input
                  placeholder="Bank name"
                  value={refundDetails.bankName ?? ''}
                  onChange={(e) => setRefundDetails((p) => ({ ...p, bankName: e.target.value }))}
                  style={{ ...fieldInput, flex: '1 1 160px' }}
                />
              </div>
            )}

            {refundMethod === 'eSewa/Khalti' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <select
                  value={refundDetails.walletProvider ?? ''}
                  onChange={(e) => setRefundDetails((p) => ({ ...p, walletProvider: e.target.value }))}
                  style={{ ...fieldInput, flex: '1 1 140px' }}
                >
                  <option value="">Wallet provider…</option>
                  <option value="eSewa">eSewa</option>
                  <option value="Khalti">Khalti</option>
                </select>
                <input
                  placeholder="Wallet ID"
                  value={refundDetails.walletId ?? ''}
                  onChange={(e) => setRefundDetails((p) => ({ ...p, walletId: e.target.value }))}
                  style={{ ...fieldInput, flex: '1 1 160px' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                disabled={actionLoading || !refundMethod || !refundAmount}
                onClick={submitRefundApproval}
                style={secondaryBtn}
              >
                Save Refund Approval
              </button>

              <button
                disabled={actionLoading || !(ret.refund?.approvedAmount > 0) || ret.refundStatus === 'Succeeded'}
                onClick={submitProcessRefund}
                style={primaryBtn}
              >
                Process Refund &amp; Complete
              </button>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '8px' }}>
              Save the refund method/amount first, then process the payout once you've sent the money manually.
            </p>
          </div>
        )}

        {DELETABLE_STATUSES.includes(ret.status) && (
          <button disabled={actionLoading} onClick={handleDelete} style={{ ...secondaryBtn, marginTop: ret.status === 'Item Received' ? '20px' : '0' }}>
            Archive Return
          </button>
        )}
      </div>

      {/* History */}
      <div style={card}>
        <p style={sectionLabel}>Status History</p>
        {(ret.statusHistory ?? []).slice().reverse().map((h, i) => (
          <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a' }}>{h.status}</span>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                {new Date(h.changedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {h.note && <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{h.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminReturnDetail