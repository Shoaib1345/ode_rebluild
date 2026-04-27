import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout, { QuoteOptionBtn, QuoteNextBtn } from './QuoteStepLayout'

// ─── Info tooltip ─────────────────────────────────────────────────────────────

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 6, verticalAlign: 'middle' }}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((s) => !s)}
        style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'rgba(28,160,221,0.15)', border: 'none',
          color: '#1087c3', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', lineHeight: '18px', textAlign: 'center', padding: 0,
        }}
        aria-label="More information"
      >
        i
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: '130%', left: '50%',
          transform: 'translateX(-50%)', width: 210,
          backgroundColor: '#262D45', color: '#fff', fontSize: 12,
          borderRadius: 8, padding: '8px 12px', zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.20)', lineHeight: '18px',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </span>
  )
}

// ─── Toggle row (matches ode_new ODE7 layout — label + Yes/No, no border box) ─

function ToggleRow({
  label, tip, value, onChange, warning,
}: {
  label: string
  tip: string
  value: 0 | 1
  onChange: (v: 0 | 1) => void
  warning?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#262D45', marginBottom: 10 }}>
        {label}
        <InfoTip text={tip} />
      </p>
      {warning}
      <div style={{ display: 'flex', gap: 12 }}>
        {([1, 0] as const).map((v) => (
          <QuoteOptionBtn key={v} active={value === v} onClick={() => onChange(v)} fullWidth>
            {v === 1 ? 'Yes' : 'No'}
          </QuoteOptionBtn>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteAddonsPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  const isVendor = !!params.isVendor

  useEffect(() => {
    if (isVendor && !params.event_state) navigate('/quote/location', { replace: true })
    else if (!isVendor && params.special_activities === undefined) navigate('/quote/activities', { replace: true })
  }, [isVendor, params.event_state, params.special_activities, navigate])

  const [wos,               setWos]               = useState<0 | 1>(params.w_o_s         ?? 0)
  const [pancb,             setPancb]             = useState<0 | 1>(params.p_a_n_c_b     ?? 0)
  const [noha,              setNoha]              = useState<0 | 1>(params.noha           ?? 0)
  const [additionalInsured, setAdditionalInsured] = useState<string>(String(params.additional_insureds ?? 0))
  const [nohaWarning,       setNohaWarning]       = useState(false)

  const handleNohaChange = (val: 0 | 1) => {
    if (val === 1 && !nohaWarning) { setNohaWarning(true); return }
    setNoha(val)
    if (val === 0) setNohaWarning(false)
  }

  const handleNext = () => {
    setParams({
      w_o_s:               wos,
      p_a_n_c_b:           pancb,
      noha,
      additional_insureds: parseInt(additionalInsured, 10) || 0,
    })
    navigate('/quote/description')
  }

  if (isVendor && !params.event_state) return null
  if (!isVendor && params.special_activities === undefined) return null

  return (
    <QuoteStepLayout
      step={7}
      title="Does your venue require any of these?"
      backTo={isVendor ? '/quote/guests' : '/quote/activities'}
    >

      {/* ── Waiver of Subrogation ─────────────────────────────────────────── */}
      <ToggleRow
        label="Waiver of Subrogation"
        tip="This prevents a carrier from recovering money paid on a claim from a third party."
        value={wos}
        onChange={setWos}
      />

      {/* ── Primary / Non-contributory ────────────────────────────────────── */}
      <ToggleRow
        label="Primary/Non-contributory Basis"
        tip="This makes your insurance the primary coverage so it pays claims first before anyone else's policy has to."
        value={pancb}
        onChange={setPancb}
      />

      {/* ── Hired / Non-owned Auto ────────────────────────────────────────── */}
      <ToggleRow
        label="Hired/Non-owned Auto"
        tip="This covers any hired automobiles involved with the event."
        value={noha}
        onChange={handleNohaChange}
        warning={nohaWarning ? (
          <p style={{ fontSize: 12, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px', marginBottom: 10, lineHeight: '18px' }}>
            <strong>Warning:</strong> Non-Owned/Hired Auto is subject to approval and will affect your quote &amp; premium. If this is required, select Yes.
          </p>
        ) : undefined}
      />

      {/* ── Additional Insured ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#262D45', marginBottom: 10 }}>
          Additional Insured
          <InfoTip text="This is an eligible person, place, or business included in your policy. Vendors cannot be additional insured's." />
        </p>
        <input
          type="number"
          min={0}
          value={additionalInsured}
          onChange={(e) => setAdditionalInsured(e.target.value)}
          placeholder="0"
          style={{
            width: '100%', height: 54, borderRadius: 10,
            border: '1px solid #DFDFDF', padding: '0 16px',
            fontSize: 20, fontWeight: 600, color: '#262D45',
            outline: 'none', boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* ── Hint ─────────────────────────────────────────────────────────── */}
      <p style={{ textAlign: 'center', fontSize: 12, color: '#797979', marginBottom: 4 }}>
        Only select these if you or your venue requires them, usually they are not needed.
      </p>

      {/* ── Next ─────────────────────────────────────────────────────────── */}
      <QuoteNextBtn onClick={handleNext} />

    </QuoteStepLayout>
  )
}
