import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'

// ── FAQ data (ported from ode_new Question.js) ────────────────────────────────

type Category = 'general' | 'coverage' | 'service' | 'purchase'

interface FaqItem {
  id: string
  category: Category
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    category: 'general',
    question: 'What is special event insurance?',
    answer: 'Special event insurance, aka one day event insurance, is a liability policy that covers events in case of injuries, property damage, or lawsuits that occur. This coverage is for claims by third parties and covers all events such as weddings, birthday parties, concerts, trade shows, festivals, etc.',
  },
  {
    id: '2',
    category: 'general',
    question: 'When should I purchase event insurance?',
    answer: 'Special event insurance should be purchased as soon as you book your event. The cost of liability coverage does not change, so purchasing earlier maximizes your benefits if the event is cancelled. If you wait to purchase and something happens, you may not be covered.',
  },
  {
    id: '3',
    category: 'general',
    question: 'How far before my event should I purchase special event insurance?',
    answer: 'We recommend purchasing your event insurance as soon as you book your venue. This helps secure your booking since most venues require the host to have event liability insurance, and makes sure you have time to make any updates or changes to the policy if needed. If needed, One Day Event allows you to purchase special event insurance as late as a few hours before your event — just contact us if you need it urgently.',
  },
  {
    id: '4',
    category: 'general',
    question: 'Should I purchase event insurance?',
    answer: 'Most venues require the event holders purchase special event coverage. With injuries and lawsuits due to events at an all-time high, it is crucial to protect yourself from the cost of a claim which can be over fifty-thousand dollars due to a minor issue.',
  },
  {
    id: '5',
    category: 'general',
    question: 'Do I need special event insurance?',
    answer: 'Special event insurance is not legally required, but most venues require you to have your own liability coverage. With lawsuits and injuries during events at an all-time high, it is crucial to protect yourself against third party claims so you do not lose thousands of dollars for something minor.',
  },
  {
    id: '6',
    category: 'general',
    question: 'Do I need special event insurance if the venue already has coverage?',
    answer: 'Venues require the event holder to have their own one day event insurance policy. The most common requirement of the policy is $1 million of coverage, although many venues now require $2 million.',
  },
  {
    id: '7',
    category: 'general',
    question: 'Why choose One Day Event for your special event insurance?',
    answer: 'We make it easy to get an affordable quote and guarantee coverage that meets all venue requirements. We only work with the top-rated carriers in the nation. We are available 7 days a week with longer hours than anyone else. Our user-friendly customer portal allows you to do everything online in seconds. We are best-price guaranteed and cover all types of events. We have been in the industry since 1985, and we donate a portion of every premium to local and global causes.',
  },
  {
    id: '8',
    category: 'general',
    question: 'Is event insurance required?',
    answer: 'Special event insurance is required by most venues in the USA. Generally, venues need a policy with a $1 million per occurrence / $2 million aggregate coverage limit. One Day Event provides you with a quote for all the top plans for your event to ensure that your policy meets all requirements.',
  },
  {
    id: '9',
    category: 'general',
    question: 'What is an additional insured?',
    answer: 'An additional insured is a person, business, or place that is added onto your policy to be included in the coverage. In event insurance, the host of an event must add their venue as an additional insured. One Day Event automatically adds your venue as an additional insured when you purchase a policy with us.',
  },
  {
    id: '10',
    category: 'general',
    question: 'What do I show my venue that requires event insurance?',
    answer: 'Venues that require one day event insurance need a certificate of insurance, aka proof of liability. This is the certificate you get after purchasing special event insurance that proves you are insured. Venues usually require $1 million in liability and $2 million in aggregate as the minimum coverage.',
  },
  // Coverage
  {
    id: '11',
    category: 'coverage',
    question: 'What does special event insurance cover?',
    answer: 'Special event insurance, aka one day event insurance, covers events like weddings, parties, concerts, trade shows, festivals, etc. The coverage compensates you for costs of property damage, injuries, and lawsuit claims you may be responsible for. Plans may cover the cost of cancelling your event as well.',
  },
  {
    id: '12',
    category: 'coverage',
    question: 'What type of events does special event insurance cover?',
    answer: 'Special event insurance covers events such as: Weddings, Birthday parties, Concerts, Festivals, Trade show conferences, and many more. One Day Event covers all types of events — contact us if you are unsure about coverage or have any questions!',
  },
  {
    id: '13',
    category: 'coverage',
    question: 'What does per occurrence and aggregate mean?',
    answer: 'Your per occurrence limit is the coverage you have for each individual claim you file. Your aggregate limit is the total coverage you have for the whole event. For example, in a standard $1M per occurrence / $2M aggregate policy, you are eligible to receive $1 million compensation for each claim, but no more than $2 million total. If there was one lawsuit for $1.5 million, you would only be covered up to $1 million. If there were two separate $1 million lawsuits, both would be covered. If there were three separate $1 million lawsuits, only two would be covered since you reached your $2 million aggregate.',
  },
  {
    id: '14',
    category: 'coverage',
    question: 'Does event insurance have a deductible?',
    answer: 'Special event insurance can come with a deductible, but we recommend purchasing policies with a $0 deductible since event insurance claims can be expensive. It is always best to enjoy your event without any worries.',
  },
  {
    id: '15',
    category: 'coverage',
    question: "Do One Day Event's policies meet all venue requirements?",
    answer: 'One Day Event has policies from all the top-rated carriers in the USA, so no matter what your requirements are, we have a policy that will meet those requirements. If you don\'t know if the policy meets your requirements, just contact us and we can help you get the right one.',
  },
  // Service
  {
    id: '16',
    category: 'service',
    question: 'How do I get my certificate of insurance?',
    answer: 'When purchasing event liability insurance from One Day Event, you get a Certificate of Insurance, aka proof of liability, in one day or less. Purchasing a special event policy takes 5 minutes and can be done instantly. After purchase, the underwriters approve the policy and we send you the certificate!',
  },
  {
    id: '17',
    category: 'service',
    question: 'How do I contact One Day Event?',
    answer: 'We are always available during our business hours (Weekdays: 5am–7pm PST, Weekends: 6am–5pm PST). You may also email us at support@onedayevent.com at any time and we will get back to you as soon as possible.',
  },
  {
    id: '18',
    category: 'service',
    question: 'When do I get my Certificate of Insurance?',
    answer: 'The moment you purchase special event coverage through One Day Event, we provide you your Certificate of Insurance within 24 hours. Purchasing special event insurance takes no longer than 5 minutes and can be done instantly online. Once the underwriter approves the policy, we send you your proof of liability!',
  },
  {
    id: '19',
    category: 'service',
    question: 'What do I do if I need to make edits to my Certificate?',
    answer: 'The easiest way to get an edit to your Certificate of Insurance is to message us in the "Messages" tab of your Customer Portal. We receive the message and will respond to your query and upload the new Certificate to your Customer Portal when it\'s ready. We will also email you a copy. You may also email us at support@onedayevent.com anytime.',
  },
  {
    id: '20',
    category: 'service',
    question: 'What if my event gets moved to a later date?',
    answer: 'Just let us know of the new date and we\'ll update the policy for you. The coverage or price won\'t change, and we will amend your Certificate so you don\'t have to worry about a thing.',
  },
  {
    id: '21',
    category: 'service',
    question: 'How do I file a claim?',
    answer: 'To file a claim, gather your Claim Documents from your Customer Portal and fill them out to the best of your ability. Gather all important documentation with regards to the claim as well, such as pictures, records, videos, etc., and send those to us at support@onedayevent.com so we can help you get the claim processed.',
  },
  // Purchase
  {
    id: '22',
    category: 'purchase',
    question: 'How much does special event insurance cost?',
    answer: 'Special event insurance costs vary based on length of the event, number of attendees, and type of event being held. Get a free instant quote on our site to see real pricing for your specific event — it only takes 2 minutes.',
  },
  {
    id: '23',
    category: 'purchase',
    question: 'What do I get when I purchase special event insurance?',
    answer: 'When you purchase event insurance with One Day Event, you get a Certificate of Insurance that you may show to your venue as proof of liability. You also get a login to your Customer Portal where you can view or make edits to your policy and documents at any time.',
  },
  {
    id: '24',
    category: 'purchase',
    question: 'How late can I purchase special event insurance?',
    answer: 'You may purchase special event insurance when you book your event or as late as an hour before. The cost of event liability insurance may increase if you purchase the same day, otherwise it remains the same. Therefore it is best to purchase earlier and maximize your benefits.',
  },
  {
    id: '25',
    category: 'purchase',
    question: 'Do I get a refund if my event gets cancelled?',
    answer: 'If your event gets cancelled, just let us know about the cancellation and we\'ll refund your premium. We must have at least 1 business day\'s notice to get your refund, so let us know about your cancellation as soon as you know about it.',
  },
]

