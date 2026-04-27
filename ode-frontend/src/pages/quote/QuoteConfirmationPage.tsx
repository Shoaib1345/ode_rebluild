import { Link, useParams, useNavigate } from 'react-router-dom'

export default function QuoteConfirmationPage() {
  const { leadNumber } = useParams<{ leadNumber: string }>()
  const navigate       = useNavigate()

  return (
    <div className="min-h-screen bg-[#EBEFF2] flex flex-col">

      {/* ── Minimal header ─────────────────────────────────────────── */}
      <header className="bg-[#105778]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/assets/images/logo-img.svg" alt="" className="h-9 w-auto brightness-0 invert" />
            <img src="/assets/images/logo-text2.svg" alt="One Day Event" className="h-5 w-auto brightness-0 invert hidden sm:block" />
          </Link>
          <span className="text-sm text-white/70">Policy Confirmed</span>
        </div>
      </header>

      {/* ── Hero banner ────────────────────────────────────────────── */}
      <div
        className="relative text-white text-center py-14 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #105778 0%, #1CA0DF 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

        {/* Animated checkmark */}
        <div className="relative mx-auto w-20 h-20 mb-5">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-[#1CA0DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Payment Successful!</h1>
          <p className="text-white/80 text-lg">
            Your event insurance policy is being processed.
          </p>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-5">

        {/* Policy number card */}
        {leadNumber && (
          <div className="bg-white rounded-2xl shadow-[0px_5px_16px_rgba(55,106,136,0.12)] overflow-hidden text-center">
            <div className="bg-[#EDF0FA] px-6 py-3">
              <p className="text-xs font-bold text-[#1CA0DF] uppercase tracking-widest">
                Your Policy Reference Number
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-4xl font-extrabold text-[#105778] tracking-tight">
                #{leadNumber}
              </p>
              <p className="text-sm text-[#797979] mt-2">
                A confirmation email with your policy details is on its way.
                Please save this number for your records.
              </p>
            </div>
          </div>
        )}

        {/* Illustration + message */}
        <div className="bg-white rounded-2xl shadow-[0px_5px_16px_rgba(55,106,136,0.12)] px-6 py-6 flex items-center gap-6">
          <img
            src="/assets/images/thanks-quote-image.png"
            alt="Thank you"
            className="w-24 h-24 object-contain flex-shrink-0"
          />
          <div>
            <p className="font-bold text-[#262D45] mb-1.5">Thank you for choosing One Day Event!</p>
            <p className="text-sm text-[#505458] leading-relaxed">
              We appreciate your trust. Your certificate of insurance will be issued within 1–2 business days,
              or sooner — our team is on it.
            </p>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl shadow-[0px_5px_16px_rgba(55,106,136,0.12)] px-6 py-6">
          <h3 className="text-sm font-bold text-[#262D45] mb-4">What happens next?</h3>
          <div className="space-y-4">
            {[
              {
                num: '1',
                title: 'Confirmation email',
                desc: 'You will receive a confirmation email with your policy details and reference number.',
              },
              {
                num: '2',
                title: 'Certificate of insurance',
                desc: 'Your COI will be issued within 1–2 business days. If you provided venue contact details, it will be sent to them automatically.',
              },
              {
                num: '3',
                title: 'Customer portal access',
                desc: 'Log in to your portal to view your policy, download your COI, or send it to anyone anytime.',
              },
            ].map((item) => (
              <div key={item.num} className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-[#1CA0DF] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.num}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#262D45]">{item.title}</p>
                  <p className="text-sm text-[#797979] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-bold text-sm transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Go to Customer Portal
          </Link>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border-2 border-[#E3E3E3] text-[#505458] font-bold text-sm hover:border-[#1CA0DF] hover:text-[#105778] transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </button>
        </div>

        {/* Help footer */}
        <p className="text-center text-xs text-[#797979] pb-4">
          Questions?{' '}
          <a href="mailto:support@onedayevent.com" className="text-[#1CA0DF] hover:underline font-medium">
            support@onedayevent.com
          </a>
          {' '}·{' '}
          <a href="tel:+14082176787" className="text-[#1CA0DF] hover:underline font-medium">
            408-217-6787
          </a>
        </p>

      </main>
    </div>
  )
}
