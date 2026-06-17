import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { useQuoteStore } from '../stores/quoteStore'
import type { QuoteParams } from '../types'

interface QaItem {
  keywords: string[]
  answer: string
}

interface Message {
  id: number
  role: 'bot' | 'user'
  text: string
}

interface QuickReply {
  label: string
  value: string
}

interface EventTypeOpt {
  id: number
  event_type: string
}

interface StateOpt {
  id: number
  name: string
  abbreviation: string
}

type QuoteStage =
  | null | 'event_type' | 'state' | 'guests' | 'date'
  | 'venue' | 'alcohol' | 'alcohol_type' | 'insured'
  | 'loading' | 'done'
  | 'checkout_name' | 'checkout_email' | 'saving'

interface QuoteState {
  stage: QuoteStage
  eventType?: number
  eventTypeLabel?: string
  eventState?: string
  persons?: number
  eventDates?: string
  privateResidence?: boolean
  isVenue?: boolean
  liquor?: boolean
  hostLiquor?: boolean
  additionalInsureds?: number
  contactName?: string
  contactEmail?: string
}

interface QuotePlanLite {
  total: number
  min_limit: number
  max_limit: number
  recommended: boolean
}

// ─── Built-in knowledge base (always available; admin entries take priority) ──

const DEFAULT_QA: QaItem[] = [
  { keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'], answer: "Hi! Welcome to One Day Event Insurance. I'm here to help with event insurance questions, and I can get you a quick quote too. How can I assist you today?" },
  { keywords: ['what events', 'events cover', 'type of event', 'which event', 'all events'], answer: 'We cover weddings, birthday parties, concerts, festivals, Bar and Bat Mitzvahs, vendor events, corporate events, and many special one-day occasions.' },
  { keywords: ['wedding', 'wedding insurance', 'wedding cover', 'wedding party'], answer: 'Yes. We offer wedding event insurance that helps protect you if a guest gets injured or venue property is damaged.' },
  { keywords: ['birthday', 'birthday party', 'party insurance', 'birthday event'], answer: 'Yes — we cover birthday parties. It can help satisfy venue requirements and protect against accidents during your party. Tap "Get a quote" to see your exact price.' },
  { keywords: ['concert', 'music event', 'music show', 'live show'], answer: 'Concert and music event insurance is available. Coverage can include general liability for attendees, performers, and venue requirements.' },
  { keywords: ['festival', 'outdoor event', 'fair', 'outdoor festival'], answer: 'Festival insurance is available for indoor and outdoor festivals of many sizes. Your quote depends on event details and coverage needs.' },
  { keywords: ['bar mitzvah', 'bat mitzvah', 'mitzvah', 'jewish event'], answer: 'Yes. We offer insurance for Bar and Bat Mitzvah celebrations, including liability coverage for venue requirements.' },
  { keywords: ['vendor', 'vendor event', 'market', 'craft fair', 'trade show'], answer: 'Yes, vendor events like craft fairs, markets, and trade shows can be covered, especially when organizers require proof of insurance.' },
  { keywords: ['corporate', 'corporate event', 'company event', 'office party'], answer: 'Corporate events and office parties can be covered with liability protection for accidents during the event.' },
  { keywords: ['price', 'cost', 'how much', 'pricing', 'rates', 'affordable', 'cheap', 'expensive', 'afford', 'fee'], answer: 'Pricing depends on your event type, guest count, location, date, and the coverage limit you choose — so it varies for each event. The best way to see your exact price is a quick quote: I\'ll ask a few short questions and show you your plans. Want me to grab your instant price now?' },
  { keywords: ['certificate', 'coi', 'proof of insurance', 'certificate of insurance', 'document'], answer: 'Your Certificate of Insurance is provided immediately after purchase, so you can download it and share it with your venue.' },
  { keywords: ['how long', 'same day', 'fast', 'quick', 'instant', 'how fast'], answer: 'The process is fast. You can get a quote, purchase a policy, and receive your Certificate of Insurance the same day.' },
  { keywords: ['liability', 'what is covered', 'coverage', 'what does it cover', 'protection'], answer: 'Event liability insurance can cover bodily injury, property damage, and legal fees if you are sued. Coverage limits may vary by plan.' },
  { keywords: ['coverage limit', 'how much coverage', 'maximum coverage', '1 million'], answer: 'Coverage limits can range from $500,000 up to $2,000,000 depending on the plan you choose.' },
  { keywords: ['location', 'where', 'based', 'address', 'san jose', 'silicon valley', 'california'], answer: 'One Day Event Insurance is based in San Jose, California and serves customers across the United States. The company has been helping customers since 1990.' },
  { keywords: ['since', 'how long in business', 'experience', 'founded', 'history', '1990', 'years'], answer: 'One Day Event Insurance has been in business since 1990, with decades of experience helping people protect special events.' },
  { keywords: ['contact', 'phone', 'email', 'reach', 'talk', 'speak', 'call', 'support'], answer: 'You can contact the One Day Event team through onedayevent.com.' },
  { keywords: ['website', 'online', 'onedayevent', 'site', 'web'], answer: 'Visit onedayevent.com for free quotes, policy purchases, and Certificate of Insurance access.' },
  { keywords: ['cancel', 'cancellation', 'refund', 'money back'], answer: 'For cancellation or refund questions, please contact the One Day Event team directly because policy terms may vary.' },
  { keywords: ['compare', 'best deal', 'best price', 'best carrier', 'top carrier'], answer: 'One Day Event compares multiple top-rated insurance carriers to help find strong pricing and coverage for your event.' },
  { keywords: ['guest', 'how many guests', 'attendees', 'number of people'], answer: 'Guest count can affect your premium. Coverage options are available for small gatherings and larger events.' },
  { keywords: ['venue', 'venue require', 'venue insurance', 'venue asked'], answer: 'Many venues require event liability insurance. One Day Event can provide proof of insurance after purchase.' },
  { keywords: ['alcohol', 'liquor', 'bar', 'drinks', 'drinking'], answer: 'Events with alcohol may need liquor liability coverage. I can include that when I build your quote — just tap "Get a quote".' },
  { keywords: ['outdoor', 'outside', 'open air', 'tent', 'garden'], answer: 'Outdoor events can be covered, including garden parties, tent weddings, and outdoor festivals.' },
  { keywords: ['damage', 'property damage', 'broken', 'destroyed'], answer: 'Property damage coverage is included in many event liability policies if venue property is damaged during your event.' },
  { keywords: ['injury', 'someone hurt', 'accident', 'guest hurt'], answer: 'If a guest is injured during your event, event liability insurance may cover medical costs and related legal fees.' },
  { keywords: ['thank', 'thanks', 'thank you', 'appreciate'], answer: "You're welcome. Feel free to ask more questions, or tap \"Get a quote\" for an instant price." },
  { keywords: ['bye', 'goodbye', 'see you', 'later', 'take care'], answer: 'Goodbye. Have a wonderful event, and remember you can get a free quote any time.' },
  { keywords: ['help', 'need help', 'assist'], answer: 'I can help with event types, pricing, quotes, coverage, certificates, venues, alcohol coverage, and contact details. Tap "Get a quote" for an instant estimate.' },
  { keywords: ['do i need', 'why do i need', 'is it required', 'do i have to', 'need insurance', 'required'], answer: 'Many venues require event liability insurance before they\'ll let you book — and it protects you financially if a guest is injured or property is damaged. If your venue asks for proof of insurance, we can provide it instantly.' },
  { keywords: ['how do i pay', 'payment', 'pay', 'credit card', 'payment method', 'accept', 'debit'], answer: 'Payment is quick and secure — we accept all major credit and debit cards, and your Certificate of Insurance is issued immediately after purchase.' },
  { keywords: ['claim', 'file a claim', 'how to claim', 'make a claim'], answer: 'If you ever need to file a claim, contact our team and we\'ll guide you through it with your policy details. Most event policies cover bodily injury, property damage, and related legal fees.' },
  { keywords: ['additional insured', 'add my venue', 'name my venue', 'venue on policy'], answer: 'Yes — you can add additional insureds (like your venue) to your policy. I\'ll ask how many when I build your quote, or you can add them during checkout.' },
  { keywords: ['multiple days', 'two day', 'more than one day', 'multi day', 'several days'], answer: 'Our instant policies are built for one-day events. For multi-day events, start a quote and our team can help with the right coverage.' },
]

// Pool of FAQ suggestions. The bot shows a few at a time and rotates in new
// ones as they're used, so the same question never lingers after it's answered.
const SUGGESTION_POOL = [
  'What events do you cover?',
  'How much does it cost?',
  'When do I get my certificate?',
  'What does coverage include?',
  'Do I need event insurance?',
  'Do you cover weddings?',
  'Do you cover birthday parties?',
  'What about alcohol at my event?',
  'Can I add my venue as additional insured?',
  'How fast can I get coverage?',
  "What's the maximum coverage limit?",
  'Do you cover outdoor events?',
  'How do I pay?',
  'Can I get a refund?',
  'Where are you located?',
  'Do you cover corporate events?',
]
const SUGGEST_COUNT = 4

// ── Special quick-reply actions ────────────────────────────────────────────────
const START_QUOTE     = '__start_quote__'
const GOTO_QUOTE      = '__goto_quote__'
const RESTART         = '__restart__'
const BACK            = '__back__'
const CANCEL          = '__cancel__'
const CHOOSE_CHECKOUT = '__choose_checkout__'
const FINISH_CHAT     = '__finish_chat__'
const GO_SITE         = '__go_site__'

const GREETING = "Hi! I'm the One Day Event assistant. Ask me about events, pricing, certificates, or coverage — or tap \"Get a quote\" for an instant estimate."

// Step numbering for the header progress indicator (alcohol_type shares step 6).
const STEP_NUM: Record<string, number> = { event_type: 1, state: 2, guests: 3, date: 4, venue: 5, alcohol: 6, alcohol_type: 6, insured: 7 }
const TOTAL_STEPS = 7

// FAQ-mode quick replies: "Get a quote" + a fresh slice of the suggestion pool,
// excluding anything already asked. Cycles once the whole pool has been used.
function faqReplies(asked: string[]): QuickReply[] {
  const remaining = SUGGESTION_POOL.filter(q => !asked.includes(q))
  const pick = (remaining.length ? remaining : SUGGESTION_POOL).slice(0, SUGGEST_COUNT)
  return [{ label: '💬 Get a quote', value: START_QUOTE }, ...pick.map(q => ({ label: q, value: q }))]
}

const INITIAL_REPLIES: QuickReply[] = faqReplies([])

function findAnswer(input: string, qaItems: QaItem[]): string {
  const normalized = input.toLowerCase()
  const match = qaItems.find(item => item.keywords.some(keyword => keyword && normalized.includes(keyword)))
  return match?.answer ?? "I don't have that answer yet. Try asking about events, pricing, certificates, coverage, location, or contact details — or tap \"Get a quote\" for an instant price."
}

function isQuoteTrigger(text: string): boolean {
  const t = text.toLowerCase()
  return /get (a |an )?quote|start (a )?quote|quick quote|quote my|need a quote|instant quote|get insured|buy (insurance|a policy)/.test(t)
}

function normalizeDate(value: string): string | null {
  const m = value.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (!m) return null
  const mm = m[1].padStart(2, '0')
  const dd = m[2].padStart(2, '0')
  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) return null
  return `${mm}/${dd}/${m[3]}`
}

