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

  setParams: (params: Partial<QuoteParams>) => void
  setPlans: (plans: QuotePlans) => void
  setSelectedPlan: (plan: QuotePlan) => void
  setCustomerInfo: (info: Record<string, unknown>) => void
  reset: () => void
}

const initialState = {
  params: {},
  plans: null,
  selectedPlan: null,
  customerInfo: {},
}

export const useQuoteStore = create<QuoteState>((set) => ({
  ...initialState,

  setParams: (params) =>
    set((state) => ({ params: { ...state.params, ...params } })),

  setPlans: (plans) => set({ plans }),

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),

  setCustomerInfo: (info) =>
    set((state) => ({ customerInfo: { ...state.customerInfo, ...info } })),

  reset: () => set(initialState),
}))
