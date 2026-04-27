import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PublicLayout from '../../components/layout/PublicLayout'

// ─── Data ────────────────────────────────────────────────────────────────────

const ROTATE_WORDS = ['Special Event', 'Wedding', 'Birthday', 'Concert', 'Vendor']

const WHY_ITEMS = [
  {
    img: '/assets/images/why1.svg',
    title: 'Quick & easy quote process',
    desc: 'Just tell us about your event, checkout, & receive your certificate',
  },
  {
    img: '/assets/images/why2.svg',
    title: 'In house claims team',
    desc: 'Our Claims Advocacy Team ensures a smooth & easy claims process',
  },
  {
    img: '/assets/images/why3.svg',
    title: 'Best Price Guaranteed!',
    desc: 'We get policies from the top rated carriers based on your event details',
  },
]

const FAQ_ITEMS = [
  {
    q: 'What is special event insurance?',
    a: 'Special event insurance, aka one day event insurance, is a liability policy that covers events in case of injuries, property damage, or lawsuits that occur. This coverage is for claims by third parties and covers all events such as weddings, birthday parties, concerts, trade shows, festivals, etc.',
  },
  {
    q: 'What does special event insurance cover?',
    a: 'Special event insurance covers events like weddings, parties, concerts, trade shows, festivals, etc. The coverage compensates you for costs of property damage, injuries, and lawsuit claims you may be responsible for. Plans may cover the cost of cancelling your event as well.',
  },
  {
    q: 'How do I get my certificate of insurance?',
    a: 'When you buy a policy from One Day Event, you get your Certificate of Insurance in 24 hours or less. Purchasing a policy takes less than 5 minutes, and once you purchase we send your policy for approval. After approval, the certificate is emailed to you and uploaded to your Customer Portal so you have it 24/7!',
  },
  {
    q: 'How much does event insurance cost?',
    a: 'Event insurance typically starts at $75–$125 for small gatherings and scales based on your event size, type, location, and add-ons. You can get an instant online quote in under 2 minutes — no phone call or agent required.',
  },
  {
    q: 'Do I need event insurance if my venue already has coverage?',
    a: "Your venue's insurance covers the venue itself, not you as the event host. If a guest is injured or property is damaged and you're held responsible, your own event liability policy is what protects you. Many venues require hosts to carry their own policy.",
  },
]

const REVIEWS = [
  {
    id: 1,
    name: 'Francesca Alea',
    img: '/assets/images/icon-review1.png',
    text: 'I was so grateful to find this company when I took on the role as maid of honor for my sister\'s wedding. Having the security helped put her mind at ease. Their customer service really stood out to me — I\'d definitely recommend them!',
  },
  {
    id: 2,
    name: 'Liz Niccum',
    img: '/assets/images/icon-review2.png',
    text: 'I am so grateful I found One Day Event Insurance online. The company was very prompt in offering me an affordable price and I really appreciate that because I found out I needed liability insurance on short notice. I would recommend this company to others.',
  },
  {
    id: 3,
    name: 'Natalie Wheeler',
    img: '/assets/images/icon-review3.png',
    text: 'I had limited knowledge about event insurance and needed a lot of help. The representatives at One Day Event were so incredibly helpful and were able to walk me through the process step by step. I highly recommend them, great customer service!',
  },
  {
    id: 4,
    name: 'Marcel Toorians',
    img: '/assets/images/icon-review4.png',
    text: "I don't know what I would have done without One Day Event considering the problems I ended up having. If they hadn't helped me set up insurance for my Dad's retirement party I would've had a lot of trouble.",
  },
]

const PARTNERS = [
  { img: '/assets/images/home-partner-1.svg', label: 'Vendor',         to: '/partner-signup?type=vendor' },
  { img: '/assets/images/home-partner-2.svg', label: 'Brokers',        to: '/partner-signup?type=agent' },
  { img: '/assets/images/home-partner-3.svg', label: 'Event Planners', to: '/partner-signup?type=planner' },
  { img: '/assets/images/home-partner-4.svg', label: 'Others',         to: '/affiliate-signup' },
]

const GIVING = [
  '/assets/images/home-giving1.png',
  '/assets/images/home-giving2.png',
  '/assets/images/home-giving3.png',
  '/assets/images/home-giving4.png',
]

