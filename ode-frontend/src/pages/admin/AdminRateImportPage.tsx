import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateStats {
  event_rates_count: number
  event_rate_states_count: number
  carrier_gl_limits_count: number
}

interface ImportResult {
  message: string
  imported: number
}

interface ImportError {
  message: string
  missing?: string[]
  errors?: string[]
}

type ImportKind = 'rates' | 'gl'

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminRateImportPage() {
  // ── Stats ──────────────────────────────────────────────────────────────────

  const { data: stats, refetch: refetchStats } = useQuery<RateStats>({
    queryKey: ['admin', 'rate-stats'],
    queryFn: () => api.get('/admin/rates/stats').then(r => r.data),
  })

  // ── Per-card state ─────────────────────────────────────────────────────────

  const [ratesReplace, setRatesReplace]     = useState(false)
  const [glReplace, setGlReplace]           = useState(false)
  const [ratesLoading, setRatesLoading]     = useState(false)
  const [glLoading, setGlLoading]           = useState(false)
  const [ratesResult, setRatesResult]       = useState<ImportResult | null>(null)
  const [glResult, setGlResult]             = useState<ImportResult | null>(null)
  const [ratesErrors, setRatesErrors]       = useState<ImportError | null>(null)
  const [glErrors, setGlErrors]             = useState<ImportError | null>(null)

  const ratesFileRef = useRef<HTMLInputElement>(null)
  const glFileRef    = useRef<HTMLInputElement>(null)

  // ── Import handler ─────────────────────────────────────────────────────────

  async function handleImport(kind: ImportKind) {
    const fileRef = kind === 'rates' ? ratesFileRef : glFileRef
    const file    = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Please select a CSV file first.')
      return
    }

    const endpoint = kind === 'rates' ? '/admin/rates/import' : '/admin/rates/import/gl'
    const replace  = kind === 'rates' ? ratesReplace : glReplace
    const setLoad  = kind === 'rates' ? setRatesLoading : setGlLoading
    const setRes   = kind === 'rates' ? setRatesResult  : setGlResult
    const setErr   = kind === 'rates' ? setRatesErrors  : setGlErrors

    setLoad(true)
    setRes(null)
    setErr(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      if (replace) fd.append('replace', '1')

      const { data } = await api.post<ImportResult>(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRes(data)
      toast.success(data.message)
      refetchStats()
      // Reset file input
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      const e = (err as { response?: { data?: ImportError } })?.response?.data
      if (e) {
        setErr(e)
        toast.error(e.message || 'Import failed.')
      } else {
        toast.error('Unexpected error during import.')
      }
    } finally {
      setLoad(false)
    }
  }

  // ── Template download ──────────────────────────────────────────────────────

  function downloadTemplate(kind: ImportKind) {
    const path = kind === 'rates' ? '/admin/rates/template' : '/admin/rates/template/gl'
    // Use a plain anchor to trigger the streamed download with auth token
    const token = localStorage.getItem('token')
    const base  = import.meta.env.VITE_API_URL ?? '/api'
    const url   = `${base}${path}`
    const a     = document.createElement('a')
    a.href      = url
    // Attach token via a temporary fetch-redirect won't work for streamed downloads.
    // Use window.open — the Axios instance handles the auth header globally via
    // interceptors, but anchor clicks don't. Instead we fetch and blob-download.
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        a.href     = blobUrl
        a.download = kind === 'rates' ? 'event_rates_template.csv' : 'carrier_gl_limits_template.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
      })
      .catch(() => toast.error('Could not download template.'))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Import</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload CSV files to update event rate tables. Use the templates to
            ensure the correct column layout.
          </p>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Event Rates" value={stats.event_rates_count} />
            <StatCard label="State Mappings" value={stats.event_rate_states_count} />
            <StatCard label="GL Limit Rows" value={stats.carrier_gl_limits_count} />
          </div>
        )}

        {/* Event Rates card */}
        <ImportCard
          title="Event Rates"
          description="One row per carrier + event-type + audience range combination. States are pipe-separated in the last column (e.g. CA|NY|TX)."
          fileRef={ratesFileRef}
          replace={ratesReplace}
          onReplaceChange={setRatesReplace}
          loading={ratesLoading}
          result={ratesResult}
          error={ratesErrors}
          onImport={() => handleImport('rates')}
          onTemplate={() => downloadTemplate('rates')}
        />

        {/* GL Limits card */}
        <ImportCard
          title="GL Limits"
          description="One row per GL limit display line per carrier (grouped by min_limit + max_limit)."
          fileRef={glFileRef}
          replace={glReplace}
          onReplaceChange={setGlReplace}
          loading={glLoading}
          result={glResult}
          error={glErrors}
          onImport={() => handleImport('gl')}
          onTemplate={() => downloadTemplate('gl')}
        />

      </div>
    </AdminLayout>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
      <p className="text-3xl font-bold text-blue-600">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}

interface ImportCardProps {
  title: string
  description: string
  fileRef: React.RefObject<HTMLInputElement | null>
  replace: boolean
  onReplaceChange: (v: boolean) => void
  loading: boolean
  result: ImportResult | null
  error: ImportError | null
  onImport: () => void
  onTemplate: () => void
}

function ImportCard({
  title,
  description,
  fileRef,
  replace,
  onReplaceChange,
  loading,
  result,
  error,
  onImport,
  onTemplate,
}: ImportCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <button
          type="button"
          onClick={onTemplate}
          className="text-xs text-blue-600 hover:underline shrink-0 ml-4"
        >
          Download template
        </button>
      </div>

      {/* Card body */}
      <div className="px-6 py-5 space-y-4">
        {/* File picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CSV file
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
              file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {/* Replace toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={replace}
            onChange={e => onReplaceChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Replace all existing rows (truncate &amp; reimport)
          </span>
          {replace && (
            <span className="ml-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
              Destructive
            </span>
          )}
        </label>

        {/* Import button */}
        <button
          type="button"
          onClick={onImport}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5
            text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60
            disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Importing…
            </>
          ) : (
            'Import CSV'
          )}
        </button>

        {/* Success result */}
        {result && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800">{result.message}</p>
            <p className="text-xs text-green-700 mt-0.5">
              {result.imported} row{result.imported !== 1 ? 's' : ''} imported.
            </p>
          </div>
        )}

        {/* Error result */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 space-y-2">
            <p className="text-sm font-medium text-red-800">{error.message}</p>
            {error.missing && error.missing.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700">Missing columns:</p>
                <ul className="list-disc list-inside text-xs text-red-600 mt-1 space-y-0.5">
                  {error.missing.map(c => <li key={c}>{c}</li>)}
                </ul>
              </div>
            )}
            {error.errors && error.errors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700">Row errors:</p>
                <ul className="list-disc list-inside text-xs text-red-600 mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                  {error.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
