import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferralData {
  referral_link: string
  commission_per_referral: number
  referrals_count: number
  earnings: {
    total: number | null
    paid: number | null
    pending: number | null
  }
  w9_verified: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number | null) {
  if (n === null) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerReferralPage() {
  const { data, isLoading } = useQuery({
    queryKey:  ['customer-referral'],
    queryFn:   () => api.get<ReferralData>('/customer/referral-link').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const copyLink = () => {
    if (!data?.referral_link) return
    navigator.clipboard.writeText(data.referral_link)
    toast.success('Referral link copied!')
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Refer a Friend</h1>
        <p className="text-sm text-gray-500 mt-1">
          Share your unique referral link and earn <strong>$5</strong> for every friend whose event policy is completed.
        </p>
      </div>

      {/* ── How it works ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Share your link',
              desc: 'Copy your unique referral link and share it with friends, family, or on social media.',
              color: 'bg-blue-100 text-blue-700',
            },
            {
              step: '2',
              title: 'Friend buys a policy',
              desc: 'When they click your link and complete an event insurance purchase, we track the referral.',
              color: 'bg-purple-100 text-purple-700',
            },
            {
              step: '3',
              title: 'You earn $5',
              desc: 'A $5 commission is credited to your account per completed policy. Upload your W9 to unlock payouts.',
              color: 'bg-green-100 text-green-700',
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.color}`}>
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Referral link ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Your referral link</h2>

        {isLoading ? (
          <div className="animate-pulse h-10 bg-gray-100 rounded-lg"/>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-mono text-gray-600 truncate">
              {data?.referral_link}
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 px-4 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Copy link
            </button>
          </div>
        )}

        <div className="mt-3 flex gap-2 flex-wrap">
          {data && (
            <>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get event insurance for your next event! Use my link: ${data.referral_link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Share on Twitter
              </a>
              <a
                href={`mailto:?subject=Get event insurance&body=${encodeURIComponent(`Hey! I use One Day Event for event insurance. Get covered here: ${data.referral_link}`)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Share via email
              </a>
            </>
          )}
        </div>
      </div>

      {/* ── Earnings stats ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Your earnings</h2>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-gray-50 px-4 py-4">
                <div className="h-3 w-16 bg-gray-200 rounded mb-2"/>
                <div className="h-6 w-12 bg-gray-200 rounded"/>
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Successful referrals</p>
              <p className="text-2xl font-bold text-gray-800">{data.referrals_count}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Total earned</p>
              <p className={`text-2xl font-bold ${data.earnings.total === null ? 'text-gray-300' : 'text-gray-800'}`}>
                {fmtMoney(data.earnings.total)}
              </p>
            </div>
            <div className="rounded-lg bg-[#EDF0FA] border border-[#1CA0DF]/20 px-4 py-4">
              <p className="text-xs text-[#105778]/60 mb-1">Pending payout</p>
              <p className={`text-2xl font-bold ${data.earnings.pending === null ? 'text-gray-300' : 'text-[#105778]'}`}>
                {fmtMoney(data.earnings.pending)}
              </p>
            </div>
          </div>
        ) : null}

        {/* W9 gate notice */}
        {data && !data.w9_verified && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5 text-xs text-amber-800">
            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <span>
              Earnings are hidden until your W9 is verified.{' '}
              <Link to="/customer/commissions" className="font-semibold underline">Upload your W9 →</Link>
            </span>
          </div>
        )}
      </div>

      {/* ── Per-referral rate card ───────────────────────── */}
      <div className="rounded-xl bg-gradient-to-br from-[#105778] to-[#1CA0DF] px-6 py-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            $5
          </div>
          <div>
            <p className="text-lg font-bold">$5 per completed policy</p>
            <p className="text-sm text-white/70 mt-0.5">
              Earn every time a friend buys event insurance using your link.
              No limits — the more you refer, the more you earn!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