const BLOG_POSTS = [
  {
    img: '/assets/images/article-main-image.webp',
    href: '/blog',
    title: 'What is wedding insurance',
    excerpt: "Whether you've envisioned your dream wedding since childhood or you're a modern romantic, all brides and grooms-to-be imagine and scrupulously plan out the details of their big day.",
    date: 'Nov 26, 2020',
  },
  {
    img: '/assets/images/article-special-event-insurance.webp',
    href: '/blog',
    title: 'What Is Special Event Insurance?',
    excerpt: 'Special event liability insurance is an investment that can save you thousands in the case of an unexpected situation during your corporate, private, or community event.',
    date: 'Jun 10, 2020',
  },
  {
    img: '/assets/images/blog-tips-10-main.webp',
    href: '/blog',
    title: '10 Tips for Buying Special Event Insurance',
    excerpt: 'Buying special event insurance for the first time can be overwhelming. Here are some helpful tips from the team at One Day Event insurance to help guide you through the process!',
    date: 'Nov 26, 2020',
  },
]

// ─── Rotating word animation ──────────────────────────────────────────────────

function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const PAUSE = 2800
    const FADE  = 350

    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % ROTATE_WORDS.length)
        setVisible(true)
      }, FADE)
    }, PAUSE + FADE)

    return () => clearInterval(timer)
  }, [])

  return (
    <span
      style={{
        display: 'inline-block',
        transition: 'opacity 350ms ease',
        opacity: visible ? 1 : 0,
        color: '#E0232C',
      }}
    >
      {ROTATE_WORDS[index]}
    </span>
  )
}

// ─── Star row ─────────────────────────────────────────────────────────────────

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.643 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.285-3.957z" />
        </svg>
      ))}
    </div>
  )
}