const TABS: { key: Category; label: string; icon: string }[] = [
  { key: 'general',  label: 'General',  icon: '/assets/images/faq-icon-general.svg'  },
  { key: 'coverage', label: 'Coverage', icon: '/assets/images/faq-icon-customer.svg' },
  { key: 'service',  label: 'Service',  icon: '/assets/images/faq-icon-service.svg'  },
  { key: 'purchase', label: 'Purchase', icon: '/assets/images/faq-icon-payment.svg'  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function AccordionItem({ item, isOpen, onToggle }: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${isOpen ? 'border-[#1CA0DF]' : 'border-[#E3E3E3]'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-[#EDF0FA]/50 transition-colors"
      >
        <span className={`font-semibold text-sm leading-snug ${isOpen ? 'text-[#1CA0DF]' : 'text-[#262D45]'}`}>
          {item.question}
        </span>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            isOpen ? 'bg-[#1CA0DF] border-[#1CA0DF] text-white' : 'border-[#D1D5DB] text-[#6B7280]'
          }`}
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-5 bg-white border-t border-[#E3E3E3]/60">
          <p className="text-[#505458] text-sm leading-relaxed pt-4">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState<Category>('general')
  const [searchQuery, setSearchQuery]   = useState('')
  const [openId, setOpenId] = useState<string | null>('1')

  const isSearching = searchQuery.trim().length > 0

  const displayItems = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.toLowerCase()
      return FAQ_ITEMS.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      )
    }
    return FAQ_ITEMS.filter((item) => item.category === activeTab)
  }, [activeTab, searchQuery, isSearching])

  function handleTabChange(tab: Category) {
    setActiveTab(tab)
    setOpenId(null)
    setSearchQuery('')
  }

  return (
    <PublicLayout>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative text-white py-20 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #105778 0%, #1CA0DF 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <img src="/assets/images/faq-icon-general.svg" alt="" className="w-4 h-4" />
            Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Everything you need to know about event insurance.
          </p>

          {/* ── Search ────────────────────────────────────────────────── */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[#105778]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-[#262D45] bg-white shadow-lg text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* ── Category Tabs (hidden when searching) ─────────────────────── */}
        {!isSearching && (
          <div className="flex flex-wrap gap-2 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#1CA0DF] text-white shadow-md'
                    : 'bg-white text-[#505458] border border-[#E3E3E3] hover:border-[#1CA0DF] hover:text-[#1CA0DF]'
                }`}
              >
                <img src={tab.icon} alt="" className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Search result label ────────────────────────────────────────── */}
        {isSearching && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#797979]">
              {displayItems.length} result{displayItems.length !== 1 ? 's' : ''} for{' '}
              <span className="font-semibold text-[#262D45]">"{searchQuery}"</span>
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-[#1CA0DF] hover:underline font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {/* ── Accordion ─────────────────────────────────────────────────── */}
        {displayItems.length > 0 ? (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#EDF0FA] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#1CA0DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#262D45] font-semibold mb-2">No matching questions</p>
            <p className="text-[#797979] text-sm">Try different keywords or browse the categories above.</p>
          </div>
        )}

        {/* ── Still have questions CTA ───────────────────────────────────── */}
        <div className="mt-14 rounded-2xl bg-gradient-to-br from-[#105778] to-[#1CA0DF] p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-white/80 text-sm mb-6">
            Our team is available 7 days a week to help you find the right coverage.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#105778] font-bold px-6 py-3 rounded-xl hover:bg-[#EDF0FA] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </Link>
            <Link
              to="/onedayevent"
              className="inline-flex items-center justify-center gap-2 bg-[#E0232C] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#C51E26] transition"
            >
              Get a Free Quote
            </Link>
          </div>
        </div>

      </div>
    </PublicLayout>
  )
}
