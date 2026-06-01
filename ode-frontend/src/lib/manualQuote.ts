import type { QuoteParams } from '../types'

/**
 * Manual-quote / underwriting routing.
 *
 * Ports ode_new QuestionLayout.toManualQuote(). An event is routed to manual
 * underwriting (no online plans/payment) when it carries higher risk.
 *
 * NOTE: the legacy operator precedence made Hired/Non-owned Auto = Yes (and the
 * vendor flow) SUPPRESS manual review — almost certainly a bug. Per product
 * decision we fix it: hired-auto TRIGGERS review. The vendor flow has no
 * alcohol/activities/ticket/multi-date steps, so those triggers don't apply to
 * vendors (but hired-auto still does).
 */

/** True when every event date is exactly one day after the previous one. */
export function areDatesConsecutive(eventDates: string): boolean {
  const days = eventDates
    .split(',')
    .map((s) => parseDayUtc(s))
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b)

  if (days.length <= 1) return true

  const DAY = 86_400_000
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] !== DAY) return false
  }
  return true
}

/** Parse a date string (YYYY-MM-DD or MM/DD/YYYY) to a UTC-midnight timestamp. */
function parseDayUtc(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null

  let y: number, m: number, d: number
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    ;[y, m, d] = s.slice(0, 10).split('-').map(Number)
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    const [mm, dd, yy] = s.split('/').map(Number)
    y = yy
    m = mm
    d = dd
  } else {
    const dt = new Date(s)
    if (Number.isNaN(dt.getTime())) return null
    y = dt.getFullYear()
    m = dt.getMonth() + 1
    d = dt.getDate()
  }
  return Date.UTC(y, m - 1, d)
}

/**
 * Human-readable reasons the quote needs manual review. Empty = auto-quote.
 */
export function manualQuoteReasons(p: Partial<QuoteParams>): string[] {
  const reasons: string[] = []

  // Hired / non-owned auto coverage — always routes to review (bug fixed).
  if (p.noha === 1) {
    reasons.push('Hired / non-owned auto coverage requested')
  }

  // The vendor flow skips alcohol / activities / ticket / multi-date steps.
  if (!p.isVendor) {
    if (p.liquor === 1) {
      reasons.push('Alcohol is sold for profit')
    }
    if (p.special_activities === 'Yes' && p.eventTypeName !== 'Wedding Reception') {
      reasons.push('Event includes special activities')
    }
    if (p.is_charge_ticket === 'Yes') {
      reasons.push('Tickets are charged for the event')
    }
    if (p.eventDates && !areDatesConsecutive(p.eventDates)) {
      reasons.push('Event dates are not consecutive')
    }
  }

  return reasons
}

/** True when the quote must go to manual underwriting instead of plans. */
export function shouldManualQuote(p: Partial<QuoteParams>): boolean {
  return manualQuoteReasons(p).length > 0
}