function money(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const styles: Record<string, CSSProperties> = {
  bubble: { position: 'fixed', right: 24, bottom: 24, width: 62, height: 62, borderRadius: '50%', border: 'none', background: '#E0232C', color: '#fff', fontSize: 28, boxShadow: '0 14px 34px rgba(224, 35, 44, 0.32)', cursor: 'pointer', zIndex: 1000 },
  panel: { position: 'fixed', right: 24, bottom: 98, width: 'min(380px, calc(100vw - 32px))', height: 'min(620px, calc(100vh - 128px))', background: '#fff', border: '1px solid #E3E3E3', borderRadius: 18, boxShadow: '0 24px 70px rgba(38, 45, 69, 0.24)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1000 },
  header: { background: '#E0232C', color: '#fff', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', gap: 12 },
  title: { margin: 0, fontSize: 16, fontWeight: 800, lineHeight: '22px' },
  subtitle: { margin: '2px 0 0', fontSize: 12, opacity: 0.78, lineHeight: '16px' },
  close: { width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 18 },
  messages: { flex: 1, padding: 16, overflowY: 'auto', background: '#FBF6F7' },
  botMessage: { maxWidth: '86%', marginBottom: 10, padding: '10px 12px', borderRadius: '14px 14px 14px 4px', background: '#fff', color: '#262D45', fontSize: 14, lineHeight: '20px', boxShadow: '0 3px 10px rgba(55, 106, 136, 0.08)', whiteSpace: 'pre-line' },
  userMessage: { maxWidth: '86%', margin: '0 0 10px auto', padding: '10px 12px', borderRadius: '14px 14px 4px 14px', background: '#E0232C', color: '#fff', fontSize: 14, lineHeight: '20px', whiteSpace: 'pre-line' },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 },
  suggestionButton: { border: '1px solid #F3C5C8', background: '#fff', color: '#C41E26', borderRadius: 999, padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  inputRow: { display: 'flex', gap: 8, padding: 14, borderTop: '1px solid #E3E3E3', background: '#fff' },
  input: { flex: 1, minWidth: 0, border: '1px solid #D8DEE8', borderRadius: 999, padding: '11px 14px', fontSize: 14, outline: 'none' },
  send: { border: 'none', borderRadius: 999, background: '#E0232C', color: '#fff', padding: '0 16px', fontSize: 14, fontWeight: 800, cursor: 'pointer' },
}

export default function ChatbotWidget() {
  const navigate = useNavigate()
  const setQuoteParams = useQuoteStore((s) => s.setParams)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [adminQa, setAdminQa] = useState<QaItem[]>([])
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', text: GREETING },
  ])
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(INITIAL_REPLIES)
  const [quote, setQuote] = useState<QuoteState>({ stage: null })
  const [history, setHistory] = useState<QuoteStage[]>([])
  const [typing, setTyping] = useState(false)
  const [asked, setAsked] = useState<string[]>([])
  const [eventTypes, setEventTypes] = useState<EventTypeOpt[]>([])
  const [states, setStates] = useState<StateOpt[]>([])
  const nextId = useRef(2)
  const endRef = useRef<HTMLDivElement>(null)

  // Load admin-managed Q&A (layered on top of the built-in defaults).
  useEffect(() => {
    api.get<{ keywords: string[]; answer: string }[]>('/chatbot/qa')
      .then(res => setAdminQa((res.data ?? []).map(r => ({ keywords: r.keywords ?? [], answer: r.answer }))))
      .catch(() => { /* fall back to built-ins */ })
  }, [])

  const qaItems = useMemo(() => [...adminQa, ...DEFAULT_QA], [adminQa])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, quickReplies, typing])

  function addBot(text: string) {
    setMessages(cur => [...cur, { id: nextId.current++, role: 'bot', text }])
  }
  function addUser(text: string) {
    setMessages(cur => [...cur, { id: nextId.current++, role: 'user', text }])
  }

  // Answer a FAQ and refresh the suggestion chips so the asked question drops
  // off and new ones rotate in.
  function answerFaq(question: string) {
    addBot(findAnswer(question, qaItems))
    const match = SUGGESTION_POOL.find(q => q.toLowerCase() === question.trim().toLowerCase())
    let next = match && !asked.includes(match) ? [...asked, match] : asked
    if (SUGGESTION_POOL.every(q => next.includes(q))) next = []   // whole pool used → cycle
    setAsked(next)

    const replies = faqReplies(next)
    // For pricing questions, lead with a stronger "see my plans" call to action.
    if (/price|cost|how much|expensive|cheap|afford|pricing|\bfee\b|\brate/i.test(question)) {
      replies[0] = { label: '💰 Get my instant price', value: START_QUOTE }
    }
    setQuickReplies(replies)
  }

  // ── Quote flow ───────────────────────────────────────────────────────────────

  // Quick replies for a step, always with Back (after step 1) + Cancel.
  function buildReplies(stage: QuoteStage, opts: QuickReply[]): QuickReply[] {
    const nav: QuickReply[] = []
    if (stage && stage !== 'event_type') nav.push({ label: '← Back', value: BACK })
    nav.push({ label: '✕ Cancel', value: CANCEL })
    return [...opts, ...nav]
  }

  // Render (or re-render, for "back") a single step: its question + chips.
  function ask(stage: QuoteStage) {
    setQuote(q => ({ ...q, stage }))
    switch (stage) {
      case 'event_type':
        addBot('What type of event are you insuring?')
        setQuickReplies(buildReplies(stage, eventTypes.slice(0, 8).map(e => ({ label: e.event_type, value: String(e.id) }))))
        break
      case 'state':
        addBot('Which US state is the event in? (e.g. CA or California)')
        setQuickReplies(buildReplies(stage, []))
        break
      case 'guests':
        addBot('Roughly how many guests are you expecting?')
        setQuickReplies(buildReplies(stage, [25, 50, 100, 200, 500].map(n => ({ label: String(n), value: String(n) }))))
        break
      case 'date':
        addBot("What's the event date? (MM/DD/YYYY)")
        setQuickReplies(buildReplies(stage, []))
        break
      case 'venue':
        addBot('Where is the event being held?')
        setQuickReplies(buildReplies(stage, [{ label: 'Private residence', value: 'private' }, { label: 'Commercial venue', value: 'venue' }]))
        break
      case 'alcohol':
        addBot('Will alcohol be served at the event?')
        setQuickReplies(buildReplies(stage, [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]))
        break
      case 'alcohol_type':
        addBot('Will the alcohol be sold to guests, or provided free of charge?')
        setQuickReplies(buildReplies(stage, [{ label: 'Sold to guests', value: 'sold' }, { label: 'Free / hosted', value: 'free' }]))
        break
      case 'insured':
        addBot('Last one — how many additional insureds do you need (e.g. your venue)?')
        setQuickReplies(buildReplies(stage, [{ label: 'None', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }]))
        break
      default:
        break
    }
  }

  // Apply an answer, remember the step we came from, then ask the next one.
  function advance(patch: Partial<QuoteState>, next: QuoteStage, ack?: string) {
    setHistory(h => [...h, quote.stage as QuoteStage])
    setQuote(q => ({ ...q, ...patch }))
    if (ack) addBot(ack)
    ask(next)
  }

  function goBack() {
    if (history.length === 0) { cancelQuote(); return }
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    addBot('Sure — let\'s revisit that.')
    ask(prev)
  }

  function cancelQuote() {
    setQuote({ stage: null }); setHistory([]); setTyping(false)
    addBot('No problem — I\'ve cancelled the quote. Ask me anything, or tap "Get a quote" to start again.')
    setQuickReplies(faqReplies(asked))
  }

  function resetChat() {
    setMessages([{ id: nextId.current++, role: 'bot', text: GREETING }])
    setQuote({ stage: null }); setHistory([]); setAsked([]); setTyping(false)
    setQuickReplies(faqReplies([]))
    setInput('')
  }

  // ── Checkout handoff ─────────────────────────────────────────────────────────

  function buildQuoteParams(q: QuoteState): Partial<QuoteParams> {
    return {
      eventType:           q.eventType,
      eventTypeName:       q.eventTypeLabel,
      eventDates:          q.eventDates,
      event_state:         q.eventState,
      number_of_persons:   q.persons,
      liquor:              q.liquor ? 1 : 0,
      host_liquor:         q.hostLiquor ? 1 : 0,
      privateResidence:    q.privateResidence ? 1 : 0,
      isSetVenue:          q.isVenue ? 1 : 0,
      additional_insureds: q.additionalInsureds ?? 0,
      noha: 0, w_o_s: 0, p_a_n_c_b: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }

  // Pre-fill the site's quote store with the collected answers and jump to plans.
  function goToCheckout() {
    setQuoteParams(buildQuoteParams(quote))
    navigate('/quote/plans')
    setOpen(false)
  }

  function offerCheckout() {
    addBot('Awesome! 🎉 How would you like to finish and get your Certificate of Insurance?')
    setQuickReplies([
      { label: '💬 Finish right here', value: FINISH_CHAT },
      { label: '🌐 Go to checkout page', value: GO_SITE },
    ])
  }

  function startCheckoutCapture() {
    setQuote(q => ({ ...q, stage: 'checkout_name' }))
    addBot("Perfect — let's lock it in. What name should I put on the certificate?")
    setQuickReplies([{ label: '✕ Cancel', value: CANCEL }])
  }

  async function saveQuote(q: QuoteState) {
    try {
      await api.post('/leads/pending', {
        email:         q.contactEmail,
        current_route: '/quote/plans',
        wizard_state:  { params: buildQuoteParams(q) },
      })
      setTyping(false)
      addBot(`✅ All set${q.contactName ? `, ${q.contactName}` : ''}! I've saved your quote and emailed a secure link to ${q.contactEmail} so you can choose your plan and finish checkout. Want to do it right now?`)
      setQuickReplies([{ label: 'Complete checkout →', value: GO_SITE }, { label: '🔄 Start over', value: RESTART }])
    } catch {
      setTyping(false)
      addBot("Hmm, I couldn't save that just now — but you can still finish on our checkout page.")
      setQuickReplies([{ label: '🌐 Go to checkout', value: GO_SITE }, { label: '🔄 Start over', value: RESTART }])
    }
    setQuote(q2 => ({ ...q2, stage: 'done' }))
  }

  function startQuote() {
    setHistory([])
    setQuote({ stage: 'event_type' })
    setOpen(true)
    addBot("Let's get you a fast, free estimate — just a few quick questions. What type of event are you insuring?")
    const chips = (list: EventTypeOpt[]) => buildReplies('event_type', list.slice(0, 8).map(e => ({ label: e.event_type, value: String(e.id) })))
    if (eventTypes.length === 0) {
      setQuickReplies(buildReplies('event_type', []))
      api.get<EventTypeOpt[]>('/event-types').then(res => { setEventTypes(res.data); setQuickReplies(chips(res.data)) }).catch(() => {})
    } else {
      setQuickReplies(chips(eventTypes))
    }
    if (states.length === 0) api.get<StateOpt[]>('/us-states').then(res => setStates(res.data)).catch(() => {})
  }

  function resolveEventType(value: string): EventTypeOpt | undefined {
    const asId = Number(value)
    if (!Number.isNaN(asId)) { const m = eventTypes.find(e => e.id === asId); if (m) return m }
    const v = value.toLowerCase().trim()
    return eventTypes.find(e => e.event_type.toLowerCase() === v)
      ?? eventTypes.find(e => v.length >= 3 && (v.includes(e.event_type.toLowerCase()) || e.event_type.toLowerCase().includes(v)))
  }

  function resolveState(value: string): { code: string; display: string } | undefined {
    const raw = value.trim()
    const v = raw.toLowerCase()
    const st = states.find(s => s.abbreviation.toLowerCase() === v)
      ?? states.find(s => s.name.toLowerCase() === v)
      ?? (v.length >= 3 ? states.find(s => s.name.toLowerCase().includes(v)) : undefined)
    if (st) return { code: st.abbreviation, display: st.name }
    if (/^[a-zA-Z]{2}$/.test(raw)) return { code: raw.toUpperCase(), display: raw.toUpperCase() }
    if (states.length === 0 && raw.length >= 4) return { code: raw, display: raw }
    return undefined
  }

  async function fetchQuote(q: QuoteState) {
    try {
      const res = await api.get<{ plans: Record<string, QuotePlanLite | null> }>('/quote', {
        params: {
          event_type:          q.eventType,
          event_state:         q.eventState,
          persons:             q.persons,
          event_dates:         q.eventDates,
          liquor:              q.liquor ? 1 : 0,
          host_liquor:         q.hostLiquor ? 1 : 0,
          private_residence:   q.privateResidence ? 1 : 0,
          is_venue:            q.isVenue ? 1 : 0,
          additional_insureds: q.additionalInsureds ?? 0,
          timezone:            Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
      const plans = res.data.plans ?? {}
      const list = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption']
        .map(k => plans[k]).filter((p): p is QuotePlanLite => !!p)
      setTyping(false)

      if (list.length === 0) {
        addBot("I couldn't find an instant rate for those exact details — our full quote tool can help you explore options (some combinations, like alcohol sold to guests, need a quick manual review).")
        setQuickReplies([{ label: 'Open quote tool →', value: GOTO_QUOTE }, { label: '🔄 Start over', value: RESTART }])
      } else {
        const min = Math.min(...list.map(p => p.total))
        const rec = list.find(p => p.recommended) ?? list[0]
        addBot(
          `Here's your estimate for a ${q.eventTypeLabel} in ${q.eventState} 🎉\n\n` +
          `⭐ Recommended: $${money(rec.total)} — $${rec.min_limit}M / $${rec.max_limit}M coverage\n` +
          `💰 Plans start at $${money(min)}\n\n` +
          'That includes your Certificate of Insurance the same day. Ready to finish and buy?'
        )
        setQuickReplies([{ label: 'Continue & buy →', value: CHOOSE_CHECKOUT }, { label: '🔄 Start over', value: RESTART }])
      }
    } catch {
      setTyping(false)
      addBot('Sorry, something went wrong calculating your quote. Please try our full quote tool.')
      setQuickReplies([{ label: 'Open quote tool →', value: GOTO_QUOTE }, { label: '🔄 Start over', value: RESTART }])
    }
    setQuote(q2 => ({ ...q2, stage: 'done' }))
    setHistory([])
  }

  function handleQuoteAnswer(value: string) {
    switch (quote.stage) {
      case 'event_type': {
        const et = resolveEventType(value)
        if (!et) { addBot("Hmm, I didn't recognise that event type. Pick one from the buttons, or type its name."); return }
        advance({ eventType: et.id, eventTypeLabel: et.event_type }, 'state', `Great — ${et.event_type} ✓`)
        break
      }
      case 'state': {
        const r = resolveState(value)
        if (!r) { addBot("I couldn't find that state. Try the 2-letter code (e.g. CA) or the full name."); return }
        advance({ eventState: r.code }, 'guests', `${r.display} ✓`)
        break
      }
      case 'guests': {
        const n = parseInt(value.replace(/[^0-9]/g, ''), 10)
        if (!n || n < 1) { addBot('Please enter a valid guest count, e.g. 100.'); return }
        advance({ persons: n }, 'date', `${n} guests ✓`)
        break
      }
      case 'date': {
        const d = normalizeDate(value)
        if (!d) { addBot('Please enter the date as MM/DD/YYYY, e.g. 09/15/2026.'); return }
        advance({ eventDates: d }, 'venue', `${d} ✓`)
        break
      }
      case 'venue': {
        const v = value.toLowerCase()
        const isPrivate = v.includes('priv') || v.includes('home') || v.includes('house') || v.includes('backyard')
        advance({ privateResidence: isPrivate, isVenue: !isPrivate }, 'alcohol', `${isPrivate ? 'Private residence' : 'Commercial venue'} ✓`)
        break
      }
      case 'alcohol': {
        const yes = /^y/i.test(value.trim()) || value.toLowerCase().includes('yes')
        if (!yes) advance({ liquor: false, hostLiquor: false }, 'insured', 'No alcohol ✓')
        else advance({}, 'alcohol_type')
        break
      }
      case 'alcohol_type': {
        const sold = value.toLowerCase().includes('sold') || value.toLowerCase().includes('sell')
        advance({ liquor: sold, hostLiquor: !sold }, 'insured', sold ? 'Sold to guests ✓' : 'Free / hosted ✓')
        break
      }
      case 'insured': {
        const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
        const count = Number.isNaN(parsed) ? 0 : Math.min(parsed, 99)
        setHistory(h => [...h, 'insured'])
        setQuote(q => ({ ...q, additionalInsureds: count, stage: 'loading' }))
        setQuickReplies([])
        setTyping(true)
        void fetchQuote({ ...quote, additionalInsureds: count })
        break
      }
      case 'checkout_name': {
        const name = value.trim()
        if (name.length < 2) { addBot('Please enter your name so we can put it on the certificate.'); return }
        setQuote(q => ({ ...q, contactName: name, stage: 'checkout_email' }))
        addBot(`Thanks, ${name}! What's the best email for your quote and certificate?`)
        setQuickReplies([{ label: '✕ Cancel', value: CANCEL }])
        break
      }
      case 'checkout_email': {
        const email = value.trim()
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { addBot('That email looks off — please try again, e.g. you@example.com.'); return }
        setQuote(q => ({ ...q, contactEmail: email, stage: 'saving' }))
        setQuickReplies([])
        setTyping(true)
        void saveQuote({ ...quote, contactEmail: email })
        break
      }
      default:
        break
    }
  }

  // ── Routing ────────────────────────────────────────────────────────────────────

  function routeInput(value: string) {
    const v = value.trim().toLowerCase()
    const inFlow = !!quote.stage && quote.stage !== 'done' && quote.stage !== 'loading' && quote.stage !== 'saving'

    if (/^(restart|start over|reset|begin again|new quote)$/.test(v)) { startQuote(); return }
    if (/^(cancel|stop|exit|quit|never ?mind|close|forget it)$/.test(v)) {
      if (inFlow) cancelQuote(); else answerFaq(value); return
    }
    if (inFlow && /^(back|go ?back|previous|prev|undo|change|edit)$/.test(v)) { goBack(); return }
    if (inFlow) { handleQuoteAnswer(value); return }
    if (isQuoteTrigger(v)) { startQuote(); return }
    answerFaq(value)
  }

  function onSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    addUser(trimmed)
    setInput('')
    setOpen(true)
    routeInput(trimmed)
  }

  function onChip(qr: QuickReply) {
    setOpen(true)
    if (qr.value === START_QUOTE)     { addUser('Get a quote'); startQuote(); return }
    if (qr.value === GOTO_QUOTE)      { navigate('/onedayevent'); setOpen(false); return }
    if (qr.value === CHOOSE_CHECKOUT) { addUser('Continue & buy'); offerCheckout(); return }
    if (qr.value === FINISH_CHAT)     { addUser('Finish here in chat'); startCheckoutCapture(); return }
    if (qr.value === GO_SITE)         { addUser('Go to checkout'); goToCheckout(); return }
    if (qr.value === RESTART)         { addUser('Start over'); startQuote(); return }
    if (qr.value === BACK)            { addUser('← Back'); goBack(); return }
    if (qr.value === CANCEL)          { addUser('Cancel'); cancelQuote(); return }
    addUser(qr.label)
    routeInput(qr.value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') onSend(input)
  }
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value)
  }

  return (
    <>
      {open && (
        <section aria-label="One Day Event chatbot" style={styles.panel}>
          <style>{'@keyframes odeBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}.ode-typing-dot{font-size:9px;color:#C41E26;animation:odeBlink 1.1s infinite both}.ode-typing-dot:nth-child(2){animation-delay:.18s}.ode-typing-dot:nth-child(3){animation-delay:.36s}'}</style>
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>One Day Event Chat</h2>
              <p style={styles.subtitle}>
                {typing || quote.stage === 'loading' || quote.stage === 'saving'
                  ? 'Working on it…'
                  : quote.stage === 'checkout_name' || quote.stage === 'checkout_email'
                    ? 'Finishing up — almost done'
                    : quote.stage && quote.stage !== 'done'
                      ? `Quote · Step ${STEP_NUM[quote.stage] ?? 1} of ${TOTAL_STEPS}`
                      : 'Instant answers & quotes.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" aria-label="Reset chat" title="Start a new chat" style={styles.close} onClick={resetChat}>↻</button>
              <button type="button" aria-label="Close chat" title="Close" style={styles.close} onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map(message => (
              <div key={message.id} style={message.role === 'bot' ? styles.botMessage : styles.userMessage}>
                {message.text}
              </div>
            ))}

            {typing && (
              <div style={{ ...styles.botMessage, display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                <span className="ode-typing-dot">●</span>
                <span className="ode-typing-dot">●</span>
                <span className="ode-typing-dot">●</span>
              </div>
            )}

            {quickReplies.length > 0 && (
              <div style={styles.suggestions}>
                {quickReplies.map(qr => (
                  <button key={qr.value + qr.label} type="button" style={styles.suggestionButton} onClick={() => onChip(qr)}>
                    {qr.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={styles.inputRow}>
            <input
              type="text"
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or get a quote..."
              style={styles.input}
              aria-label="Chat message"
            />
            <button type="button" style={styles.send} onClick={() => onSend(input)}>Send</button>
          </div>
        </section>
      )}

      <button type="button" aria-label="Open chat" style={styles.bubble} onClick={() => setOpen(cur => !cur)}>💬</button>
    </>
  )
}
