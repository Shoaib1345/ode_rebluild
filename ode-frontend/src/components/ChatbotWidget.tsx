import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

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
  { keywords: ['birthday', 'birthday party', 'party insurance', 'birthday event'], answer: 'Birthday party insurance starts from $45. It can help satisfy venue requirements and protect against accidents during your party.' },
  { keywords: ['concert', 'music event', 'music show', 'live show'], answer: 'Concert and music event insurance is available. Coverage can include general liability for attendees, performers, and venue requirements.' },
  { keywords: ['festival', 'outdoor event', 'fair', 'outdoor festival'], answer: 'Festival insurance is available for indoor and outdoor festivals of many sizes. Your quote depends on event details and coverage needs.' },
  { keywords: ['bar mitzvah', 'bat mitzvah', 'mitzvah', 'jewish event'], answer: 'Yes. We offer insurance for Bar and Bat Mitzvah celebrations, including liability coverage for venue requirements.' },
  { keywords: ['vendor', 'vendor event', 'market', 'craft fair', 'trade show'], answer: 'Yes, vendor events like craft fairs, markets, and trade shows can be covered, especially when organizers require proof of insurance.' },
  { keywords: ['corporate', 'corporate event', 'company event', 'office party'], answer: 'Corporate events and office parties can be covered with liability protection for accidents during the event.' },
  { keywords: ['price', 'cost', 'how much', 'pricing', 'rates', 'affordable', 'cheap'], answer: 'Event insurance starts as low as $45. Exact pricing depends on event type, guest count, location, and selected coverage. Want me to get you an instant quote? Just tap "Get a quote".' },
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
]

const SUGGESTIONS = ['What events do you cover?', 'When do I get my certificate?', 'What does coverage include?']

// ── Special quick-reply actions ────────────────────────────────────────────────
const START_QUOTE = '__start_quote__'
const GOTO_QUOTE  = '__goto_quote__'
const RESTART     = '__restart__'

