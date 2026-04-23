import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface W9Status {
  id: number
  file_name: string
  file_size: number
  status: 'pending' | 'verified'
  verified_at: string | null
  created_at: string
  download_url: string | null
}

interface W9Response {
  w9: W9Status | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function fmtDate(str: string) {
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'pending' | 'verified' | 'none' }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
        Verified
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
        </svg>
        Pending review
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      Not uploaded
    </span>
  )
}

// ─── Drop zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFile: (file: File) => void
  uploading: boolean
}

function DropZone({ onFile, uploading }: DropZoneProps) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''  // reset so re-selecting same file fires onChange
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        mt-3 border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer
        transition-colors select-none
        ${drag ? 'border-[#1CA0DF] bg-[#EDF0FA]' : 'border-gray-200 hover:border-gray-300'}
        ${uploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2 text-[#1CA0DF]">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium">Uploading…</p>
        </div>
      ) : (
        <>
          <svg className="mx-auto w-10 h-10 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          <p className="text-sm font-medium text-gray-600">
            Drop your W9 PDF here, or{' '}
            <span className="text-[#1CA0DF] underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF only · max 5 MB</p>
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * W9UploadCard
 *
 * Displayed in affiliate/agent/planner/customer portals.
 * Shows current W9 status and allows uploading a new PDF.
 * Explains the commission visibility gate (§14, §25).
 */
export default function W9UploadCard() {
  const queryClient = useQueryClient()

  // Fetch current W9 status
  const { data, isLoading } = useQuery({
    queryKey:  ['w9-status'],
    queryFn:   () => api.get<W9Response>('/w9').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const w9 = data?.w9 ?? null

  // Upload mutation
  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post('/w9', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['w9-status'] })
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
      toast.success('W9 uploaded! Our team will review it shortly.')
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.errors?.file?.[0] ??
        err?.response?.data?.message ??
        'Upload failed. Please try again.'
      toast.error(msg)
    },
  })

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB.')
      return
    }
    upload(file)
  }

  const statusKey: 'none' | 'pending' | 'verified' =
    !w9 ? 'none' : w9.status === 'verified' ? 'verified' : 'pending'

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">W9 Tax Form</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Required for commission payouts (IRS reporting)
          </p>
        </div>
        {!isLoading && <StatusBadge status={statusKey} />}
      </div>

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="mt-4 animate-pulse space-y-2">
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      )}

      {/* ── Gate notice — unverified ── */}
      {!isLoading && statusKey !== 'verified' && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 flex gap-2.5 items-start">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
          <span>
            <strong>Commission amounts are hidden</strong> until your W9 is verified by our team.
            {statusKey === 'none'
              ? ' Upload your W9 below to start the review process.'
              : ' We\'ll notify you once the review is complete (usually 1–2 business days).'}
          </span>
        </div>
      )}

      {/* ── Verified state ── */}
      {!isLoading && statusKey === 'verified' && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-800 flex gap-2.5 items-start">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
          </svg>
          <span>
            Your W9 is <strong>verified</strong>.
            Commission amounts are fully visible in your dashboard.
            {w9?.verified_at && (
              <span className="text-green-700"> (Verified {fmtDate(w9.verified_at)})</span>
            )}
          </span>
        </div>
      )}

      {/* ── Current file info ── */}
      {!isLoading && w9 && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-7 h-7 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{w9.file_name}</p>
              <p className="text-xs text-gray-400">{fmtBytes(w9.file_size)} · Uploaded {fmtDate(w9.created_at)}</p>
            </div>
          </div>
          {w9.download_url && (
            <a
              href={w9.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-[#1CA0DF] hover:underline"
            >
              View
            </a>
          )}
        </div>
      )}

      {/* ── Upload zone — shown when not yet verified ── */}
      {!isLoading && statusKey !== 'verified' && (
        <>
          <DropZone onFile={handleFile} uploading={uploading} />
          {w9 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Uploading a new file will replace the current one for review.
            </p>
          )}
        </>
      )}

      {/* ── Re-upload link — shown even when verified ── */}
      {!isLoading && statusKey === 'verified' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.pdf,application/pdf'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleFile(file)
              }
              input.click()
            }}
            disabled={uploading}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors disabled:opacity-40"
          >
            Re-upload W9 (e.g. corrections)
          </button>
        </div>
      )}
    </div>
  )
}
