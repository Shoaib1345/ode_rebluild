import PublicLayout from '../../components/layout/PublicLayout'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using the One Day Event Insurance website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.`,
  },
  {
    title: '2. Description of Services',
    body: `One Day Event Insurance provides an online platform for obtaining insurance quotes and purchasing event insurance policies. We act as an intermediary between you and licensed insurance carriers. All insurance products are underwritten by independent, AM Best-rated carriers.`,
  },
  {
    title: '3. Eligibility',
    body: `You must be at least 18 years of age and a legal resident of the United States to purchase a policy through our platform. You represent that all information you provide is accurate, complete, and up to date.`,
  },
  {
    title: '4. Insurance Purchases',
    body: `All policies are subject to carrier underwriting approval. Quotes displayed on our platform are estimates based on the information you provide. Final premium may differ based on underwriting review. A policy is not in force until payment has been received and a certificate of insurance has been issued. Refunds are subject to carrier cancellation policies.`,
  },
  {
    title: '5. Payment',
    body: `Payments are processed securely through Stripe, Inc. We do not store your full credit card details. By submitting payment, you authorize us to charge the stated amount to your payment method. All transactions are in USD.`,
  },
  {
    title: '6. Affiliate and Partner Programs',
    body: `Participation in our affiliate or partner programs is governed by the program agreement presented at signup. Commission rates, payment schedules, and eligibility requirements may change with reasonable notice. We reserve the right to terminate any affiliate or partner account for violation of program terms or fraudulent activity.`,
  },
  {
    title: '7. Limitation of Liability',
    body: `To the fullest extent permitted by law, One Day Event Insurance shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our platform or services. Our total liability for any claim shall not exceed the amount paid by you for the specific transaction giving rise to the claim.`,
  },
  {
    title: '8. Indemnification',
    body: `You agree to indemnify and hold harmless One Day Event Insurance, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses, including legal fees, arising out of your use of our services or violation of these terms.`,
  },
  {
    title: '9. Privacy',
    body: `Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our services, you consent to the data practices described in our Privacy Policy.`,
  },
  {
    title: '10. Changes to Terms',
    body: `We reserve the right to update these Terms of Service at any time. Changes take effect upon posting. Your continued use of our services after changes are posted constitutes your acceptance of the updated terms. We will make reasonable efforts to notify registered users of material changes.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms are governed by the laws of the United States and the state in which we are incorporated. Any disputes shall be resolved in the applicable state or federal courts.`,
  },
  {
    title: '12. Contact',
    body: `Questions about these Terms? Contact us at support@onedayevent.com.`,
  },
]

export default function TermsPage() {
  return (
    <PublicLayout>

      {/* Hero */}
      <div className="bg-[#105778] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-white/70 text-sm">Last updated: {new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-gray-500 mb-10 leading-relaxed">
          Please read these Terms of Service carefully before using the One Day Event Insurance platform.
          These terms constitute a legally binding agreement between you and One Day Event Insurance.
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
