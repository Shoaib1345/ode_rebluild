import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'

const TEAM_VALUES = [
  {
    title: 'Transparency',
    desc: 'We show you real prices from real carriers upfront — no hidden fees, no bait-and-switch.',
  },
  {
    title: 'Speed',
    desc: 'From quote to certificate in minutes. Our platform is built to get out of your way.',
  },
  {
    title: 'Coverage You Can Trust',
    desc: 'We partner with AM Best-rated carriers so you know your policy is solid.',
  },
  {
    title: 'Expert Support',
    desc: 'Our licensed team is available to answer questions before and after your purchase.',
  },
]

export default function AboutPage() {
  return (
    <PublicLayout>

      {/* Hero */}
      <div className="bg-[#105778] text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">About One Day Event Insurance</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            We make event insurance simple, fast, and affordable for everyone.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Mission</h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p>
              One Day Event Insurance was founded with a simple idea: event insurance should be as easy to buy
              as a concert ticket. Nobody planning their wedding or fundraiser gala should have to spend hours
              on the phone with an agent just to get basic coverage.
            </p>
            <p>
              We built a platform that gives instant, bindable quotes from multiple A-rated insurance carriers,
              lets you compare plans side by side, and issues your certificate of insurance the same day you pay.
              The whole process takes under 10 minutes.
            </p>
            <p>
              We serve event planners, venue coordinators, individual hosts, and corporate clients across all
              50 states. Whether you're throwing a backyard graduation party or organizing a 5,000-person
              conference, we have a policy that fits.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TEAM_VALUES.map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner programs */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Work With Us</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We partner with insurance agents, event planners, and venues to make coverage accessible to
            their clients. Our affiliate and partner programs make it easy to recommend us and earn
            a commission on every policy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/partner-signup?type=agent"
              className="bg-[#105778] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0b3f57] transition"
            >
              Agent Program
            </Link>
            <Link
              to="/partner-signup?type=planner"
              className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:border-[#1CA0DF] transition"
            >
              Venue / Planner Program
            </Link>
            <Link
              to="/affiliate-signup"
              className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:border-[#1CA0DF] transition"
            >
              Affiliate Program
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-[#105778] text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Covered?</h2>
          <p className="text-white/70 mb-8">Get an instant quote in under 2 minutes.</p>
          <Link
            to="/onedayevent"
            className="inline-block bg-white text-[#105778] font-bold px-8 py-4 rounded-xl hover:bg-[#EDF0FA] transition"
          >
            Get a Free Quote →
          </Link>
        </div>
      </section>

    </PublicLayout>
  )
}
