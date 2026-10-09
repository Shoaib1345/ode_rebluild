import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import type { EventType } from '../../types'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

// ─── Quick picks (exact event_type names from DB) ─────────────────────────────

const QUICK_PICKS: { db: string; label: string }[] = [
  { db: 'Wedding Reception', label: 'Wedding'         },
  { db: 'Birthday Party',    label: 'Birthday'        },
  { db: 'Vendor at Event',   label: 'Vendor at Event' },
]

async function fetchEventTypes(): Promise<EventType[]> {
  const res = await api.get<EventType[]>('/event-types')
  return res.data
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventTypePage() {
  const navigate  = useNavigate()
  const setParams = useQuoteStore((s) => s.setParams)
  const reset     = useQuoteStore((s) => s.reset)

  const [query,    setQuery]    = useState('')
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState<EventType | null>(null)
  const [activeDb, setActiveDb] = useState<string>('')   // quick-pick active DB name

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLUListElement>(null)

  // Reset wizard state when landing on step 1
  useEffect(() => { reset() }, [reset])

  const { data: eventTypes = [], isLoading, isError } = useQuery({
    queryKey:  ['event-types'],
    queryFn:   fetchEventTypes,
    staleTime: 5 * 60 * 1000,
  })

  // ── Filtered dropdown list (quick-picks excluded when not searching) ───────

  const dbQuickPickNames = QUICK_PICKS.map((q) => q.db)

  const filtered = query.trim().length === 0
    ? eventTypes.filter((et) => !dbQuickPickNames.includes(et.event_type))
    : eventTypes.filter((et) =>
        et.event_type.toLowerCase().includes(query.toLowerCase())
      )

  // ── Navigation helpers ────────────────────────────────────────────────────

  function pickType(et: EventType) {
    setParams({ eventType: et.id, eventTypeName: et.event_type })
    // Vendor at Event uses a different flow — ask Host vs Vendor first
    if (et.event_type === 'Vendor at Event') {
      navigate('/quote/vendor-or-host')
    } else {
      navigate('/quote/dates')
    }
  }

  function handleQuickPick(dbName: string) {
    const et = eventTypes.find((e) => e.event_type === dbName)
    if (!et) return
    setActiveDb(dbName)
    setSelected(et)
    setQuery('')   // clear search so dropdown closes
    setOpen(false)
  }

  function handleSelectFromList(et: EventType) {
    setSelected(et)
    setActiveDb('')
    setQuery(et.event_type)
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleNext() {
    if (selected) pickType(selected)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        listRef.current  && !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <QuoteStepLayout
      step={1}
      title="Hi, let's get your quote! What type of event do you need covered?"
      image="/assets/images/quote-type.png"
      innerNarrow
    >
      {/* ── Quick-pick row: Wedding | Birthday | Vendor at Event ─────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 35,
        }}
      >
        {QUICK_PICKS.map(({ db, label }) => (
          <button
            key={db}
            type="button"
            onClick={() => handleQuickPick(db)}
            disabled={isLoading}
            style={{
              flex: 1,
              minWidth: 0,
              height: 54,
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'center',
              borderRadius: 10,
              whiteSpace: 'nowrap',
              border: activeDb === db
                ? '1px solid #E0232C'
                : '1px solid #105778',
              backgroundColor: activeDb === db ? '#E0232C' : '#fff',
              color: activeDb === db ? '#fff' : '#262D45',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
              padding: '0 12px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Autocomplete search ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Type your event in here"
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
            setActiveDb('')
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 10,
            border: '1px solid #DFDFDF',
            padding: '0 16px',
            fontSize: 15,
            color: '#262D45',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fff',
          }}
        />

        {/* Dropdown results */}
        {open && filtered.length > 0 && (
          <ul
            ref={listRef}
            style={{
              position: 'absolute',
              zIndex: 20,
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              backgroundColor: '#fff',
              border: '1px solid #E3E3E3',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
              maxHeight: 240,
              overflowY: 'auto',
              listStyle: 'none',
              margin: '4px 0 0 0',
              padding: 0,
            }}
          >
            {filtered.map((et) => (
              <li
                key={et.id}
                onMouseDown={() => handleSelectFromList(et)}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  color: '#505458',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#EDF5FF'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                {et.event_type}
              </li>
            ))}
          </ul>
        )}

        {/* No results */}
        {open && query.trim().length > 0 && filtered.length === 0 && !isLoading && (
          <div
            style={{
              position: 'absolute',
              zIndex: 20,
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              backgroundColor: '#fff',
              border: '1px solid #E3E3E3',
              borderRadius: 8,
              padding: 16,
              fontSize: 14,
              color: '#797979',
              boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            }}
          >
            No matching event type.{' '}
            <a href="mailto:support@onedayevent.com" style={{ color: '#1CA0DF', fontWeight: 600 }}>
              Contact us
            </a>{' '}
            and we'll help.
          </div>
        )}
      </div>

      {/* ── Helper text ──────────────────────────────────────────────────── */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#262D45', marginTop: 10, marginBottom: 4 }}>
        Please type in your event if you do not see it in the dropdown
      </p>

      {isError && (
        <p style={{ textAlign: 'center', color: '#E0232C', fontSize: 13, marginTop: 8 }}>
          Could not load event types. Please refresh and try again.
        </p>
      )}

      {/* ── Next ─────────────────────────────────────────────────────────── */}
      <QuoteNextBtn onClick={handleNext} disabled={!selected}>
        Next
      </QuoteNextBtn>
    </QuoteStepLayout>
  )
}
