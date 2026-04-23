import PublicLayout from '../../components/layout/PublicLayout'

const CONTACT_ITEMS = [
  {
    label: 'Email',
    value: 'support@onedayevent.com',
    href: 'mailto:support@onedayevent.com',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Partner / Agent Inquiries',
    value: 'partners@onedayevent.com',
    href: 'mailto:partners@onedayevent.com',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Affiliate Program',
    value: 'affiliates@onedayevent.com',
    href: 'mailto:affiliates@onedayevent.com',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
]

const FAQS = [
  {
    q: 'How quickly will I receive my certificate of insurance?',
    a: 'Most certificates are issued the same business day. Once your payment is processed, our team reviews and issues your COI — typically within a few hours.',
  },
  {
    q: 'Can I get coverage for an event happening tomorrow?',
    a: 'In many cases, yes. Coverage availability depends on the event date and carrier requirements. Complete a quote to see real-time availability.',
  },
  {
    q: 'What if I need to cancel my event?',
    a: 'Cancellation coverage depends on your selected plan. Review the policy details during checkout, or contact us for clarification before purchasing.',
  },
  {
    q: 'Do you cover events outside the United States?',
    a: 'At this time, we only offer coverage for events held in the United States.',
  },
]

export default function ContactPage() {
  return (
    <PublicLayout>

      {/* Hero */}
      <div className="bg-[#105778] text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-white/80 text-lg">
            We're here to help. Reach out by email and we'll get back to you promptly.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contact info */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Get in Touch</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Our team is available Monday–Friday, 9am–6pm ET. We aim to respond to all inquiries
              within one business day.
            </p>

            <div className="space-y-5">
              {CONTACT_ITEMS.map(({ label, value, href, icon }) => (
                <div key={label} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#EDF0FA] text-[#105778] rounded-lg flex items-center justify-center">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <a href={href} className="text-[#105778] hover:text-[#105778] font-medium transition">
                      {value}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-[#EDF0FA] border border-[#EDF0FA] rounded-xl">
              <p className="text-sm text-[#105778] font-medium mb-1">Already have a policy?</p>
              <p className="text-sm text-[#105778]">
                Reference your policy number (shown on your confirmation email) when contacting support
                for the fastest response.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-500 mb-8">Quick answers to the most common questions.</p>

            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">{q}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </PublicLayout>
  )
}
