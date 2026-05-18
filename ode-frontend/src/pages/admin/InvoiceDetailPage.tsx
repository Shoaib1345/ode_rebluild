import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: number
  fee_type: string | null
  amount: string
  quantity: number
  policy: string | null
}

interface CoverageLine {
  id: number
  benefit_type: string | null
  benefit_value: string | null
}

interface InvoiceDetail {
  id: number
  lead_id: number | null
  type: 'single' | 'multi_plan'
  encode_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  email_cc: string | null
  email_bcc: string | null
  email_subject: string | null
  event_type: string | null
  carrier: string | null
  effective_date: string | null
  expiration_date: string | null
  min_limit: number | null
  max_limit: number | null
  broker_fee: string | null
  processing_fee: string | null
  total_premium: string | null
  total_payable: string
  street: string | null
  suite: string | null
  city: string | null
  state: string | null
  zip: string | null
  invoice_status: 0 | 1
  paypal_transaction_id: string | null
  created_at: string
  line_items: LineItem[]
  coverage_lines: CoverageLine[]
  lead: { id: number; event_name: string | null; email: string | null; first_name: string | null; last_name: string | null } | null
  created_by: { id: number; first_name: string; last_name: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtDateTime(str: string) {
  return new Date(str).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function val(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-36 flex-shrink-0 text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  )
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchInvoice(id: string): Promise<InvoiceDetail> {
  const res = await api.get<InvoiceDetail>(`/admin/invoices/${id}`)
  return res.data
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ['admin-invoice', id],
    queryFn:  () => fetchInvoice(id!),
    enabled:  !!id,
  })

  // Mark paid / unpaid toggle
  const patch = useMutation({
    mutationFn: (status: 0 | 1) =>
      api.patch(`/admin/invoices/${id}`, { invoice_status: status }).then((r) => r.data as InvoiceDetail),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-invoice', id], updated)
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
    },
  })

  // Delete
  const destroy = useMutation({
    mutationFn: () => api.delete(`/admin/invoices/${id}`),
    onSuccess: () => navigate('/admin/invoices', { replace: true }),
  })

  const handleDelete = () => {
    if (window.confirm('Delete this invoice? This cannot be undone.')) {
      destroy.mutate()
    }
  }