// ─── FAQ accordion ───────────────────────────────────────────────────────────

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-0">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border-b border-[#EDF0FA]">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between text-left py-6 px-1 group"
          >
            <span className="text-[17px] font-bold text-[#262D45] group-hover:text-[#1CA0DF] transition-colors pr-4">
              {item.q}
            </span>
            <span
              className={`flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#262D45] flex items-center justify-center transition-all duration-200 ${
                open === i ? 'bg-[#262D45] rotate-45' : ''
              }`}
            >
              <svg
                className={`w-4 h-4 transition-colors ${open === i ? 'text-white' : 'text-[#262D45]'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
          </button>
          {open === i && (
            <div className="pb-6 px-1 pl-10">
              <p className="text-[15px] font-semibold text-[#505458] leading-[23px] opacity-80 max-w-[70%]">
                {item.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Review card ─────────────────────────────────────────────────────────────

function ReviewCard({ name, img, text }: { name: string; img: string; text: string }) {
  const [expanded, setExpanded] = useState(false)
  const preview = text.slice(0, 180)
  const hasMore = text.length > 180

  return (
    <div className="relative bg-white rounded-[20px] shadow-[0_0_10px_#ddd] px-6 pt-14 pb-8 text-left">
      {/* Avatar */}
      <div className="absolute -top-[45px] left-1/2 -translate-x-1/2 w-[90px] h-[90px] rounded-full bg-gray-200 overflow-hidden shadow-[0_0_10px_#ccc]">
        <img src={img} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* Stars + name side by side */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-[18px] font-semibold text-[#262D45] max-w-[calc(100%-130px)] h-6 overflow-hidden">{name}</h3>
        <Stars />
      </div>

      <p className="text-sm font-[600] text-[#505458] leading-relaxed opacity-80">
        {expanded ? text : preview}{!expanded && hasMore && '…'}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 text-sm font-semibold text-[#1CA0DF] hover:underline"
        >
          {expanded ? 'Show less' : 'Read More'}
        </button>
      )}
    </div>
  )
}

// ─── Reviews carousel (simple prev/next on mobile, grid on desktop) ───────────

function ReviewsSection() {
  const [current, setCurrent] = useState(0)

  return (
    <section className="py-16 sm:py-24 text-center overflow-hidden" style={{ marginBottom: '130px' }}>
      <h2 className="text-[38px] font-[800] text-[#262D45] mb-4">Guaranteed Satisfaction</h2>

      {/* Rating summary */}
      <div className="inline-flex items-center gap-3 mb-12">
        <span className="text-[40px] font-[800] text-[#E0232C] leading-none">5.0</span>
        <div className="flex flex-col items-start gap-1">
          <Stars />
          <span className="text-xs font-semibold text-[#797979]">300+ Reviews</span>
        </div>
      </div>

      {/* Desktop: grid with avatar offset */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-14 max-w-[1100px] mx-auto px-4 sm:px-6 mt-16">
        {REVIEWS.map(r => (
          <ReviewCard key={r.id} {...r} />
        ))}
      </div>

      {/* Mobile: carousel */}
      <div className="sm:hidden px-6 mt-16">
        <ReviewCard {...REVIEWS[current]} />
        <div className="flex justify-center gap-3 mt-8">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === current ? 'bg-[#1CA0DF]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── YouTube video modal ──────────────────────────────────────────────────────

function VideoModal({ onClose }: { onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[800px] bg-black rounded-xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-lg hover:bg-black/90 transition"
          aria-label="Close video"
        >
          ×
        </button>
        <div className="aspect-video">
          <iframe
            src="https://www.youtube.com/embed/LaxLfIeczVk?autoplay=1"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <PublicLayout>
      <Helmet>
        <title>One Day Event Insurance — Instant Quotes for Any Event</title>
        <meta name="description" content="Get free special event insurance liability coverage for weddings, birthdays, vendors. Get quotes & your certificate instantly. Simple, fast, reliable." />
      </Helmet>

      {/* ════════════════════════════════════════════════════════════════════
          1. HERO  — matches ode_new .hero section exactly
      ════════════════════════════════════════════════════════════════════ */}
      <section className="hero-section w-full text-center bg-white">

        {/* Text area — padded to clear the 72px sticky transparent header */}
        <div style={{ paddingTop: '145px', paddingBottom: '20px', paddingLeft: '16px', paddingRight: '16px' }}>
          <h1
            className="font-[900] leading-[1.1] mb-[10px] text-[#262D45]"
            style={{ fontSize: '50px' }}
          >
            <RotatingWord />
            {' '}Insurance
          </h1>
          <p style={{ fontSize: '18px', lineHeight: '25px', marginBottom: '25px' }} className="font-semibold text-[#505458]">
            Get a quote. Buy your plan. Enjoy the event!
          </p>
          {/* btn-maroon: border-radius 60px, line-height 60px, width 180px, font-size 24px */}
          <Link
            to="/onedayevent"
            className="inline-flex items-center justify-center bg-[#E0232C] hover:bg-[#C51E26] text-white font-[700] transition-colors relative z-[1]"
            style={{
              borderRadius: '60px',
              width: '180px',
              height: '60px',
              fontSize: '24px',
              boxShadow: '0px 0px 40px rgba(0,0,0,0.15)',
            }}
          >
            Get Quote
          </Link>
        </div>

        {/* Hero background image — 800px tall */}
        <div
          style={{
            height: '800px',
            width: '100%',
            background: 'url(/assets/images/hero-bg2.webp) no-repeat center bottom',
            backgroundSize: '120%',
          }}
        />
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          2. WHY CHOOSE US  — overlaps hero-bottom by 55px, has video thumbnail
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="w-[1030px] max-w-full mx-auto px-4 sm:px-6 text-center"
        style={{ marginTop: '-55px', position: 'relative', zIndex: 1, marginBottom: '100px' }}
      >
        <h2
          className="font-[900] text-[#262D45] w-full text-center mb-[30px]"
          style={{ fontSize: '38px', lineHeight: '45px' }}
        >
          Why choose One Day Event?
        </h2>

        {/* Video thumbnail — max 650px, centered, click to open modal */}
        <div className="max-w-[650px] w-full mx-auto mb-[100px]">
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="relative w-full block group"
            aria-label="Play video"
          >
            <img
              src="/assets/images/why-choose-thumb.svg"
              alt="Why choose One Day Event — watch video"
              className="w-full"
            />
            {/* Play button overlay */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-[#E0232C] ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        </div>

        {/* Three columns */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-10">
          {WHY_ITEMS.map(({ img, title, desc }) => (
            <div key={title} className="flex-1 flex flex-col items-center text-center">
              <div className="max-w-[190px] w-full mb-[30px] mx-auto">
                <img src={img} alt={title} className="w-full" />
              </div>
              <h3
                className="font-[900] text-[#262D45] mx-auto mb-[15px]"
                style={{ fontSize: '20px', lineHeight: '26px', maxWidth: '145px' }}
              >
                {title}
              </h3>
              <p
                className="font-[600] text-[#505458] mx-auto"
                style={{ fontSize: '14px', lineHeight: '22px', maxWidth: '200px' }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          3. CUSTOMER PORTAL  — home-portal.svg, 100px padding, exact shadow
      ════════════════════════════════════════════════════════════════════ */}
      <section className="w-[1030px] max-w-full mx-auto px-4 sm:px-6" style={{ marginBottom: '100px' }}>
        <div
          className="flex flex-col sm:flex-row items-center gap-8"
          style={{
            background: '#F7F5F5',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.16)',
            borderRadius: '10px',
            padding: 'clamp(40px, 6vw, 100px)',
          }}
        >
          {/* Text — floated left in ode_new, order-1 on desktop */}
          <div
            className="text-left order-2 sm:order-1"
            style={{ maxWidth: '449px', flexShrink: 0 }}
          >
            <h2
              className="font-[900] text-[#262D45] mb-[15px]"
              style={{ fontSize: '38px' }}
            >
              Customer Portal
            </h2>
            <p
              className="font-[600] text-[#505458]"
              style={{ fontSize: '17px', lineHeight: '24px' }}
            >
              Get access to all of your policy details and documents 24/7 in your Customer Portal.
              File claims, send your COI, and add additional insureds at any time!
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center mt-6 bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold transition-colors"
              style={{ borderRadius: '40px', padding: '0 36px', height: '44px', fontSize: '16px' }}
            >
              Access Portal
            </Link>
          </div>

          {/* Image — floated right in ode_new, order-2 on desktop */}
          <div className="order-1 sm:order-2 flex-shrink-0 flex-1 flex justify-center sm:justify-end">
            <img
              src="/assets/images/home-portal.svg"
              alt="Customer Portal"
              className="w-full max-w-[280px] sm:max-w-[380px]"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4. FAQ
      ════════════════════════════════════════════════════════════════════ */}
      <section className="w-[1030px] max-w-full mx-auto px-4 sm:px-6" style={{ marginBottom: '80px' }}>
        <h2
          className="font-[900] text-[#262D45] text-center w-full mb-[30px]"
          style={{ fontSize: '38px' }}
        >
          Frequently Asked Questions
        </h2>

        <div style={{ paddingLeft: '40px' }}>
          <FaqAccordion />
        </div>

        <div className="mt-10">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold transition-colors"
            style={{
              borderRadius: '40px',
              padding: '17px 36px',
              fontSize: '16px',
            }}
          >
            Ask a Question
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          5. PARTNER
      ════════════════════════════════════════════════════════════════════ */}
      <section className="w-[1030px] max-w-full mx-auto px-4 sm:px-6 text-center" style={{ marginBottom: '0px' }}>
        <h2
          className="font-[900] text-[#262D45] mx-auto text-center"
          style={{ fontSize: '38px', lineHeight: '46px', maxWidth: '516px', marginBottom: '30px' }}
        >
          Partner with One Day Event &amp; start making money!
        </h2>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {PARTNERS.map(({ img, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex-1 bg-[#F8F8F8] rounded-[10px] text-center transition-all hover:shadow-[0_0_10px_#e6e6e6] group"
            >
              <div style={{ padding: '36px 0' }}>
                <img
                  src={img}
                  alt={label}
                  className="mx-auto mb-4"
                  style={{ maxHeight: '120px', display: 'block' }}
                />
                <h3
                  className="font-[600] text-[#262D45] group-hover:text-[#4EA5D9] transition-colors"
                  style={{ fontSize: '23px', lineHeight: '30px' }}
                >
                  {label}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. GIVING BACK  — giving-bg.webp on left, text on right
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="w-full overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(248,252,255,0) 0%, #F8FCFF 68.5%)',
          marginBottom: '100px',
        }}
      >
        {/* Desktop layout: image left | text right */}
        <div className="hidden lg:flex" style={{ minHeight: '750px' }}>
          {/* Left: giving-bg.webp */}
          <div
            style={{
              width: '670px',
              flexShrink: 0,
              background: 'url(/assets/images/giving-bg.webp) bottom left no-repeat',
            }}
          />
          {/* Right: text */}
          <div
            className="flex items-start"
            style={{ flex: 1, paddingTop: '220px', paddingRight: '11.3%', paddingLeft: '50px' }}
          >
            <div style={{ maxWidth: '516px' }}>
              <h2
                className="font-[800] text-[#262D45]"
                style={{ fontSize: '40px', lineHeight: '55px', marginBottom: '20px' }}
              >
                Giving Back
              </h2>
              <p
                className="font-[600] text-[#505458]"
                style={{ fontSize: '16px', lineHeight: '24px' }}
              >
                We work with 4 different organizations to support causes locally &amp; globally,
                plus we're 100% paperless. Our customers can donate $1 from every purchase to one
                of our selected charities. With your help, even the smallest event can have a big impact.
              </p>
              <ul
                className="flex justify-between items-center"
                style={{ marginTop: '60px' }}
              >
                {GIVING.map((src, i) => (
                  <li
                    key={i}
                    style={{ height: '100px', lineHeight: '100px', textAlign: 'center' }}
                  >
                    <img
                      src={src}
                      alt={`Charity partner ${i + 1}`}
                      className="h-16 object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden px-6 py-16">
          <div className="max-w-[516px] mx-auto text-center sm:text-left">
            <h2
              className="font-[800] text-[#262D45]"
              style={{ fontSize: '36px', lineHeight: '48px', marginBottom: '16px' }}
            >
              Giving Back
            </h2>
            <p className="font-[600] text-[#505458] text-base leading-[24px]">
              We work with 4 different organizations to support causes locally &amp; globally,
              plus we're 100% paperless. Our customers can donate $1 from every purchase to one
              of our selected charities. With your help, even the smallest event can have a big impact.
            </p>
            <div className="mt-10 flex flex-wrap gap-6 items-center justify-center sm:justify-start">
              {GIVING.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Charity partner ${i + 1}`}
                  className="h-14 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          7. REVIEWS
      ════════════════════════════════════════════════════════════════════ */}
      <ReviewsSection />

      {/* ════════════════════════════════════════════════════════════════════
          8. BLOG
      ════════════════════════════════════════════════════════════════════ */}
      <section className="w-[1030px] max-w-full mx-auto px-4 sm:px-6" style={{ marginBottom: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
          <h2
            className="font-[900] text-[#262D45]"
            style={{ fontSize: '38px', lineHeight: '1.2' }}
          >
            Event Insurance Content
          </h2>
          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center justify-center bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold transition-colors"
            style={{ borderRadius: '40px', padding: '0 28px', height: '44px', fontSize: '16px' }}
          >
            See More
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {BLOG_POSTS.map(({ img, href, title, excerpt, date }) => (
            <div key={title} className="bg-white rounded-xl overflow-hidden border border-[#E3E3E3] hover:shadow-md transition-shadow">
              <Link to={href}>
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${img})` }}
                />
              </Link>
              <div className="p-5">
                <h3 className="text-[16px] font-[700] text-[#262D45] mb-2 leading-[22px] hover:text-[#1CA0DF] transition-colors">
                  <Link to={href}>{title}</Link>
                </h3>
                <p className="text-[13px] text-[#797979] leading-[20px] mb-4">{excerpt}</p>
                <div className="flex items-center justify-between text-[12px]">
                  <strong className="text-[#262D45] font-[700]">By One Day Event</strong>
                  <small className="text-[#797979]">{date}</small>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:hidden text-center mt-6">
          <Link
            to="/blog"
            className="inline-flex items-center justify-center bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold transition-colors"
            style={{ borderRadius: '40px', padding: '0 28px', height: '44px', fontSize: '16px' }}
          >
            See More
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          9. HAVE QUESTIONS?  — Contact (btn-brand) + FAQ (btn-primary w/ pink hover)
      ════════════════════════════════════════════════════════════════════ */}
      <section className="questions-section text-center py-16 px-4" style={{ marginBottom: '100px' }}>
        <div className="max-w-[780px] mx-auto">
          <h2
            className="font-[900] text-[#262D45] mb-4"
            style={{ fontSize: '38px', lineHeight: '1.2' }}
          >
            Have questions?
          </h2>
          <p
            className="font-[600] text-[#505458] mb-8"
            style={{ fontSize: '16px', lineHeight: '24px' }}
          >
            Our top notch sales team is here to help you get the right policy and answer all your
            questions. Give us a call, shoot us an email, or check out our definitions and most
            common FAQ's!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* btn-brand: blue pill */}
            <Link
              to="/contact"
              className="inline-flex items-center justify-center bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold transition-colors"
              style={{ borderRadius: '40px', padding: '0 36px', height: '50px', fontSize: '16px' }}
            >
              Contact Us
            </Link>
            {/* btn-primary: white pill with dark border, pink hover */}
            <Link
              to="/faq"
              className="inline-flex items-center justify-center bg-white text-[#105778] border border-[#105778] font-semibold transition-colors"
              style={{
                borderRadius: '40px',
                padding: '0 36px',
                height: '50px',
                fontSize: '16px',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#ffbcbf'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#c57c80'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#105778'
              }}
            >
              FAQ &amp; Definitions
            </Link>
          </div>
        </div>
      </section>

      {/* YouTube video modal */}
      {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}
    </PublicLayout>
  )
}
