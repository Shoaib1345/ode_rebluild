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
  return (
    <p className="mt-1.5 text-xs text-[#E0232C] flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  )
}

function SectionCard({
  num,
  icon,
  title,
  children,
}: {
  num: number
  icon: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_4px_12px_rgba(55,106,136,0.10)] overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-[#EDF0FA] border-b border-[#E3E3E3]/70">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1CA0DF] text-white text-xs font-bold flex items-center justify-center">
          {num}
        </span>
        <img src={icon} alt="" className="w-8 h-8 object-contain" />
        <h2 className="text-[15px] font-bold text-[#262D45]">{title}</h2>
      </div>
      {/* Section body */}
      <div className="px-6 py-6">{children}</div>
    </div>
  )
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex rounded-xl border border-[#E3E3E3] overflow-hidden w-fit">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-6 py-2 text-sm font-semibold transition-colors ${
          value === true
            ? 'bg-[#1CA0DF] text-white'
            : 'bg-white text-[#505458] hover:bg-[#EDF0FA]'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-6 py-2 text-sm font-semibold border-l border-[#E3E3E3] transition-colors ${
          value === false
            ? 'bg-[#1CA0DF] text-white'
            : 'bg-white text-[#505458] hover:bg-[#EDF0FA]'
        }`}
      >
        No
      </button>
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-xl border px-4 py-3 text-sm text-[#262D45] placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
    err
      ? 'border-[#E0232C] bg-red-50 focus:ring-red-200 focus:border-[#E0232C]'
      : 'border-[#E3E3E3] bg-white focus:ring-[#1CA0DF]/20 focus:border-[#1CA0DF]'
  }`

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuoteDetailsPage() {
  const navigate   = useNavigate()
  const setParams  = useQuoteStore((s) => s.setParams)
  const stored     = useQuoteStore((s) => s.params)
  const [manualMsg, setManualMsg] = useState<string | null>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [zipCode,   setZipCode]   = useState('')
  const [zipLoading, setZipLoading] = useState(false)
  const [zipError,  setZipError]  = useState<string | null>(null)

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

  useEffect(() => {
    if (!stored.eventType) navigate('/onedayevent', { replace: true })
  }, [stored.eventType, navigate])

  const alcohol         = watch('alcohol')
  const soldProfit      = watch('soldProfit')
  const eventState      = watch('eventState')
  void watch('privateResidence')
  void watch('isVenue')
  const primaryDate     = watch('primaryDate')
  const additionalDates = watch('additionalDates')

  const handleAlcohol = (val: AlcoholType) => {
    setValue('alcohol', val, { shouldValidate: true })
    setValue('soldProfit', null)
    setValue('ticketCharge', null)
    setManualMsg(null)
  }

  const showTicketQuestion =
    alcohol === 'hosted' ||
    (alcohol === 'sold' && soldProfit === false)

  // ── ZIP code → state auto-fill ──────────────────────────────────────────
  const handleZipLookup = async () => {
    if (zipCode.length !== 5) return
    setZipLoading(true)
    setZipError(null)
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`)
      if (!res.ok) { setZipError('ZIP not found — select state manually.'); return }
      const data = await res.json()
      const abbr: string = data.places?.[0]?.['state abbreviation'] ?? ''
      if (!abbr) { setZipError('Could not determine state — select manually.'); return }
      const match = states.find((s) => s.abbreviation.toUpperCase() === abbr.toUpperCase())
      if (match) {
        setValue('eventState', match.name, { shouldValidate: true })
        setZipError(null)
      } else {
        setZipError('State not recognised — select manually.')
      }
    } catch {
      setZipError('ZIP lookup failed — select state manually.')
    } finally {
      setZipLoading(false)
    }
  }

  const onSubmit = (data: FormData) => {
    const reason = isManualQuoteRequired(data)
    if (reason) { setManualMsg(reason); return }
    setManualMsg(null)

    const allDates   = [data.primaryDate, ...data.additionalDates]
    const dateString = allDates.map(formatDate).join(',')
    const timezone   = Intl.DateTimeFormat().resolvedOptions().timeZone

    const hostLiquor = data.alcohol === 'hosted' || data.alcohol === 'byob'
      || (data.alcohol === 'sold' && data.soldProfit === false)
    const liquor = data.alcohol === 'sold' && data.soldProfit === true

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

  const allSelectedDates = primaryDate ? [primaryDate, ...additionalDates] : []

  return (
    <QuoteLayout step={8}>

      {/* ── Back nav + event tag ─────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/onedayevent')}
          className="inline-flex items-center gap-1 text-sm text-[#1CA0DF] hover:text-[#105778] font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        {stored.eventTypeName && (
          <span className="text-xs font-semibold bg-[#EDF0FA] text-[#105778] px-3 py-1 rounded-full">
            {stored.eventTypeName}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* ── 1. Event Date ──────────────────────────────────────────── */}
        <SectionCard num={1} icon="/assets/images/quote-event.png" title="When is your event?">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#262D45] mb-2">
              Event date <span className="text-[#E0232C]">*</span>
            </label>
            <Controller
              name="primaryDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  selected={field.value ?? null}
                  onChange={(d: Date | null) => {
                    field.onChange(d)
                    setValue('additionalDates', [])
                    setManualMsg(null)
                  }}
                  minDate={today}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select date"
                  className={inputCls(errors.primaryDate?.message)}
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
                  className="inline-flex items-center gap-1.5 text-sm text-[#1CA0DF] hover:underline font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add more dates (multi-day event)
                </button>
              ) : (
                <div className="space-y-3 mt-2 p-4 bg-[#EDF0FA]/60 rounded-xl border border-[#E3E3E3]">
                  <label className="block text-xs font-semibold text-[#262D45] mb-1">
                    Additional dates (optional)
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
                          placeholderText={`Additional date ${i + 1}`}
                          className={inputCls()}
                          wrapperClassName="w-full"
                          autoComplete="off"
                          excludeDates={allSelectedDates.filter((_, idx) => idx !== i + 1)}
                        />
                      )}
                    />
                  ))}
                  <p className="text-xs text-[#797979]">
                    Multi-day events must be on consecutive days (max 3 dates).
                  </p>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* ── 2. Location ────────────────────────────────────────────── */}
        <SectionCard num={2} icon="/assets/images/quote-state.png" title="Where is the event?">
          {/* ZIP auto-fill */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#262D45] mb-2">
              ZIP Code{' '}
              <span className="text-[#797979] font-normal">(auto-fills state)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                  setZipCode(val)
                  if (zipError) setZipError(null)
                }}
                onBlur={handleZipLookup}
                placeholder="e.g. 90210"
                className={inputCls()}
              />
              {zipLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1CA0DF] animate-pulse">
                  Looking up…
                </span>
              )}
            </div>
            {zipError && (
              <p className="mt-1.5 text-xs text-amber-600">{zipError}</p>
            )}
          </div>

          {/* State dropdown */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#262D45] mb-2">
              State <span className="text-[#E0232C]">*</span>
            </label>
            <select
              {...register('eventState')}
              disabled={statesLoading}
              className={inputCls(errors.eventState?.message)}
            >
              <option value="">Select state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <FieldError msg={errors.eventState?.message} />
          </div>

          {/* Private residence toggle */}
          {eventState && !isVendor && (
            <div className="mb-4 p-4 bg-[#EDF0FA]/60 rounded-xl border border-[#E3E3E3]">
              <p className="text-sm font-semibold text-[#262D45] mb-3">
                Is the event held at a private residence?
              </p>
              <Controller
                name="privateResidence"
                control={control}
                render={({ field }) => (
                  <YesNoToggle value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          )}

          {/* Set venue toggle */}
          {eventState && (
            <div className="p-4 bg-[#EDF0FA]/60 rounded-xl border border-[#E3E3E3]">
              <p className="text-sm font-semibold text-[#262D45] mb-3">
                Is this at a set venue (venue requires to be listed)?
              </p>
              <Controller
                name="isVenue"
                control={control}
                render={({ field }) => (
                  <YesNoToggle value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          )}
        </SectionCard>

        {/* ── 3. Guests ──────────────────────────────────────────────── */}
        <SectionCard num={3} icon="/assets/images/quote-guests.png" title="How many guests will attend?">
          <input
            type="number"
            min={1}
            placeholder="Number of guests"
            {...register('persons', { valueAsNumber: true })}
            className={inputCls(errors.persons?.message)}
          />
          <p className="mt-2 text-xs text-[#797979]">
            Use the highest expected attendance to ensure full coverage.
          </p>
          <FieldError msg={errors.persons?.message} />
        </SectionCard>

        {/* ── 4. Alcohol ─────────────────────────────────────────────── */}
        <SectionCard num={4} icon="/assets/images/quote-alchohal.png" title="Alcohol at the event">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {(
              [
                { val: 'none',   label: 'No Alcohol', sub: '' },
                { val: 'hosted', label: 'Hosted Bar',  sub: 'served free' },
                { val: 'byob',   label: 'BYOB',        sub: 'guests bring own' },
                { val: 'sold',   label: 'Cash Bar',    sub: 'sold to guests' },
              ] as { val: AlcoholType; label: string; sub: string }[]
            ).map(({ val, label, sub }) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAlcohol(val)}
                className={`flex flex-col items-center justify-center rounded-xl border-2 py-3.5 px-2 text-sm font-semibold transition-all ${
                  alcohol === val
                    ? 'border-[#1CA0DF] bg-[#EDF0FA] text-[#105778] shadow-sm'
                    : 'border-[#E3E3E3] bg-white text-[#505458] hover:border-[#1CA0DF]/50'
                }`}
              >
                {label}
                {sub && <span className="text-xs font-normal text-[#797979] mt-0.5">{sub}</span>}
              </button>
            ))}
          </div>

          {alcohol === 'sold' && (
            <div className="mt-3 bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-800 mb-3">
                Will you make a profit from alcohol sales?
              </p>
              <Controller
                name="soldProfit"
                control={control}
                render={({ field }) => (
                  <YesNoToggle
                    value={field.value ?? false}
                    onChange={(v) => {
                      field.onChange(v)
                      setValue('ticketCharge', null)
                    }}
                  />
                )}
              />
            </div>
          )}

          {showTicketQuestion && (
            <div className="mt-3 bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-800 mb-3">
                Is there a ticket/admission charge for this event?
              </p>
              <Controller
                name="ticketCharge"
                control={control}
                render={({ field }) => (
                  <YesNoToggle
                    value={field.value ?? false}
                    onChange={(v) => field.onChange(v)}
                  />
                )}
              />
            </div>
          )}

          <p className="mt-3 text-xs text-[#797979]">
            If unsure, select "Hosted Bar" to be safe.
          </p>
        </SectionCard>

        {/* ── 5. Add-ons ─────────────────────────────────────────────── */}
        <SectionCard num={5} icon="/assets/images/quote-include.png" title="Does your venue require any of these?">
          <p className="text-xs text-[#797979] mb-5">
            Only select if explicitly required by your venue — most events don't need them.
          </p>

          <div className="space-y-3 mb-6">
            {(
              [
                {
                  field: 'wos' as const,
                  label: 'Waiver of Subrogation',
                  hint: 'Prevents the insurer from recovering costs from a third party.',
                },
                {
                  field: 'pancb' as const,
                  label: 'Primary / Non-contributory',
                  hint: 'Makes this policy pay claims before any other coverage.',
                },
                {
                  field: 'noha' as const,
                  label: 'Hired / Non-owned Auto',
                  hint: 'Covers hired or non-owned vehicles involved in the event.',
                },
              ]
            ).map(({ field, label, hint }) => (
              <label
                key={field}
                className={`flex items-start gap-3 cursor-pointer group p-3 rounded-xl border-2 transition-colors ${
                  watch(field) ? 'border-[#1CA0DF] bg-[#EDF0FA]/50' : 'border-transparent hover:border-[#E3E3E3]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={watch(field)}
                  onChange={(e) => setValue(field, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1CA0DF] focus:ring-[#1CA0DF]"
                />
                <span>
                  <span className="text-sm font-semibold text-[#262D45]">{label}</span>
                  <span className="block text-xs text-[#797979] mt-0.5">{hint}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E3E3E3]">
            <label className="block text-xs font-semibold text-[#262D45] mb-2">
              Additional Insureds
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                placeholder="0"
                {...register('additionalInsureds', { valueAsNumber: true })}
                className="w-28 rounded-xl border border-[#E3E3E3] px-4 py-2.5 text-sm text-[#262D45] focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/20 focus:border-[#1CA0DF]"
              />
              <p className="text-xs text-[#797979]">
                Number of additional people, places, or businesses to include on the policy.
              </p>
            </div>
            <FieldError msg={errors.additionalInsureds?.message} />
          </div>
        </SectionCard>

        {/* ── Manual quote warning ────────────────────────────────────── */}
        {manualMsg && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <p className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Online quote not available
            </p>
            <p className="text-sm text-amber-700 mb-3">{manualMsg}</p>
            <p className="text-sm text-amber-700">
              Please call us at{' '}
              <a href="tel:+14082176787" className="font-semibold underline">408-217-6787</a>{' '}
              or{' '}
              <a href="mailto:support@onedayevent.com" className="font-semibold underline">email us</a>{' '}
              and we'll get you a quote within 1 business day.
            </p>
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────────────────── */}
        {!manualMsg && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-[#E0232C] hover:bg-[#C51E26] text-white font-bold text-base tracking-wide transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Loading…' : 'See My Plans →'}
          </button>
        )}

      </form>
    </QuoteLayout>
  )
}
