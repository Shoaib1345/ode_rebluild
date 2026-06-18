import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PublicLayout from '../../components/layout/PublicLayout'

const TRUST_ITEMS = [
  'Quote in under 2 minutes',
  'Certificate in 24 hours or less',
  'Policies from top-rated carriers',
]

const EVENT_TYPES = ['Wedding', 'Birthday', 'Vendor', 'Concert', 'Festival']

const STEPS = [
  { title: 'Tell us your event', body: 'Choose the event type, date, venue, and guest count.' },
  { title: 'Compare options', body: 'Review liability coverage and optional add-ons before checkout.' },
  { title: 'Get your COI', body: 'Receive your certificate and manage documents in your portal.' },
]

const COVERAGE_OPTIONS = [
  {
    name: 'Essentials',
    price: '$69',
    description: 'Simple event liability for smaller gatherings.',
    features: ['General liability coverage', 'Venue certificate support', 'Digital policy documents'],
  },
  {
    name: 'Plus',
    price: '$99',
    description: 'A stronger fit for most hosted events.',
    popular: true,
    features: ['Higher coverage limits', 'Additional insured support', 'Alcohol add-on eligibility'],
  },
  {
    name: 'Premium',
    price: '$149',
    description: 'More protection for larger or higher-touch events.',
    features: ['Expanded event protection', 'Priority certificate handling', 'Customer portal access'],
  },
]

const CUSTOMER_QUOTES = [
  'Fast, affordable, and my venue accepted the COI right away.',
  'The quote flow was clear and took only a few minutes.',
  'Customer support helped me add my venue with no stress.',
  'Perfect for a last-minute wedding requirement.',
  'Easy checkout and the certificate arrived quickly.',
]

function Stars() {
  return (
    <span className="flex text-[#F5B301]" aria-label="4.8 out of 5 stars">
      {'★★★★★'}
    </span>
  )
}

