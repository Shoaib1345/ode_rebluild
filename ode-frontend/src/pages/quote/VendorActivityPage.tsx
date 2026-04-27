import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import type { EventType } from '../../types'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

// ─── Vendor activity list ─────────────────────────────────────────────────────

const VENDOR_ACTIVITIES = [
  'Antique Collectibles Vendors',
  'Apparel Accessories',
  'Arts Crafts Vendors',
  'Celebrity, Mascot, or Character Appearances/Photo Booths',
  'Cookware',
  'Disc-Jockey (for private events with less than 200 attendees)',
  'DJ at event',
  'Face Painting',
  'Food & Drink(non-alcoholic)',
  'Game Trailers or Booths (inflatables excluded)',
  'Gift Wrap Booths',
  'Micro-Reality Race Tracks',
  'Photo Booth',
  'Photographer/Photography',
  'Photographer/Videographer',
  'Produce Floral Vendors',
  'Product Demos - Static',
  'Product or Service Display Exhibits',
  'Retail Carts',
  'Souvenir Sales',
  'Sports Camping Equipment',
  'Vehicles, Equipment, or Hardware Sales on Display - Static',
  'Videographer',
  'Other Vendor Type...',
]

// Special picks that switch to a different event type and enter standard flow
const SPECIAL_PICKS = [
  { label: 'Bartender at Event', eventTypeName: 'Bartender at the Event' },
  { label: 'Band at Event',      eventTypeName: 'Band at the Event'      },
]

// ─── Fetch event types (to resolve ID for Bartender / Band) ──────────────────

async function fetchEventTypes(): Promise<EventType[]> {
  const res = await api.get<EventType[]>('/event-types')
  return res.data
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorActivityPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  // Guard
  useEffect(() => {
    if (!params.eventDates) navigate('/quote/dates', { replace: true })
  }, [params.eventDates, navigate])

  const [query,    setQuery]    = useState(params.vendorActivity ?? '')
  const [selected, setSelected] = useState<string>(params.vendorActivity ?? '')
  const [open,     setOpen]     = useState(false)

  // For food & drink follow-up
  const [alcoholicDrinks, setAlcoholicDrinks] = useState<'Yes' | 'No' | ''>('')

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLUListElement>(null)

  const { data: eventTypes = [] } = useQuery({
    queryKey:  ['event-types'],
    queryFn:   fetchEventTypes,
    staleTime: 5 * 60 * 1000,
  })

  // Filtered dropdown
  const filtered = VENDOR_ACTIVITIES.filter((a) =>
    query.trim().length === 0
      ? true
      : a.toLowerCase().includes(query.toLowerCase())
  )

  // Close on outside click
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

  const isFoodDrink = selected === 'Food & Drink(non-alcoholic)'

  const isValid =
    selected !== '' &&
    (!isFoodDrink || alcoholicDrinks !== '')

  // Handle special picks (Bartender / Band) — switch event type, enter standard flow
  function handleSpecialPick(eventTypeName: string) {
    const et = eventTypes.find((e) => e.event_type === eventTypeName)
    if (!et) return
    setParams({
      eventType:     et.id,
      eventTypeName: et.event_type,
      isVendor:      false, // now treated as regular event
      vendorActivity: eventTypeName,
    })
    navigate('/quote/location')
  }

  function handleSelectActivity(activity: string) {
    setSelected(activity)
    setQuery(activity)
    setOpen(false)
    inputRef.current?.blur()
    setAlcoholicDrinks('')
  }

  function handleNext() {
    if (!isValid) return
    setParams({
      vendorActivity: selected,
      // If Food & Drink with alcoholic, set host_liquor
      ...(isFoodDrink && alcoholicDrinks === 'Yes' ? { host_liquor: 1 } : {}),
    })
    navigate('/quote/location')
  }

  if (!params.eventDates) return null

  return (
    <QuoteStepLayout
      step={3}
      title="What kind of vendor are you?"
      image="/assets/images/quote-type.png"
      backTo="/quote/dates"
    >

      {/* ── Special picks: Bartender / Band ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {SPECIAL_PICKS.map(({ label, eventTypeName }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleSpecialPick(eventTypeName)}
            style={{
              flex: 1,
              lineHeight: '54px',
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
              borderRadius: 10,
              border: '1px solid #105778',
              backgroundColor: '#fff',
              color: '#262D45',
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
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
          placeholder="Type your vendor type here"
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected('')
            setAlcoholicDrinks('')
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

        {/* Dropdown */}
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
            {filtered.map((activity) => (
              <li
                key={activity}
                onMouseDown={() => handleSelectActivity(activity)}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  color: '#505458',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  backgroundColor: selected === activity ? '#EDF5FF' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#EDF5FF'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    selected === activity ? '#EDF5FF' : 'transparent'
                }}
              >
                {activity}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Helper text ──────────────────────────────────────────────────── */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#1CA0DF', marginBottom: 16 }}>
        Please type in your vendor type if you do not see it in the list
      </p>

      {/* ── Food & Drink follow-up: alcoholic drinks? ────────────────────── */}
      {isFoodDrink && (
        <div
          style={{
            borderRadius: 10,
            border: '1px solid #E3E3E3',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: '#262D45', marginBottom: 12, textAlign: 'center' }}>
            Will there be any alcoholic drinks?
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['Yes', 'No'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAlcoholicDrinks(opt)}
                style={{
                  flex: 1,
                  lineHeight: '54px',
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: alcoholicDrinks === opt ? '1px solid #E0232C' : '1px solid #105778',
                  backgroundColor: alcoholicDrinks === opt ? '#E0232C' : '#fff',
                  color: alcoholicDrinks === opt ? '#fff' : '#262D45',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Next ─────────────────────────────────────────────────────────── */}
      <QuoteNextBtn onClick={handleNext} disabled={!isValid} />

    </QuoteStepLayout>
  )
}
