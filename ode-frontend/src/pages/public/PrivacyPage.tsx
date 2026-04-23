import PublicLayout from '../../components/layout/PublicLayout'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly, including your name, email address, phone number, mailing address, and payment information when you request a quote or purchase a policy. We also collect event details (type, date, venue, number of attendees) necessary to generate your quote. We automatically collect certain technical information when you use our platform, including IP address, browser type, pages visited, and device identifiers.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to: process insurance quotes and policy purchases; issue certificates of insurance; send transaction and policy confirmation emails; communicate with you about your policy or account; improve our platform and services; comply with legal and regulatory requirements; and prevent fraud.`,
  },
  {
    title: '3. Information Sharing',
    body: `We share your personal information with the insurance carriers necessary to underwrite and issue your policy. We use Stripe, Inc. to process payments — Stripe receives your payment card details directly and does not share full card numbers with us. We may share information with service providers who assist us in operating our platform under confidentiality agreements. We do not sell your personal information to third parties for marketing purposes.`,
  },
  {
    title: '4. Affiliate Tracking',
    body: `If you arrived at our site through an affiliate or partner referral link, we record a referral identifier to attribute commission to that affiliate. This information is used solely for affiliate program administration.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain your information for as long as necessary to fulfill the purposes described in this policy, comply with legal obligations, and resolve disputes. Insurance policy records are typically retained for the period required by applicable insurance regulations.`,
  },
  {
    title: '6. Security',
    body: `We implement industry-standard technical and organizational measures to protect your information against unauthorized access, disclosure, or loss. Payments are processed over encrypted connections via Stripe. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '7. Cookies',
    body: `We use cookies and similar tracking technologies to remember your preferences, maintain session state, and analyze platform usage. You can control cookie settings through your browser. Disabling cookies may affect the functionality of our platform.`,
  },
  {
    title: '8. Your Rights',
    body: `Depending on your location, you may have rights to access, correct, delete, or restrict the processing of your personal information. To exercise these rights, contact us at support@onedayevent.com. We will respond within the time period required by applicable law.`,
  },
  {
    title: '9. Children',
    body: `Our services are not directed to children under 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a minor, please contact us immediately.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Changes take effect upon posting. For material changes, we will make reasonable efforts to notify registered users. Continued use of our platform after changes are posted constitutes acceptance.`,
  },
  {
    title: '11. Contact',
    body: `Questions about this Privacy Policy? Contact us at support@onedayevent.com.`,
  },
]

export default function PrivacyPage() {
  return (
    <PublicLayout>

      {/* Hero */}
      <div className="bg-[#105778] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-white/70 text-sm">Last updated: {new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-gray-500 mb-10 leading-relaxed">
          This Privacy Policy explains how One Day Event Insurance collects, uses, and protects the
          personal information you provide when using our platform and services.
        </p>

        <div className="space-y-8">
          {SECTIONS.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{body}</p>
            </section>
          ))}
        </div>
      </div>

    </PublicLayout>
  )
}