  // ── Loading / error ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4 max-w-4xl">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      </AdminLayout>
    )
  }

  if (isError || !inv) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
          Invoice not found.{' '}
          <button onClick={() => navigate('/admin/invoices')} className="underline">Back to invoices</button>
        </div>
      </AdminLayout>
    )
  }

  const isPaid = inv.invoice_status === 1
  const lineItemsTotal = inv.line_items.reduce((s, l) => s + Number(l.amount) * l.quantity, 0)

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button onClick={() => navigate('/admin/invoices')}
              className="text-xs text-[#1CA0DF] hover:text-[#105778] mb-1 block">
              ← Back to invoices
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              Invoice #{inv.id}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {isPaid ? 'Paid' : 'Unpaid'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${inv.type === 'multi_plan' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {inv.type === 'multi_plan' ? 'Multi-plan' : 'Single plan'}
              </span>
              <span className="text-xs text-gray-400">Created {fmtDateTime(inv.created_at)}</span>
              {inv.created_by && (
                <span className="text-xs text-gray-400">
                  by {inv.created_by.first_name} {inv.created_by.last_name}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => patch.mutate(isPaid ? 0 : 1)}
              disabled={patch.isPending}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 ${
                isPaid
                  ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {patch.isPending ? '…' : isPaid ? 'Mark unpaid' : 'Mark as paid'}
            </button>
            {!isPaid && (
              <button
                onClick={handleDelete}
                disabled={destroy.isPending}
                className="px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left (2/3) ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Recipient */}
            <Section title="Recipient">
              <Row label="Name"    value={val(`${inv.first_name ?? ''} ${inv.last_name ?? ''}`.trim())} />
              <Row label="Email"   value={inv.email
                ? <a href={`mailto:${inv.email}`} className="text-[#1CA0DF] hover:underline">{inv.email}</a>
                : '—'} />
              {inv.email_cc  && <Row label="CC"  value={inv.email_cc} />}
              {inv.email_bcc && <Row label="BCC" value={inv.email_bcc} />}
              {inv.email_subject && <Row label="Subject" value={inv.email_subject} />}
            </Section>

            {/* Coverage */}
            <Section title="Coverage">
              <Row label="Event type"       value={val(inv.event_type)} />
              <Row label="Carrier"          value={val(inv.carrier)} />
              <Row label="Effective date"   value={fmtDate(inv.effective_date)} />
              <Row label="Expiration date"  value={fmtDate(inv.expiration_date)} />
              <Row label="Limits"           value={inv.min_limit && inv.max_limit ? `${inv.min_limit}M / ${inv.max_limit}M` : '—'} />
              {(inv.street || inv.city) && (
                <Row label="Address" value={[inv.street, inv.suite, inv.city, inv.state, inv.zip].filter(Boolean).join(', ')} />
              )}
            </Section>

            {/* Line items */}
            {inv.line_items.length > 0 && (
              <Section title="Line items">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">Fee type</th>
                      <th className="text-left pb-2 font-medium">Policy</th>
                      <th className="text-center pb-2 font-medium">Qty</th>
                      <th className="text-right pb-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inv.line_items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 text-gray-700">{item.fee_type ?? '—'}</td>
                        <td className="py-2 text-gray-500 text-xs">{item.policy ?? '—'}</td>
                        <td className="py-2 text-center text-gray-500">{item.quantity}</td>
                        <td className="py-2 text-right font-medium text-gray-800">
                          ${(Number(item.amount) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td colSpan={3} className="pt-2 text-xs text-gray-400">Line items total</td>
                      <td className="pt-2 text-right font-semibold text-gray-800">${lineItemsTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </Section>
            )}

            {/* Coverage display lines */}
            {inv.coverage_lines.length > 0 && (
              <Section title="Coverage display lines">
                <div className="space-y-1.5">
                  {inv.coverage_lines.map((line) => (
                    <div key={line.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500">{line.benefit_type}</span>
                      <span className="font-medium text-gray-800">{line.benefit_value}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>

          {/* ── Right (1/3) ─────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Pricing summary */}
            <Section title="Pricing">
              {inv.total_premium && <Row label="Premium"      value={`$${Number(inv.total_premium).toFixed(2)}`} />}
              {inv.broker_fee    && <Row label="Broker fee"   value={`$${Number(inv.broker_fee).toFixed(2)}`} />}
              {inv.processing_fee && <Row label="Processing"  value={`$${Number(inv.processing_fee).toFixed(2)}`} />}
              <div className="flex gap-2 pt-2 border-t border-gray-100 mt-1">
                <span className="w-36 flex-shrink-0 text-xs font-semibold text-gray-600">Total payable</span>
                <span className="text-base font-bold text-[#105778]">${Number(inv.total_payable).toFixed(2)}</span>
              </div>
              {inv.paypal_transaction_id && (
                <Row label="Transaction ID" value={<span className="font-mono text-xs">{inv.paypal_transaction_id}</span>} />
              )}
            </Section>

            {/* Public payment link */}
            <Section title="Payment link">
              <p className="text-xs text-gray-400 mb-2">
                Share this link with the customer to pay online.
              </p>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-xs font-mono text-gray-600 break-all">/invoice/{inv.encode_id}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invoice/${inv.encode_id}`)}
                className="mt-2 text-xs text-[#1CA0DF] hover:text-[#105778] transition-colors"
              >
                Copy link
              </button>
            </Section>

            {/* Linked lead */}
            {inv.lead && (
              <Section title="Linked lead">
                <p className="text-sm text-gray-700 mb-1">
                  {inv.lead.first_name} {inv.lead.last_name}
                </p>
                <p className="text-xs text-gray-400 mb-3">{inv.lead.event_name ?? ''}</p>
                <button
                  onClick={() => navigate(`/admin/leads/${inv.lead!.id}`)}
                  className="text-xs text-[#1CA0DF] hover:text-[#105778] transition-colors"
                >
                  View lead #{inv.lead.id} →
                </button>
              </Section>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
