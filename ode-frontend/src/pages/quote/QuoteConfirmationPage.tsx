import { useParams, useNavigate } from 'react-router-dom'

export default function QuoteConfirmationPage() {
  const { leadNumber } = useParams<{ leadNumber: string }>()
  const navigate       = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDF0FA] to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg px-8 py-10 text-center space-y-6">

        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Successful!</h1>
          <p className="mt-2 text-gray-500 text-sm leading-relaxed">
            Thank you for purchasing your one-day event insurance policy. Your policy is now
            being processed and you will receive a confirmation email shortly.
          </p>
        </div>

        {/* Lead number */}
        {leadNumber && (
          <div className="rounded-xl bg-[#EDF0FA] border border-[#EDF0FA] px-6 py-4">
            <p className="text-xs text-[#1CA0DF] uppercase tracking-wide font-medium mb-1">
              Your policy reference number
            </p>
            <p className="text-2xl font-bold text-[#105778]">#{leadNumber}</p>
            <p className="text-xs text-[#1CA0DF/70] mt-1">
              Please save this number for your records.
            </p>
          </div>
        )}

        {/* What's next */}
        <div className="text-left rounded-xl bg-gray-50 border border-gray-100 px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">What happens next?</p>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 rounded-full bg-[#EDF0FA] text-[#1CA0DF] flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              You will receive a confirmation email with your policy details.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 rounded-full bg-[#EDF0FA] text-[#1CA0DF] flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              Your certificate of insurance will be issued within 1–2 business days.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 rounded-full bg-[#EDF0FA] text-[#1CA0DF] flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              If you provided venue contact details, the certificate will be sent to them as well.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/', { replace: true })}
          className="w-full py-3 rounded-lg bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm transition-colors"
        >
          Back to Home
        </button>

        <p className="text-xs text-gray-400">
          Questions? Contact us at{' '}
          <a href="mailto:support@onedayevent.com" className="text-[#1CA0DF] underline">
            support@onedayevent.com
          </a>
        </p>
      </div>
    </div>
  )
}