export default function HomePageV3() {
  return (
    <PublicLayout>
      <Helmet>
        <title>One Day Event Insurance - Homepage V3 Prototype</title>
        <meta
          name="description"
          content="Prototype homepage redesign with stronger trust, pricing clarity, and quote flow guidance."
        />
      </Helmet>

      <section className="bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1180px] grid-cols-1 items-center gap-10 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:pb-16 lg:pt-16">
          <div className="max-w-[650px] text-left">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BFE7FA] bg-[#F3FBFF] px-4 py-2 text-sm font-bold text-[#105778]">
                <span className="h-2 w-2 rounded-full bg-[#1CA0DF]" />
                Event liability insurance made simple
              </div>
              <div className="rounded-full border border-[#FFE0A3] bg-[#FFF8E8] px-4 py-2 text-sm font-[900] text-[#8A5A00]">
                Since 1985
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-[900] text-[#262D45]">
              <Stars />
              <span>4.8/5 from 300+ reviews</span>
            </div>

            <h1 className="text-[40px] font-[900] leading-[1.08] text-[#262D45] sm:text-[56px] lg:text-[64px]">
              Get covered before your event starts.
            </h1>

            <p className="mt-5 max-w-[560px] text-[18px] font-semibold leading-[28px] text-[#505458]">
              Answer a few questions, compare coverage, and get the certificate your venue needs without waiting on a call.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/onedayevent"
                className="inline-flex h-[58px] items-center justify-center rounded-full bg-[#E0232C] px-8 text-[20px] font-[800] text-white shadow-[0_16px_34px_rgba(224,35,44,0.22)] transition-colors hover:bg-[#C51E26]"
              >
                Get Quote
              </Link>
              <div className="text-[16px] font-[900] text-[#262D45]">
                From <span className="text-[26px] text-[#E0232C]">$69</span>
              </div>
              <Link
                to="/faq"
                className="inline-flex h-[58px] items-center justify-center rounded-full border border-[#105778] bg-white px-8 text-[17px] font-[800] text-[#105778] transition-colors hover:bg-[#cfefff]"
              >
                See FAQ
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => (
                <Link
                  key={type}
                  to="/onedayevent"
                  className="rounded-full border border-[#E3E3E3] bg-white px-4 py-2 text-sm font-bold text-[#262D45] transition-colors hover:border-[#1CA0DF] hover:text-[#1CA0DF]"
                >
                  {type}
                </Link>
              ))}
            </div>

            <dl className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TRUST_ITEMS.map(item => (
                <div key={item} className="rounded-lg border border-[#EDF0FA] bg-[#FAFCFE] p-4">
                  <dt className="text-[15px] font-[900] leading-[20px] text-[#262D45]">{item}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[8px] border border-[#EDF0FA] bg-[#F8FCFF] shadow-[0_20px_50px_rgba(55,106,136,0.16)]">
              <img
                src="/assets/images/hero-bg2.webp"
                alt="People celebrating at a covered event"
                className="h-[320px] w-full object-cover object-bottom sm:h-[420px]"
              />
            </div>

            <div className="mx-auto -mt-12 max-w-[88%] rounded-[8px] border border-[#E3E3E3] bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
              <p className="text-xs font-[900] uppercase tracking-wide text-[#797979]">Coverage path</p>
              <div className="mt-4 space-y-4">
                {STEPS.map((step, index) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1CA0DF] text-sm font-[900] text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-[16px] font-[900] leading-[20px] text-[#262D45]">{step.title}</h2>
                      <p className="mt-1 text-sm font-semibold leading-[20px] text-[#505458]">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[#EDF0FA] bg-[#F8FCFF] py-5">
        <style>
          {`
            @keyframes homepage-v3-scroll {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
          `}
        </style>
        <div className="flex w-max animate-[homepage-v3-scroll_32s_linear_infinite] gap-4 px-4">
          {[...CUSTOMER_QUOTES, ...CUSTOMER_QUOTES].map((quote, index) => (
            <div key={`${quote}-${index}`} className="w-[320px] rounded-[8px] border border-[#E3E3E3] bg-white px-5 py-4 shadow-sm">
              <p className="text-[15px] font-bold leading-[22px] text-[#262D45]">"{quote}"</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto mb-10 max-w-[720px] text-center">
            <p className="text-sm font-[900] uppercase tracking-wide text-[#1CA0DF]">Start your quote</p>
            <h2 className="mt-2 text-[34px] font-[900] leading-[42px] text-[#262D45] sm:text-[42px] sm:leading-[50px]">
              Choose the coverage level that fits your event.
            </h2>
          </div>

          <div className="mb-10 rounded-[8px] border border-[#EDF0FA] bg-[#FAFCFE] p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {['Choose Coverage', 'Customize', 'Get Certificate'].map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1CA0DF] text-sm font-[900] text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-[900] text-[#262D45]">{label}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-[#D9EEF9]">
                      <div className="h-1.5 rounded-full bg-[#1CA0DF]" style={{ width: index === 0 ? '100%' : '34%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {COVERAGE_OPTIONS.map(option => (
              <article
                key={option.name}
                className={`relative rounded-[8px] border bg-white p-6 shadow-[0_12px_30px_rgba(55,106,136,0.10)] ${
                  option.popular ? 'border-[#E0232C]' : 'border-[#E3E3E3]'
                }`}
              >
                {option.popular && (
                  <div className="absolute right-4 top-4 rounded-full bg-[#E0232C] px-3 py-1 text-xs font-[900] uppercase tracking-wide text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-[24px] font-[900] text-[#262D45]">{option.name}</h3>
                <p className="mt-2 min-h-[48px] text-[15px] font-semibold leading-[22px] text-[#505458]">{option.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-[42px] font-[900] leading-none text-[#262D45]">{option.price}</span>
                  <span className="pb-1 text-sm font-bold text-[#797979]">starting</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {option.features.map(feature => (
                    <li key={feature} className="flex gap-3 text-[15px] font-bold leading-[22px] text-[#262D45]">
                      <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#DFF3FC] text-center text-xs font-[900] leading-5 text-[#105778]">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/onedayevent"
                  className={`mt-7 inline-flex h-12 w-full items-center justify-center rounded-full text-[16px] font-[900] transition-colors ${
                    option.popular
                      ? 'bg-[#E0232C] text-white hover:bg-[#C51E26]'
                      : 'border border-[#105778] bg-white text-[#105778] hover:bg-[#cfefff]'
                  }`}
                >
                  Start Quote
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
