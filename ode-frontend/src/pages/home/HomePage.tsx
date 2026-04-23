import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'

const EVENT_TYPES = [
  { icon: '💍', label: 'Weddings' },
  { icon: '🎉', label: 'Private Parties' },
  { icon: '🎵', label: 'Concerts' },
  { icon: '🏢', label: 'Corporate Events' },
  { icon: '🎓', label: 'Graduations' },
  { icon: '🎪', label: 'Festivals' },
]

const WHY_US = [
  {
    title: 'Instant Quotes',
    desc: 'Get multiple carrier quotes in under 60 seconds — no agent, no phone calls.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Multiple Carriers',
    desc: 'We compare top-rated insurance carriers so you always get the best rate.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Secure Payment',
    desc: 'Payments processed securely via Stripe. Your card data never touches our servers.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Same-Day Coverage',
    desc: 'Purchase your policy and receive your certificate of insurance the same business day.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function HomePage() {
  return (
    <PublicLayout>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#105778] to-[#1CA0DF] text-white text-center py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight" style={{ fontFamily: 'var(--sans)' }}>
            Event Insurance<br className="hidden sm:block" /> in Minutes
          </h1>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Instant quotes for weddings, parties, concerts &amp; more.<br className="hidden sm:block" />
            Multiple carriers. No agent needed.
          </p>
          <Link
            to="/onedayevent"
            className="inline-block bg-white text-[#105778] font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-[#EDF0FA] hover:shadow-xl transition-all"
          >
            Get Your Free Quote →
          </Link>
          <p className="mt-5 text-white/60 text-sm">Takes less than 2 minutes. No commitment required.</p>
        </div>
      </section>

      {/* ── Event types ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#262D45] mb-2">Coverage for Every Event</h2>
          <p className="text-[#797979] mb-10">We insure hundreds of event types across all 50 states.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {EVENT_TYPES.map(({ icon, label }) => (
              <Link
                key={label}
                to="/onedayevent"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-[#E3E3E3] hover:border-[#1CA0DF] hover:shadow-md transition-all group"
              >
                <span className="text-3xl">{icon}</span>
                <span className="text-sm font-medium text-[#505458] group-hover:text-[#1CA0DF]">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-[#EBEFF2]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#262D45] mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Pick Your Event', desc: 'Select your event type, enter the details, and tell us about the venue.' },
              { step: '2', title: 'Compare Plans',   desc: 'See instant quotes from multiple insurance carriers side by side.' },
              { step: '3', title: 'Pay &amp; Download',  desc: 'Pay securely online and receive your certificate of insurance immediately.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center p-6 bg-white border border-[#E3E3E3] rounded-xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#1CA0DF] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg text-[#262D45] mb-2">{title}</h3>
                <p className="text-[#797979] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/onedayevent"
              className="inline-block bg-[#1CA0DF] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#1786BB] transition"
            >
              Start My Quote
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why us ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-[#EDF0FA]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#262D45] mb-12">Why One Day Event?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WHY_US.map(({ title, desc, icon }) => (
              <div key={title} className="flex gap-4 p-6 bg-white rounded-xl border border-[#E3E3E3] shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-[#EDF0FA] text-[#1CA0DF] rounded-lg flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#262D45] mb-1">{title}</h3>
                  <p className="text-[#797979] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner CTA ───────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-[#262D45] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Work with Us</h2>
          <p className="text-white/70 mb-8">
            Are you an event planner, venue, or insurance agent? Join our partner program and earn commissions on every policy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/affiliate-signup"
              className="bg-white text-[#105778] font-semibold px-6 py-3 rounded-full hover:bg-[#EDF0FA] transition"
            >
              Become an Affiliate
            </Link>
            <Link
              to="/partner-signup"
              className="bg-[#1CA0DF] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#1786BB] transition"
            >
              Agent / Venue Program
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  )
}
