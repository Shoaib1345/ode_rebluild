import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import type { AdditionalInsured } from '../../types'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 8,
  border: '1px solid #DFDFDF',
  padding: '0 14px',
  fontSize: 14,
  color: '#262D45',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#697386',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
}

const BLANK: AdditionalInsured = {
  name: '', relation: '', street: '', city: '', state: '', zip: '', email: '',
}

export default function QuoteAdditionalInsuredPage() {
  const navigate     = useNavigate()
  const params       = useQuoteStore((s) => s.params)
  const setParams    = useQuoteStore((s) => s.setParams)
  const selectedPlan = useQuoteStore((s) => s.selectedPlan)

  const count = Number(params.additional_insureds ?? 0)

  // Guard: need a selected plan; skip entirely when no additional insureds.
  useEffect(() => {
    if (!selectedPlan) {
      navigate('/quote/plans', { replace: true })
    } else if (count <= 0) {
      navigate('/quote/payment', { replace: true })
    }
  }, [selectedPlan, count, navigate])

  const [rows, setRows] = useState<AdditionalInsured[]>(() => {
    const existing = params.additional_insured_details ?? []
    return Array.from({ length: count }, (_, i) => existing[i] ?? { ...BLANK })
  })

  const update = (i: number, field: keyof AdditionalInsured, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))

  // Require at least a name + relation for each named insured.
  const canNext = rows.length > 0 && rows.every((r) => r.name.trim() && r.relation.trim())

  const handleNext = () => {
    setParams({ additional_insured_details: rows })
    navigate('/quote/payment')
  }

  if (!selectedPlan || count <= 0) return null

  return (
    <QuoteStepLayout
      step={9}
      title="Who else needs to be named on the certificate?"
      subtitle="Add the people or organizations that must appear as additional insureds on your policy."
      backTo="/quote/venue"
    >
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #E3E3E3',
            borderRadius: 12,
            padding: '18px 18px 6px',
            marginBottom: 18,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#262D45', marginBottom: 14 }}>
            Additional Insured {i + 1}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelSt}>Name</label>
              <input style={inputSt} placeholder="Full name or company" value={row.name}
                     onChange={(e) => update(i, 'name', e.target.value)} />
            </div>
            <div>
              <label style={labelSt}>Relation to event</label>
              <input style={inputSt} placeholder="e.g. Venue, Caterer" value={row.relation}
                     onChange={(e) => update(i, 'relation', e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Street Address</label>
            <input style={inputSt} placeholder="Street address" value={row.street}
                   onChange={(e) => update(i, 'street', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelSt}>City</label>
              <input style={inputSt} placeholder="City" value={row.city}
                     onChange={(e) => update(i, 'city', e.target.value)} />
            </div>
            <div>
              <label style={labelSt}>State</label>
              <input style={inputSt} placeholder="CA" maxLength={2} value={row.state}
                     onChange={(e) => update(i, 'state', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} />
            </div>
            <div>
              <label style={labelSt}>Zip</label>
              <input style={inputSt} placeholder="Zip" maxLength={5} value={row.zip}
                     onChange={(e) => update(i, 'zip', e.target.value.replace(/\D/g, '').slice(0, 5))} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Email (optional)</label>
            <input style={inputSt} type="email" placeholder="email@example.com" value={row.email}
                   onChange={(e) => update(i, 'email', e.target.value)} />
          </div>
        </div>
      ))}

      <QuoteNextBtn onClick={handleNext} disabled={!canNext} />
    </QuoteStepLayout>
  )
}
