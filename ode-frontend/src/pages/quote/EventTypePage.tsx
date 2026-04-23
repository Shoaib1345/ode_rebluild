import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import type { EventType } from '../../types'
import QuoteLayout from './QuoteLayout'

// Quick-pick event names that get their own prominent buttons
const QUICK_PICKS = ['Wedding Reception', 'Birthday Party', 'Vendor at Event']

async function fetchEventTypes(): Promise<EventType[]> {
  const res = await api.get<EventType[]>('/event-types')
  return res.data
}

export default function EventTypePage() {
  const navigate   = useNavigate()
  const setParams  = useQuoteStore((s) => s.setParams)
  const reset      = useQuoteStore((s) => s.reset)

  // Search/autocomplete state
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [selected, setSelected] = useState<EventType | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const listRef   = useRef<HTMLUListElement>(null)

  // Clear any previous quote on mount
  useEffect(() => { reset() }, [reset])

  const { data: eventTypes = [], isLoading, isError } = useQuery({
    queryKey: ['event-types'],
    queryFn:  fetchEventTypes,
    staleTime: 5 * 60 * 1000,
  })

  // Filter list by search query (exclude quick-picks so they don't duplicate)
  const filtered = query.trim().length === 0
    ? eventTypes.filter((et) => !QUICK_PICKS.includes(et.event_type))
    : eventTypes.filter((et) =>
        et.event_type.toLowerCase().includes(query.toLowerCase())
      )

  function pickType(et: EventType) {
    setParams({ eventType: et.id, eventTypeName: et.event_type })
    navigate('/quote/details')
  }

  function handleQuickPick(name: string) {
    const et = eventTypes.find((e) => e.event_type === name)
    if (et) pickType(et)
  }

  function handleSelectFromList(et: EventType) {
    setSelected(et)
    setQuery(et.event_type)
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleNext() {
    if (selected) pickType(selected)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        listRef.current  && !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <QuoteLayout step={1}>
      <div className="bg-white rounded-2xl shadow-md px-8 py-10">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Hi, let's get your quote!
        </h1>
        <p className="text-gray-500 mb-8">
          What type of event do you need covered?
        </p>

        {/* ── Quick-pick buttons ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {QUICK_PICKS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleQuickPick(name)}
              disabled={isLoading}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-[#1CA0DF]/30 bg-[#EDF0FA] hover:bg-[#EDF0FA] hover:border-[#1CA0DF] text-[#105778] font-medium text-sm py-4 px-2 transition-colors disabled:opacity-40"
            >
              <span className="text-2xl">{QUICK_PICK_ICONS[name]}</span>
              <span className="text-center leading-tight">{name}</span>
            </button>
          ))}
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-3 text-sm text-gray-400">or search all events</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        {/* ── Autocomplete search ─────────────────────────────────────── */}
        <div className="relative mb-8">
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Type your event here…"
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] focus:border-transparent"
          />

          {open && filtered.length > 0 && (
            <ul
              ref={listRef}
              className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filtered.map((et) => (
                <li
                  key={et.id}
                  onMouseDown={() => handleSelectFromList(et)}
                  className="px-4 py-2.5 text-sm text-gray-700 hover:bg-[#EDF0FA] hover:text-[#105778] cursor-pointer"
                >
                  {et.event_type}
                </li>
              ))}
            </ul>
          )}

          {open && query.trim().length > 0 && filtered.length === 0 && !isLoading && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow p-3 text-sm text-gray-500">
              No matching event type found.
            </div>
          )}
        </div>

        {/* ── Error state ─────────────────────────────────────────────── */}
        {isError && (
          <p className="text-red-500 text-sm mb-4">
            Could not load event types. Please refresh and try again.
          </p>
        )}

        {/* ── Next button ─────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected}
          className="w-full py-3 rounded-lg bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>

      </div>
    </QuoteLayout>
  )
}

const QUICK_PICK_ICONS: Record<string, string> = {
  'Wedding Reception': '💍',
  'Birthday Party':    '🎂',
  'Vendor at Event':   '🏪',
}