const INITIAL_REPLIES: QuickReply[] = [
  { label: '💬 Get a quote', value: START_QUOTE },
  ...SUGGESTIONS.map(s => ({ label: s, value: s })),
]

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
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [adminQa, setAdminQa] = useState<QaItem[]>([])
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', text: "Hi! I'm the One Day Event assistant. Ask me about events, pricing, certificates, or coverage — or tap \"Get a quote\" for an instant estimate." },
  ])
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(INITIAL_REPLIES)
  const [quote, setQuote] = useState<QuoteState>({ stage: null })
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

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, quickReplies])

  function addBot(text: string) {
    setMessages(cur => [...cur, { id: nextId.current++, role: 'bot', text }])
  }
  function addUser(text: string) {
    setMessages(cur => [...cur, { id: nextId.current++, role: 'user', text }])
  }

  // ── Quote flow ───────────────────────────────────────────────────────────────

  function startQuote() {
    setQuote({ stage: 'event_type' })
    addBot("Sure! Let's get you a quick estimate. First — what type of event are you insuring?")
    setOpen(true)

    if (eventTypes.length === 0) {
      api.get<EventTypeOpt[]>('/event-types')
        .then(res => {
          setEventTypes(res.data)
          setQuickReplies(res.data.slice(0, 8).map(e => ({ label: e.event_type, value: String(e.id) })))
        })
        .catch(() => setQuickReplies([]))
    } else {
      setQuickReplies(eventTypes.slice(0, 8).map(e => ({ label: e.event_type, value: String(e.id) })))
    }
    if (states.length === 0) {
      api.get<StateOpt[]>('/us-states').then(res => setStates(res.data)).catch(() => {})
    }
  }

  function matchState(value: string): StateOpt | undefined {
    const v = value.trim().toLowerCase()
    return states.find(s => s.abbreviation.toLowerCase() === v)
      ?? states.find(s => s.name.toLowerCase() === v)
      ?? (v.length >= 3 ? states.find(s => s.name.toLowerCase().includes(v)) : undefined)
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

      if (list.length === 0) {
        addBot("I couldn't find coverage for those exact details — our full quote tool can help you explore options.")
        setQuickReplies([{ label: 'Open quote tool →', value: GOTO_QUOTE }, { label: 'Start over', value: RESTART }])
      } else {
        const min = Math.min(...list.map(p => p.total))
        const rec = list.find(p => p.recommended) ?? list[0]
        addBot(
          `Here's your estimate for ${q.eventTypeLabel}:\n` +
          `• Plans start at $${money(min)}\n` +
          `• Recommended: $${money(rec.total)} for $${rec.min_limit}M / $${rec.max_limit}M coverage\n\n` +
          'Ready to lock it in and get your Certificate of Insurance?'
        )
        setQuickReplies([{ label: 'Continue & buy →', value: GOTO_QUOTE }, { label: 'Start over', value: RESTART }])
      }
    } catch {
      addBot('Sorry, something went wrong calculating your quote. Please try our full quote tool.')
      setQuickReplies([{ label: 'Open quote tool →', value: GOTO_QUOTE }, { label: 'Start over', value: RESTART }])
    }
    setQuote(q2 => ({ ...q2, stage: 'done' }))
  }

  function handleQuoteAnswer(value: string) {
    switch (quote.stage) {
      case 'event_type': {
        let et: EventTypeOpt | undefined
        const asId = Number(value)
        if (!Number.isNaN(asId)) et = eventTypes.find(e => e.id === asId)
        if (!et) {
          const v = value.toLowerCase()
          et = eventTypes.find(e => v.includes(e.event_type.toLowerCase()) || e.event_type.toLowerCase().includes(v))
        }
        if (!et) { addBot('Please pick an event type from the options above, or type its name.'); return }
        setQuote(q => ({ ...q, eventType: et!.id, eventTypeLabel: et!.event_type, stage: 'state' }))
        setQuickReplies([])
        addBot(`Great — ${et.event_type}. Which US state is the event in? (e.g. CA or California)`)
        break
      }
      case 'state': {
        const raw = value.trim()
        const st = matchState(raw)
        let stateVal: string | null = null
        let display = raw
        if (st) {
          stateVal = st.abbreviation; display = st.name
        } else if (/^[a-zA-Z]{2}$/.test(raw)) {
          stateVal = raw.toUpperCase(); display = raw.toUpperCase()  // 2-letter code (API accepts it)
        } else if (states.length === 0 && raw.length >= 4) {
          stateVal = raw  // states list unavailable — trust a full name
        }
        if (!stateVal) { addBot("I couldn't find that state. Try the 2-letter code (e.g. CA) or the full name."); return }
        setQuote(q => ({ ...q, eventState: stateVal!, stage: 'guests' }))
        addBot(`${display} ✓. How many guests are you expecting?`)
        break
      }
      case 'guests': {
        const n = parseInt(value.replace(/[^0-9]/g, ''), 10)
        if (!n || n < 1) { addBot('Please enter a valid guest count, e.g. 100.'); return }
        setQuote(q => ({ ...q, persons: n, stage: 'date' }))
        addBot("What's the event date? (MM/DD/YYYY)")
        break
      }
      case 'date': {
        const d = normalizeDate(value)
        if (!d) { addBot('Please enter the date as MM/DD/YYYY, e.g. 09/15/2026.'); return }
        setQuote(q => ({ ...q, eventDates: d, stage: 'venue' }))
        setQuickReplies([
          { label: 'Private residence', value: 'private' },
          { label: 'Commercial venue', value: 'venue' },
        ])
        addBot('Where is the event being held?')
        break
      }
      case 'venue': {
        const v = value.toLowerCase()
        const isPrivate = v.includes('priv') || v.includes('home') || v.includes('house') || v.includes('backyard')
        setQuote(q => ({ ...q, privateResidence: isPrivate, isVenue: !isPrivate, stage: 'alcohol' }))
        setQuickReplies([{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }])
        addBot(`${isPrivate ? 'Private residence' : 'Commercial venue'} ✓. Will alcohol be served at the event?`)
        break
      }
      case 'alcohol': {
        const yes = /^y/i.test(value.trim()) || value.toLowerCase().includes('yes')
        if (!yes) {
          setQuote(q => ({ ...q, liquor: false, hostLiquor: false, stage: 'insured' }))
          setQuickReplies([{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }])
          addBot('Got it — no alcohol. Last question: how many additional insureds do you need (e.g. your venue)? Enter a number, or 0.')
        } else {
          setQuote(q => ({ ...q, stage: 'alcohol_type' }))
          setQuickReplies([{ label: 'Sold to guests', value: 'sold' }, { label: 'Free / hosted', value: 'free' }])
          addBot('Will the alcohol be sold to guests, or provided free of charge?')
        }
        break
      }
      case 'alcohol_type': {
        const sold = value.toLowerCase().includes('sold') || value.toLowerCase().includes('sell')
        setQuote(q => ({ ...q, liquor: sold, hostLiquor: !sold, stage: 'insured' }))
        setQuickReplies([{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }])
        addBot('Last question: how many additional insureds do you need (e.g. your venue)? Enter a number, or 0.')
        break
      }
      case 'insured': {
        const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
        const count = Number.isNaN(parsed) ? 0 : Math.min(parsed, 99)
        setQuickReplies([])
        setQuote(q => ({ ...q, additionalInsureds: count, stage: 'loading' }))
        addBot('Perfect — calculating your quote… ⏳')
        void fetchQuote({ ...quote, additionalInsureds: count })
        break
      }
      default:
        break
    }
  }

  // ── Routing ────────────────────────────────────────────────────────────────────

  function routeInput(value: string) {
    if (quote.stage && quote.stage !== 'done' && quote.stage !== 'loading') {
      handleQuoteAnswer(value)
    } else if (isQuoteTrigger(value)) {
      startQuote()
    } else {
      addBot(findAnswer(value, qaItems))
    }
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
    if (qr.value === START_QUOTE) { addUser(qr.label); startQuote(); return }
    if (qr.value === GOTO_QUOTE) { navigate('/onedayevent'); setOpen(false); return }
    if (qr.value === RESTART) { addUser('Start over'); startQuote(); return }
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
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>One Day Event Chat</h2>
              <p style={styles.subtitle}>Instant answers &amp; quotes.</p>
            </div>
            <button type="button" aria-label="Close chat" style={styles.close} onClick={() => setOpen(false)}>x</button>
          </div>

          <div style={styles.messages}>
            {messages.map(message => (
              <div key={message.id} style={message.role === 'bot' ? styles.botMessage : styles.userMessage}>
                {message.text}
              </div>
            ))}

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
