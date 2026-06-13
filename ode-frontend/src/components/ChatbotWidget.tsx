import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, KeyboardEvent } from 'react'

interface QaItem {
  keywords: string[]
  answer: string
}

interface Message {
  id: number
  role: 'bot' | 'user'
  text: string
}

const DEFAULT_QA: QaItem[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    answer: "Hi! Welcome to One Day Event Insurance. I'm here to help with event insurance questions. How can I assist you today?",
  },
  {
    keywords: ['what events', 'events cover', 'type of event', 'which event', 'all events'],
    answer: 'We cover weddings, birthday parties, concerts, festivals, Bar and Bat Mitzvahs, vendor events, corporate events, and many special one-day occasions.',
  },
  {
    keywords: ['wedding', 'wedding insurance', 'wedding cover', 'wedding party'],
    answer: 'Yes. We offer wedding event insurance that helps protect you if a guest gets injured or venue property is damaged.',
  },
  {
    keywords: ['birthday', 'birthday party', 'party insurance', 'birthday event'],
    answer: 'Birthday party insurance starts from $45. It can help satisfy venue requirements and protect against accidents during your party.',
  },
  {
    keywords: ['concert', 'music event', 'music show', 'live show'],
    answer: 'Concert and music event insurance is available. Coverage can include general liability for attendees, performers, and venue requirements.',
  },
  {
    keywords: ['festival', 'outdoor event', 'fair', 'outdoor festival'],
    answer: 'Festival insurance is available for indoor and outdoor festivals of many sizes. Your quote depends on event details and coverage needs.',
  },
  {
    keywords: ['bar mitzvah', 'bat mitzvah', 'mitzvah', 'jewish event'],
    answer: 'Yes. We offer insurance for Bar and Bat Mitzvah celebrations, including liability coverage for venue requirements.',
  },
  {
    keywords: ['vendor', 'vendor event', 'market', 'craft fair', 'trade show'],
    answer: 'Yes, vendor events like craft fairs, markets, and trade shows can be covered, especially when organizers require proof of insurance.',
  },
  {
    keywords: ['corporate', 'corporate event', 'company event', 'office party'],
    answer: 'Corporate events and office parties can be covered with liability protection for accidents during the event.',
  },
  {
    keywords: ['quote', 'get quote', 'free quote', 'instant quote', 'how to get'],
    answer: 'Getting a quote is free. Visit onedayevent.com, enter your event details, and review your instant price with no obligation.',
  },
  {
    keywords: ['price', 'cost', 'how much', 'pricing', 'rates', 'affordable', 'cheap'],
    answer: 'Event insurance starts as low as $45. Exact pricing depends on event type, guest count, location, and selected coverage.',
  },
  {
    keywords: ['certificate', 'coi', 'proof of insurance', 'certificate of insurance', 'document'],
    answer: 'Your Certificate of Insurance is provided immediately after purchase, so you can download it and share it with your venue.',
  },
  {
    keywords: ['how long', 'same day', 'fast', 'quick', 'instant', 'how fast'],
    answer: 'The process is fast. You can get a quote, purchase a policy, and receive your Certificate of Insurance the same day.',
  },
  {
    keywords: ['liability', 'what is covered', 'coverage', 'what does it cover', 'protection'],
    answer: 'Event liability insurance can cover bodily injury, property damage, and legal fees if you are sued. Coverage limits may vary by plan.',
  },
  {
    keywords: ['coverage limit', 'how much coverage', 'maximum coverage', '1 million'],
    answer: 'Coverage limits can range from $500,000 up to $2,000,000 depending on the plan you choose.',
  },
  {
    keywords: ['location', 'where', 'based', 'address', 'san jose', 'silicon valley', 'california'],
    answer: 'One Day Event Insurance is based in San Jose, California and serves customers across the United States. The company has been helping customers since 1990.',
  },
  {
    keywords: ['since', 'how long in business', 'experience', 'founded', 'history', '1990', 'years'],
    answer: 'One Day Event Insurance has been in business since 1990, with decades of experience helping people protect special events.',
  },
  {
    keywords: ['contact', 'phone', 'email', 'reach', 'talk', 'speak', 'call', 'support'],
    answer: 'You can contact the One Day Event team through onedayevent.com.',
  },
  {
    keywords: ['website', 'online', 'onedayevent', 'site', 'web'],
    answer: 'Visit onedayevent.com for free quotes, policy purchases, and Certificate of Insurance access.',
  },
  {
    keywords: ['cancel', 'cancellation', 'refund', 'money back'],
    answer: 'For cancellation or refund questions, please contact the One Day Event team directly at onedayevent.com because policy terms may vary.',
  },
  {
    keywords: ['compare', 'best deal', 'best price', 'best carrier', 'top carrier'],
    answer: 'One Day Event compares multiple top-rated insurance carriers to help find strong pricing and coverage for your event.',
  },
  {
    keywords: ['guest', 'how many guests', 'attendees', 'number of people'],
    answer: 'Guest count can affect your premium. Coverage options are available for small gatherings and larger events.',
  },
  {
    keywords: ['venue', 'venue require', 'venue insurance', 'venue asked'],
    answer: 'Many venues require event liability insurance. One Day Event can provide proof of insurance after purchase.',
  },
  {
    keywords: ['alcohol', 'liquor', 'bar', 'drinks', 'drinking'],
    answer: 'Events with alcohol may need liquor liability coverage. Visit onedayevent.com to review the right coverage for your event.',
  },
  {
    keywords: ['outdoor', 'outside', 'open air', 'tent', 'garden'],
    answer: 'Outdoor events can be covered, including garden parties, tent weddings, and outdoor festivals.',
  },
  {
    keywords: ['damage', 'property damage', 'broken', 'destroyed'],
    answer: 'Property damage coverage is included in many event liability policies if venue property is damaged during your event.',
  },
  {
    keywords: ['injury', 'someone hurt', 'accident', 'guest hurt'],
    answer: 'If a guest is injured during your event, event liability insurance may cover medical costs and related legal fees.',
  },
  {
    keywords: ['thank', 'thanks', 'thank you', 'appreciate'],
    answer: "You're welcome. Feel free to ask more questions, or visit onedayevent.com for a free instant quote.",
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'later', 'take care'],
    answer: 'Goodbye. Have a wonderful event, and remember you can get a free quote at onedayevent.com.',
  },
  {
    keywords: ['help', 'need help', 'assist', 'support'],
    answer: 'I can help with event types, pricing, quotes, coverage, certificates, venues, alcohol coverage, and contact details.',
  },
]

