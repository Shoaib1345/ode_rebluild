import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import type { UsState } from '../../types'
import QuoteLayout from './QuoteLayout'

// ─── Types ───────────────────────────────────────────────────────────────────

type AlcoholType = 'none' | 'hosted' | 'byob' | 'sold'

const schema = z.object({
  primaryDate:         z.date({ error: 'Select your event date' }),
  additionalDates:     z.array(z.date()),
  eventState:          z.string().min(1, 'Select a state'),
  privateResidence:    z.boolean(),
  isVenue:             z.boolean(),
  persons:             z.number({ error: 'Enter number of guests' })
                        .int()
                        .min(1, 'Must be at least 1'),
  alcohol:             z.enum(['none', 'hosted', 'byob', 'sold']),
  soldProfit:          z.boolean().nullable(),
  ticketCharge:        z.boolean().nullable(),
  noha:                z.boolean(),
  wos:                 z.boolean(),
  pancb:               z.boolean(),
  additionalInsureds:  z.number().int().min(0),
})

type FormData = z.infer<typeof schema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  const y = d.getFullYear()
  return `${m}/${day}/${y}`
}

function areDatesConsecutive(dates: Date[]): boolean {
  if (dates.length <= 1) return true
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].getTime() - sorted[i - 1].getTime()
    if (diff !== 86_400_000) return false
  }
  return true
}

function isManualQuoteRequired(data: FormData): string | null {
  if (data.alcohol === 'sold' && data.soldProfit === true) {
    return 'Alcohol sold for profit requires a manual review.'
  }
  if (data.ticketCharge === true) {
    return 'Ticket/admission charges require a manual review.'
  }
  const allDates = [data.primaryDate, ...data.additionalDates]
  if (allDates.length > 3) {
    return 'Events spanning more than 3 dates require a manual review.'
  }
  if (allDates.length > 1 && !areDatesConsecutive(allDates)) {
    return 'Non-consecutive event dates require a manual review.'
  }
  return null
}

