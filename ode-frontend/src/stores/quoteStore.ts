import { create } from 'zustand'
import type { QuoteParams, QuotePlan, QuotePlans } from '../types'

interface QuoteState {
  // Step 1 — event type
  params: Partial<QuoteParams>
  // Step 3 — fetched plans
  plans: QuotePlans | null
  // Step 3 — selected plan
  selectedPlan: QuotePlan | null
  // Step 4 — customer info (filled form data)
  customerInfo: Record<string, unknown>
  // Pending quote save/resume token
  pendingQuoteId: string | null

  setParams: (params: Partial<QuoteParams>) => void
  setPlans: (plans: QuotePlans) => void
  setSelectedPlan: (plan: QuotePlan) => void
  setCustomerInfo: (info: Record<string, unknown>) => void
  setPendingQuoteId: (id: string | null) => void
  restoreFromPending: (wizardState: Record<string, unknown>, token: string) => void
  reset: () => void
}

const initialState = {
  params: {},
  plans: null,
  selectedPlan: null,
  customerInfo: {},
  pendingQuoteId: null as string | null,
}

export const useQuoteStore = create<QuoteState>((set) => ({
  ...initialState,

  setParams: (params) =>
    set((state) => ({ params: { ...state.params, ...params } })),

  setPlans: (plans) => set({ plans }),

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),

  setCustomerInfo: (info) =>
    set((state) => ({ customerInfo: { ...state.customerInfo, ...info } })),

  setPendingQuoteId: (id) => set({ pendingQuoteId: id }),

  restoreFromPending: (wizardState, token) => {
    // Rebuild quoteStore from a saved wizard_state snapshot
    set({
      params:         (wizardState.params        as Partial<QuoteParams>)          ?? {},
      plans:          (wizardState.plans          as QuotePlans | null)             ?? null,
      selectedPlan:   (wizardState.selectedPlan   as QuotePlan | null)             ?? null,
      customerInfo:   (wizardState.customerInfo   as Record<string, unknown>)      ?? {},
      pendingQuoteId: token,
    })
  },

  reset: () => set(initialState),
}))