const SUGGESTIONS = ['What events do you cover?', 'How much does it cost?', 'When do I get my certificate?', 'What does coverage include?']

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && next === '"') {
      value += '"'
      i += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      cells.push(value.trim())
      value = ''
    } else {
      value += char
    }
  }

  cells.push(value.trim())
  return cells
}

function parseQaCsv(csv: string): QaItem[] {
  return csv
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(1)
    .map(parseCsvLine)
    .filter(cells => cells.length >= 2 && cells[0] && cells[1])
    .map(([keywords, answer]) => ({
      keywords: keywords.split('|').map(keyword => keyword.trim().toLowerCase()).filter(Boolean),
      answer,
    }))
}

function findAnswer(input: string, qaItems: QaItem[]): string {
  const normalized = input.toLowerCase()
  const match = qaItems.find(item => item.keywords.some(keyword => normalized.includes(keyword)))

  return match?.answer ?? "I don't have that answer yet. Try asking about events, pricing, certificates, coverage, location, or contact details."
}

const styles: Record<string, CSSProperties> = {
  bubble: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    width: 62,
    height: 62,
    borderRadius: '50%',
    border: 'none',
    background: '#E0232C',
    color: '#fff',
    fontSize: 28,
    boxShadow: '0 14px 34px rgba(224, 35, 44, 0.32)',
    cursor: 'pointer',
    zIndex: 1000,
  },
  panel: {
    position: 'fixed',
    right: 24,
    bottom: 98,
    width: 'min(380px, calc(100vw - 32px))',
    height: 'min(620px, calc(100vh - 128px))',
    background: '#fff',
    border: '1px solid #E3E3E3',
    borderRadius: 18,
    boxShadow: '0 24px 70px rgba(38, 45, 69, 0.24)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: 'bottom right',
    transition: 'transform 180ms ease, opacity 180ms ease',
    zIndex: 1000,
  },
  header: {
    background: '#262D45',
    color: '#fff',
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    lineHeight: '22px',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: 12,
    opacity: 0.78,
    lineHeight: '16px',
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 18,
  },
  messages: {
    flex: 1,
    padding: 16,
    overflowY: 'auto',
    background: '#F8FCFF',
  },
  botMessage: {
    maxWidth: '86%',
    marginBottom: 10,
    padding: '10px 12px',
    borderRadius: '14px 14px 14px 4px',
    background: '#fff',
    color: '#262D45',
    fontSize: 14,
    lineHeight: '20px',
    boxShadow: '0 3px 10px rgba(55, 106, 136, 0.08)',
  },
  userMessage: {
    maxWidth: '86%',
    margin: '0 0 10px auto',
    padding: '10px 12px',
    borderRadius: '14px 14px 4px 14px',
    background: '#1CA0DF',
    color: '#fff',
    fontSize: 14,
    lineHeight: '20px',
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  suggestionButton: {
    border: '1px solid #BFE7FA',
    background: '#fff',
    color: '#105778',
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  uploadRow: {
    padding: '10px 14px',
    borderTop: '1px solid #E3E3E3',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  uploadLabel: {
    color: '#105778',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  count: {
    color: '#797979',
    fontSize: 12,
    fontWeight: 700,
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: 14,
    borderTop: '1px solid #E3E3E3',
    background: '#fff',
  },
  input: {
    flex: 1,
    minWidth: 0,
    border: '1px solid #D8DEE8',
    borderRadius: 999,
    padding: '11px 14px',
    fontSize: 14,
    outline: 'none',
  },
  send: {
    border: 'none',
    borderRadius: 999,
    background: '#E0232C',
    color: '#fff',
    padding: '0 16px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [customQa, setCustomQa] = useState<QaItem[]>([])
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: "Hi! I'm the One Day Event assistant. Ask me about events, pricing, certificates, coverage, or contact details.",
    },
  ])
  const nextId = useRef(2)

  const qaItems = useMemo(() => [...customQa, ...DEFAULT_QA], [customQa])

  function addMessage(role: Message['role'], text: string) {
    setMessages(current => [...current, { id: nextId.current, role, text }])
    nextId.current += 1
  }

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    addMessage('user', trimmed)
    addMessage('bot', findAnswer(trimmed, qaItems))
    setInput('')
    setOpen(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      sendMessage(input)
    }
  }

  function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseQaCsv(String(reader.result ?? ''))
      setCustomQa(current => [...parsed, ...current])
      addMessage('bot', `Imported ${parsed.length} Q&A rows from ${file.name}.`)
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <>
      {open && (
        <section
          aria-label="One Day Event chatbot"
          style={{
            ...styles.panel,
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.98)',
          }}
        >
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>One Day Event Chat</h2>
              <p style={styles.subtitle}>Instant answers. No external API.</p>
            </div>
            <button type="button" aria-label="Close chat" style={styles.close} onClick={() => setOpen(false)}>
              x
            </button>
          </div>

          <div style={styles.messages}>
            {messages.map(message => (
              <div key={message.id} style={message.role === 'bot' ? styles.botMessage : styles.userMessage}>
                {message.text}
              </div>
            ))}

            {messages.length === 1 && (
              <div style={styles.suggestions}>
                {SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    style={styles.suggestionButton}
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.uploadRow}>
            <label style={styles.uploadLabel}>
              Upload Q&A CSV
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
            </label>
            <span style={styles.count}>{customQa.length} custom rows</span>
          </div>

          <div style={styles.inputRow}>
            <input
              type="text"
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about pricing, coverage, certificates..."
              style={styles.input}
              aria-label="Chat message"
            />
            <button type="button" style={styles.send} onClick={() => sendMessage(input)}>
              Send
            </button>
          </div>
        </section>
      )}

      <button type="button" aria-label="Open chat" style={styles.bubble} onClick={() => setOpen(current => !current)}>
        💬
      </button>
    </>
  )
}
