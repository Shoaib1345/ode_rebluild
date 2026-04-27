import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import api from '../../lib/axios'

interface FormState {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const INITIAL: FormState = { name: '', email: '', phone: '', subject: '', message: '' }

// ── Contact info cards ────────────────────────────────────────────────────────

const CONTACT_CARDS = [
  {
    icon: '/assets/images/contact-icon1.svg',
    label: 'Phone & Email',
    lines: ['408-217-6787', 'support@onedayevent.com'],
    href: 'tel:+14082176787',
  },
  {
    icon: '/assets/images/contact-icon2.svg',
    label: 'Office Address',
    lines: ['1494 Hamilton Ave. #103,', 'San Jose, CA 95125'],
    href: null,
  },
  {
    icon: '/assets/images/contact-icon3.svg',
    label: 'Business Hours',
    lines: ['Weekdays: 5am – 7pm PST', 'Weekends: 6am – 5pm PST'],
    href: null,
  },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm]       = useState<FormState>(INITIAL)
  const [errors, setErrors]   = useState<Partial<FormState>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [serverError, setServerError] = useState('')

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.name.trim())    e.name    = 'Your name is required.'
    if (!form.email.trim())   e.email   = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                               e.email   = 'Please enter a valid email.'
    if (!form.subject.trim()) e.subject = 'Subject is required.'
    if (!form.message.trim()) e.message = 'Message is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSending(true)
    setServerError('')
    try {
      await api.post('/contact', form)
      setSent(true)
      setForm(INITIAL)
    } catch {
      setServerError('Something went wrong. Please try again or email us directly.')
    } finally {
      setSending(false)
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const inputBase =
    'w-full rounded-xl border px-4 py-3 text-sm text-[#262D45] placeholder-gray-400 focus:outline-none focus:ring-2 transition'
  const inputOk   = `${inputBase} border-[#E3E3E3] bg-white focus:ring-[#1CA0DF]/30 focus:border-[#1CA0DF]`
  const inputErr  = `${inputBase} border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400`

  return (
    <PublicLayout>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative text-white py-20 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #105778 0%, #1CA0DF 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Contact Us</h1>
          <p className="text-white/80 text-lg">
            We're here 7 days a week. Reach out and we'll get back to you promptly.
          </p>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── LEFT: Contact form ──────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-[#262D45] mb-1">Send us a message</h2>
            <p className="text-[#797979] text-sm mb-7">
              Fill in the form and we'll respond within one business day.
            </p>

            {sent ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EDF0FA] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#1CA0DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold text-[#262D45]">Message Sent!</p>
                  <p className="text-[#797979] text-sm mt-1">Thanks for reaching out — we'll be in touch shortly.</p>
                </div>
                <button
                  onClick={() => setSent(false)}
                  className="mt-2 text-sm text-[#1CA0DF] hover:underline font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#262D45] mb-1.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={(e) => field('name', e.target.value)}
                      className={errors.name ? inputErr : inputOk}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#262D45] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={(e) => field('email', e.target.value)}
                      className={errors.email ? inputErr : inputOk}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#262D45] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="(408) 555-0100"
                      value={form.phone}
                      onChange={(e) => field('phone', e.target.value)}
                      className={inputOk}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#262D45] mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Policy question, claim help…"
                      value={form.subject}
                      onChange={(e) => field('subject', e.target.value)}
                      className={errors.subject ? inputErr : inputOk}
                    />
                    {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#262D45] mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us how we can help…"
                    value={form.message}
                    onChange={(e) => field('message', e.target.value)}
                    className={`${errors.message ? inputErr : inputOk} resize-none`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>

                {serverError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {serverError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 rounded-xl bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-bold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending…' : 'Send Message'}
                </button>

              </form>
            )}
          </div>

          {/* ── RIGHT: Info ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Illustration */}
            <div className="hidden lg:block">
              <img
                src="/assets/images/contact-main.svg"
                alt="Contact One Day Event"
                className="w-full max-w-xs mx-auto"
              />
            </div>

            {/* Info cards */}
            <div className="space-y-3">
              {CONTACT_CARDS.map((card) => (
                <div
                  key={card.label}
                  className="flex items-start gap-4 bg-white border border-[#E3E3E3] rounded-xl p-4 shadow-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#EDF0FA] flex items-center justify-center">
                    <img src={card.icon} alt="" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#797979] uppercase tracking-wider mb-1">
                      {card.label}
                    </p>
                    {card.lines.map((line, i) =>
                      i === 0 && card.href ? (
                        <a key={i} href={card.href} className="block text-sm font-medium text-[#105778] hover:underline">
                          {line}
                        </a>
                      ) : (
                        <p key={i} className="text-sm text-[#505458]">{line}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Already have a policy tip */}
            <div className="bg-[#EDF0FA] border border-[#1CA0DF]/20 rounded-xl p-5">
              <p className="text-sm font-semibold text-[#105778] mb-1">Already have a policy?</p>
              <p className="text-sm text-[#505458] leading-relaxed">
                Reference your policy number (shown on your confirmation email) when contacting
                support for the fastest response.
              </p>
              <Link
                to="/login"
                className="inline-block mt-3 text-sm font-semibold text-[#1CA0DF] hover:underline"
              >
                Log in to your portal →
              </Link>
            </div>

            {/* FAQ link */}
            <div className="bg-white border border-[#E3E3E3] rounded-xl p-5">
              <p className="text-sm font-semibold text-[#262D45] mb-1">Quick answers</p>
              <p className="text-sm text-[#797979] mb-3">
                Check our FAQ for instant answers to the most common questions.
              </p>
              <Link
                to="/faq"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1CA0DF] hover:underline"
              >
                Browse the FAQ
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </div>

    </PublicLayout>
  )
}