async function fetchStates(): Promise<UsState[]> {
  const res = await api.get<UsState[]>('/us-states')
  return res.data
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
      {children}
    </h2>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? 'bg-[#1CA0DF] border-[#1CA0DF] text-white'
          : 'bg-white border-gray-300 text-gray-700 hover:border-[#1CA0DF] hover:text-[#105778]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuoteDetailsPage() {
  const navigate   = useNavigate()
  const setParams  = useQuoteStore((s) => s.setParams)
  const stored     = useQuoteStore((s) => s.params)
  const [manualMsg, setManualMsg] = useState<string | null>(null)
  const [showExtra, setShowExtra] = useState(false)

  const isVendor = stored.eventTypeName?.toLowerCase().includes('vendor')

  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['us-states'],
    queryFn: fetchStates,
    staleTime: 10 * 60 * 1000,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryDate:        undefined,
      additionalDates:    [],
      eventState:         '',
      privateResidence:   false,
      isVenue:            false,
      persons:            undefined,
      alcohol:            'none',
      soldProfit:         null,
      ticketCharge:       null,
      noha:               false,
      wos:                false,
      pancb:              false,
      additionalInsureds: 0,
    },
  })

  // Redirect back if no event type selected
  useEffect(() => {
    if (!stored.eventType) navigate('/onedayevent', { replace: true })
  }, [stored.eventType, navigate])

  const alcohol       = watch('alcohol')
  const soldProfit    = watch('soldProfit')
  const eventState    = watch('eventState')
  const primaryDate   = watch('primaryDate')
  const additionalDates = watch('additionalDates')

  // Clear follow-up when alcohol type changes
  const handleAlcohol = (val: AlcoholType) => {
    setValue('alcohol', val, { shouldValidate: true })
    setValue('soldProfit', null)
    setValue('ticketCharge', null)
    setManualMsg(null)
  }

  const showTicketQuestion =
    alcohol === 'hosted' ||
    (alcohol === 'sold' && soldProfit === false)

  const onSubmit = (data: FormData) => {
    const reason = isManualQuoteRequired(data)
    if (reason) {
      setManualMsg(reason)
      return
    }
    setManualMsg(null)

    const allDates   = [data.primaryDate, ...data.additionalDates]
    const dateString = allDates.map(formatDate).join(',')
    const timezone   = Intl.DateTimeFormat().resolvedOptions().timeZone

    const hostLiquor = data.alcohol === 'hosted' || data.alcohol === 'byob'
      || (data.alcohol === 'sold' && data.soldProfit === false)
    const liquor     = data.alcohol === 'sold' && data.soldProfit === true

    setParams({
      eventDates:          dateString,
      event_state:         data.eventState,
      number_of_persons:   data.persons,
      noha:                data.noha               ? 1 : 0,
      w_o_s:               data.wos                ? 1 : 0,
      p_a_n_c_b:           data.pancb              ? 1 : 0,
      host_liquor:         hostLiquor              ? 1 : 0,
      liquor:              liquor                  ? 1 : 0,
      additional_insureds: data.additionalInsureds,
      privateResidence:    data.privateResidence   ? 1 : 0,
      isSetVenue:          data.isVenue            ? 1 : 0,
      timezone,
    })

    navigate('/quote/plans')
  }

  const today    = new Date()
  today.setHours(0, 0, 0, 0)

  const allSelectedDates = primaryDate
    ? [primaryDate, ...additionalDates]
    : []

  return (
    <QuoteLayout step={2}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Event type header ───────────────────────────────────────── */}
        <div className="mb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/onedayevent')}
            className="text-[#1CA0DF] hover:text-[#105778] text-sm font-medium"
          >
            ← Back
          </button>
          {stored.eventTypeName && (
            <span className="text-sm text-gray-500">
              Event: <span className="font-medium text-gray-700">{stored.eventTypeName}</span>
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md px-8 py-8 space-y-8">

          {/* ── 1. Event Dates ────────────────────────────────────────── */}
          <div>
            <SectionTitle>When is your event?</SectionTitle>

            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">
                Event date <span className="text-red-500">*</span>
              </label>
              <Controller
                name="primaryDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ?? null}
                    onChange={(d: Date | null) => {
                      field.onChange(d)
                      // Remove any additional dates before the new primary
                      setValue('additionalDates', [])
                      setManualMsg(null)
                    }}
                    minDate={today}
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Select date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
                    wrapperClassName="w-full"
                    autoComplete="off"
                  />
                )}
              />
              <FieldError msg={errors.primaryDate?.message} />
            </div>

            {primaryDate && (
              <>
                {!showExtra ? (
                  <button
                    type="button"
                    onClick={() => setShowExtra(true)}
                    className="text-sm text-[#1CA0DF] hover:underline"
                  >
                    + Add more dates (multi-day event)
                  </button>
                ) : (
                  <div className="space-y-2 mt-2">
                    <label className="block text-sm text-gray-600">
                      Additional dates
                    </label>
                    {[0, 1].map((i) => (
                      <Controller
                        key={i}
                        name={`additionalDates.${i}` as const}
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            selected={(field.value as Date | undefined) ?? null}
                            onChange={(d: Date | null) => {
                              field.onChange(d)
                              setManualMsg(null)
                            }}
                            minDate={today}
                            dateFormat="MM/dd/yyyy"
                            placeholderText={`Additional date ${i + 1} (optional)`}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
                            wrapperClassName="w-full"
                            autoComplete="off"
                            excludeDates={allSelectedDates.filter(
                              (_, idx) => idx !== i + 1
                            )}
                          />
                        )}
                      />
                    ))}
                    <p className="text-xs text-gray-400">
                      Multi-day events must be on consecutive days (max 3 dates).
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── 2. Location ───────────────────────────────────────────── */}
          <div>
            <SectionTitle>Where is the event?</SectionTitle>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                {...register('eventState')}
                disabled={statesLoading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
              >
                <option value="">Select state…</option>
                {states.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.eventState?.message} />
            </div>

            {eventState && !isVendor && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">
                  Is the event held at a private residence?
                </p>
                <div className="flex gap-3">
                  <Controller
                    name="privateResidence"
                    control={control}
                    render={({ field }) => (
                      <>
                        <ToggleButton
                          active={field.value === true}
                          onClick={() => field.onChange(true)}
                        >
                          Yes
                        </ToggleButton>
                        <ToggleButton
                          active={field.value === false}
                          onClick={() => field.onChange(false)}
                        >
                          No
                        </ToggleButton>
                      </>
                    )}
                  />
                </div>
              </div>
            )}

            {eventState && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">
                  Is this at a set venue (venue requires to be listed)?
                </p>
                <div className="flex gap-3">
                  <Controller
                    name="isVenue"
                    control={control}
                    render={({ field }) => (
                      <>
                        <ToggleButton
                          active={field.value === true}
                          onClick={() => field.onChange(true)}
                        >
                          Yes
                        </ToggleButton>
                        <ToggleButton
                          active={field.value === false}
                          onClick={() => field.onChange(false)}
                        >
                          No
                        </ToggleButton>
                      </>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── 3. Guests ─────────────────────────────────────────────── */}
          <div>
            <SectionTitle>How many guests will attend?</SectionTitle>
            <input
              type="number"
              min={1}
              placeholder="Number of guests"
              {...register('persons', { valueAsNumber: true })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
            <p className="mt-1 text-xs text-gray-400">
              Use the highest expected attendance to ensure full coverage.
            </p>
            <FieldError msg={errors.persons?.message} />
          </div>

          {/* ── 4. Alcohol ────────────────────────────────────────────── */}
          <div>
            <SectionTitle>Alcohol at the event</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {(
                [
                  { val: 'none',   label: 'No Alcohol' },
                  { val: 'hosted', label: 'Hosted Bar',  sub: 'served free' },
                  { val: 'byob',   label: 'BYOB',        sub: 'guests bring own' },
                  { val: 'sold',   label: 'Cash Bar',    sub: 'sold to guests' },
                ] as { val: AlcoholType; label: string; sub?: string }[]
              ).map(({ val, label, sub }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAlcohol(val)}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 py-3 px-2 text-sm font-medium transition-colors ${
                    alcohol === val
                      ? 'border-[#1CA0DF] bg-[#EDF0FA] text-[#105778]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-[#1CA0DF]'
                  }`}
                >
                  {label}
                  {sub && <span className="text-xs font-normal text-gray-400 mt-0.5">{sub}</span>}
                </button>
              ))}
            </div>

            {/* Sold follow-up: profit? */}
            {alcohol === 'sold' && (
              <div className="mt-3 bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2 font-medium">
                  Will you make a profit from alcohol sales?
                </p>
                <div className="flex gap-3">
                  <Controller
                    name="soldProfit"
                    control={control}
                    render={({ field }) => (
                      <>
                        <ToggleButton
                          active={field.value === true}
                          onClick={() => {
                            field.onChange(true)
                            setValue('ticketCharge', null)
                          }}
                        >
                          Yes
                        </ToggleButton>
                        <ToggleButton
                          active={field.value === false}
                          onClick={() => {
                            field.onChange(false)
                            setValue('ticketCharge', null)
                          }}
                        >
                          No
                        </ToggleButton>
                      </>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Ticket charge follow-up */}
            {showTicketQuestion && (
              <div className="mt-3 bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2 font-medium">
                  Is there a ticket/admission charge for this event?
                </p>
                <div className="flex gap-3">
                  <Controller
                    name="ticketCharge"
                    control={control}
                    render={({ field }) => (
                      <>
                        <ToggleButton
                          active={field.value === true}
                          onClick={() => field.onChange(true)}
                        >
                          Yes
                        </ToggleButton>
                        <ToggleButton
                          active={field.value === false}
                          onClick={() => field.onChange(false)}
                        >
                          No
                        </ToggleButton>
                      </>
                    )}
                  />
                </div>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-400">
              If unsure, select "Hosted Bar" to be safe.
            </p>
          </div>

          {/* ── 5. Policy Add-ons ─────────────────────────────────────── */}
          <div>
            <SectionTitle>Does your venue require any of these?</SectionTitle>
            <p className="text-xs text-gray-400 mb-4">
              Only select if explicitly required — most events don't need them.
            </p>

            <div className="space-y-3">
              {(
                [
                  {
                    field: 'wos' as const,
                    label: 'Waiver of Subrogation',
                    hint: 'Prevents the insurer from recovering costs from a third party.',
                  },
                  {
                    field: 'pancb' as const,
                    label: 'Primary/Non-contributory',
                    hint: 'Makes this policy pay claims before any other coverage.',
                  },
                  {
                    field: 'noha' as const,
                    label: 'Hired/Non-owned Auto',
                    hint: 'Covers hired or non-owned vehicles involved in the event.',
                  },
                ]
              ).map(({ field, label, hint }) => (
                <label key={field} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={watch(field)}
                    onChange={(e) => setValue(field, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1CA0DF] focus:ring-[#1CA0DF]"
                  />
                  <span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#105778]">
                      {label}
                    </span>
                    <span className="block text-xs text-gray-400">{hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-5">
              <label className="block text-sm text-gray-700 mb-1">
                Additional Insureds
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                {...register('additionalInsureds', { valueAsNumber: true })}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
              />
              <p className="mt-1 text-xs text-gray-400">
                Number of additional people, places, or businesses to include.
              </p>
              <FieldError msg={errors.additionalInsureds?.message} />
            </div>
          </div>

          {/* ── Manual quote warning ──────────────────────────────────── */}
          {manualMsg && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Online quote not available
              </p>
              <p className="text-sm text-amber-700 mb-3">{manualMsg}</p>
              <p className="text-sm text-amber-700">
                Please call us at{' '}
                <a href="tel:+18005551234" className="font-semibold underline">
                  1-800-555-1234
                </a>{' '}
                or{' '}
                <a href="mailto:quotes@onedayevent.com" className="font-semibold underline">
                  email us
                </a>{' '}
                and we'll get you a quote within 1 business day.
              </p>
            </div>
          )}

          {/* ── Submit ────────────────────────────────────────────────── */}
          {!manualMsg && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm transition-colors disabled:opacity-40"
            >
              See My Plans →
            </button>
          )}

        </div>
      </form>
    </QuoteLayout>
  )
}
