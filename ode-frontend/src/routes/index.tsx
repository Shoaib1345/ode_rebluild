import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ui/ProtectedRoute'

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────

// Public
const HomePage        = lazy(() => import('../pages/home/HomePage'))

// Auth
const LoginPage       = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage    = lazy(() => import('../pages/auth/RegisterPage'))

// Quote Wizard
const EventTypePage        = lazy(() => import('../pages/quote/EventTypePage'))
const VendorOrHostPage     = lazy(() => import('../pages/quote/VendorOrHostPage'))
const VendorActivityPage   = lazy(() => import('../pages/quote/VendorActivityPage'))
const QuoteDatesPage       = lazy(() => import('../pages/quote/QuoteDatesPage'))
const QuoteLocationPage    = lazy(() => import('../pages/quote/QuoteLocationPage'))
const QuoteAlcoholPage     = lazy(() => import('../pages/quote/QuoteAlcoholPage'))
const QuoteGuestsPage      = lazy(() => import('../pages/quote/QuoteGuestsPage'))
const QuoteActivitiesPage  = lazy(() => import('../pages/quote/QuoteActivitiesPage'))
const QuoteAddonsPage       = lazy(() => import('../pages/quote/QuoteAddonsPage'))
const QuoteDescriptionPage  = lazy(() => import('../pages/quote/QuoteDescriptionPage'))
const QuotePlansPage        = lazy(() => import('../pages/quote/QuotePlansPage'))
const QuoteInsuredPage      = lazy(() => import('../pages/quote/QuoteInsuredPage'))
const QuoteVenuePage        = lazy(() => import('../pages/quote/QuoteVenuePage'))
const QuoteInfoPage        = lazy(() => import('../pages/quote/QuoteInfoPage'))
const QuotePaymentPage     = lazy(() => import('../pages/quote/QuotePaymentPage'))
const QuoteConfirmationPage = lazy(() => import('../pages/quote/QuoteConfirmationPage'))

// Quote Resume
const QuoteResumePage  = lazy(() => import('../pages/quote/QuoteResumePage'))

// Invoice
const InvoicePayPage     = lazy(() => import('../pages/invoice/InvoicePayPage'))
const InvoiceSuccessPage = lazy(() => import('../pages/invoice/InvoiceSuccessPage'))

// Admin
const DashboardPage       = lazy(() => import('../pages/admin/DashboardPage'))
const LeadsPage           = lazy(() => import('../pages/admin/LeadsPage'))
const LeadDetailPage      = lazy(() => import('../pages/admin/LeadDetailPage'))
const InvoicesPage        = lazy(() => import('../pages/admin/InvoicesPage'))
const InvoiceCreatePage   = lazy(() => import('../pages/admin/InvoiceCreatePage'))
const InvoiceDetailPage   = lazy(() => import('../pages/admin/InvoiceDetailPage'))

// Affiliate
const AffiliateSignupPage  = lazy(() => import('../pages/affiliate/AffiliateSignupPage'))
const AffiliateDashboard   = lazy(() => import('../pages/affiliate/AffiliateDashboard'))

// Partner
const PartnerSignupPage    = lazy(() => import('../pages/partner/PartnerSignupPage'))

// Customer Portal
const CustomerLayout         = lazy(() => import('../pages/customer/CustomerLayout'))
const CustomerDashboard      = lazy(() => import('../pages/customer/CustomerDashboard'))
const CustomerEventsPage     = lazy(() => import('../pages/customer/CustomerEventsPage'))
const CustomerInvoicesPage   = lazy(() => import('../pages/customer/CustomerInvoicesPage'))
const CustomerReferralPage   = lazy(() => import('../pages/customer/CustomerReferralPage'))
const CommissionsTab         = lazy(() => import('../components/commission/CommissionsTab'))

// Agent Portal
const AgentLayout            = lazy(() => import('../pages/agent/AgentLayout'))
const AgentDashboard         = lazy(() => import('../pages/agent/AgentDashboard'))
const AgentLeadsPage         = lazy(() => import('../pages/agent/AgentLeadsPage'))
const AgentLeadDetailPage    = lazy(() => import('../pages/agent/AgentLeadDetailPage'))
const AgentCommissionsPage   = lazy(() => import('../pages/agent/AgentCommissionsPage'))

// Planner Portal
const PlannerLayout          = lazy(() => import('../pages/planner/PlannerLayout'))
const PlannerDashboard       = lazy(() => import('../pages/planner/PlannerDashboard'))
const PlannerReferralsPage   = lazy(() => import('../pages/planner/PlannerReferralsPage'))
const PlannerCommissionsPage = lazy(() => import('../pages/planner/PlannerCommissionsPage'))

// Admin User Management
const AdminUsersPage      = lazy(() => import('../pages/admin/AdminUsersPage'))
const AdminUserDetailPage = lazy(() => import('../pages/admin/AdminUserDetailPage'))

// Admin Payroll
const AdminPayrollPage = lazy(() => import('../pages/admin/AdminPayrollPage'))

// Admin W9 Management
const AdminW9Page = lazy(() => import('../pages/admin/AdminW9Page'))

// Admin Email Templates
const AdminEmailTemplatesPage    = lazy(() => import('../pages/admin/AdminEmailTemplatesPage'))
const AdminEmailTemplateEditPage = lazy(() => import('../pages/admin/AdminEmailTemplateEditPage'))

// Admin CMS Pages + Subscribers
const AdminPagesPage      = lazy(() => import('../pages/admin/AdminPagesPage'))
const AdminPageEditPage   = lazy(() => import('../pages/admin/AdminPageEditPage'))
const AdminSubscribersPage = lazy(() => import('../pages/admin/AdminSubscribersPage'))

// Admin Rate Import
const AdminRateImportPage = lazy(() => import('../pages/admin/AdminRateImportPage'))

// Public pages
const PublicPage    = lazy(() => import('../pages/public/PublicPage'))
const AboutPage     = lazy(() => import('../pages/public/AboutPage'))
const ContactPage   = lazy(() => import('../pages/public/ContactPage'))
const FaqPage       = lazy(() => import('../pages/public/FaqPage'))
const TermsPage     = lazy(() => import('../pages/public/TermsPage'))
const PrivacyPage   = lazy(() => import('../pages/public/PrivacyPage'))

// Blog
const BlogIndexPage = lazy(() => import('../pages/public/BlogIndexPage'))
const BlogPostPage  = lazy(() => import('../pages/public/BlogPostPage'))
const AdminBlogPage     = lazy(() => import('../pages/admin/BlogPage'))
const AdminBlogEditPage = lazy(() => import('../pages/admin/BlogEditPage'))

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>

        {/* ── Public ──────────────────────────────────────────────────── */}
        <Route path="/" element={<HomePage />} />

        {/* ── Auth ────────────────────────────────────────────────────── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Quote Wizard ──────────────────────────────────────────────── */}
        {/* Step 1: Event Type */}
        <Route path="/onedayevent"              element={<EventTypePage />} />
        {/* Vendor at Event branch pages */}
        <Route path="/quote/vendor-or-host"     element={<VendorOrHostPage />} />
        <Route path="/quote/vendor-activity"    element={<VendorActivityPage />} />
        {/* Step 2–7: Individual question screens */}
        <Route path="/quote/dates"              element={<QuoteDatesPage />} />
        <Route path="/quote/location"           element={<QuoteLocationPage />} />
        <Route path="/quote/alcohol"            element={<QuoteAlcoholPage />} />
        <Route path="/quote/guests"             element={<QuoteGuestsPage />} />
        <Route path="/quote/activities"         element={<QuoteActivitiesPage />} />
        <Route path="/quote/addons"             element={<QuoteAddonsPage />} />
        <Route path="/quote/description"        element={<QuoteDescriptionPage />} />
        {/* Step 8–10: Plans, Checkout (Insured → Venue → Info), Payment */}
        <Route path="/quote/plans"         element={<QuotePlansPage />} />
        <Route path="/quote/insured"       element={<QuoteInsuredPage />} />
        <Route path="/quote/venue"         element={<QuoteVenuePage />} />
        <Route path="/quote/info"          element={<QuoteInfoPage />} />
        <Route path="/quote/payment"       element={<QuotePaymentPage />} />
        <Route path="/quote/confirmation/:leadNumber" element={<QuoteConfirmationPage />} />
        <Route path="/quote/resume/:token"            element={<QuoteResumePage />} />

        {/* ── Invoice ──────────────────────────────────────────────────── */}
        <Route path="/invoice/:encodeId"         element={<InvoicePayPage />} />
        <Route path="/invoice/:encodeId/success" element={<InvoiceSuccessPage />} />

        {/* ── Admin ─────────────────────────────────────────────────────── */}
        <Route path="/admin"                    element={<ProtectedRoute maxLevel={2}><DashboardPage /></ProtectedRoute>} />
        {/* ── Leads sub-views (static segments BEFORE :id) ────────────── */}
        <Route path="/admin/leads"              element={<ProtectedRoute maxLevel={2}><LeadsPage /></ProtectedRoute>} />
        <Route path="/admin/leads/priority"     element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="priority" /></ProtectedRoute>} />
        <Route path="/admin/leads/sold"         element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="sold" /></ProtectedRoute>} />
        <Route path="/admin/leads/past"         element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="past" /></ProtectedRoute>} />
        <Route path="/admin/leads/follow-up"    element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="follow_up" /></ProtectedRoute>} />
        <Route path="/admin/leads/future"       element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="future" /></ProtectedRoute>} />
        <Route path="/admin/leads/untouched"    element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="untouched" /></ProtectedRoute>} />
        <Route path="/admin/leads/bound"        element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="bound" /></ProtectedRoute>} />
        <Route path="/admin/leads/cancelled"    element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="cancelled" /></ProtectedRoute>} />
        <Route path="/admin/leads/untouch"      element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="untouch" /></ProtectedRoute>} />
        <Route path="/admin/leads/my"           element={<ProtectedRoute maxLevel={2}><LeadsPage viewFilter="my_leads" /></ProtectedRoute>} />
        {/* Lead detail — dynamic :id comes AFTER all static sub-routes */}
        <Route path="/admin/leads/:id"          element={<ProtectedRoute maxLevel={2}><LeadDetailPage /></ProtectedRoute>} />
        <Route path="/admin/invoices"           element={<ProtectedRoute maxLevel={2}><InvoicesPage /></ProtectedRoute>} />
        <Route path="/admin/invoices/new"       element={<ProtectedRoute maxLevel={2}><InvoiceCreatePage /></ProtectedRoute>} />
        <Route path="/admin/invoices/:id"       element={<ProtectedRoute maxLevel={2}><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="/admin/blog"               element={<ProtectedRoute maxLevel={2}><AdminBlogPage /></ProtectedRoute>} />
        <Route path="/admin/blog/new"           element={<ProtectedRoute maxLevel={2}><AdminBlogEditPage /></ProtectedRoute>} />
        <Route path="/admin/blog/:id/edit"      element={<ProtectedRoute maxLevel={2}><AdminBlogEditPage /></ProtectedRoute>} />
        <Route path="/admin/users"              element={<ProtectedRoute maxLevel={2}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/users/:id"          element={<ProtectedRoute maxLevel={2}><AdminUserDetailPage /></ProtectedRoute>} />
        <Route path="/admin/payroll"            element={<ProtectedRoute maxLevel={2}><AdminPayrollPage /></ProtectedRoute>} />
        <Route path="/admin/w9"                element={<ProtectedRoute maxLevel={2}><AdminW9Page /></ProtectedRoute>} />
        <Route path="/admin/email-templates"       element={<ProtectedRoute maxLevel={1}><AdminEmailTemplatesPage /></ProtectedRoute>} />
        <Route path="/admin/email-templates/new"   element={<ProtectedRoute maxLevel={1}><AdminEmailTemplateEditPage /></ProtectedRoute>} />
        <Route path="/admin/email-templates/:id"   element={<ProtectedRoute maxLevel={1}><AdminEmailTemplateEditPage /></ProtectedRoute>} />
        <Route path="/admin/pages"                 element={<ProtectedRoute maxLevel={2}><AdminPagesPage /></ProtectedRoute>} />
        <Route path="/admin/pages/new"             element={<ProtectedRoute maxLevel={2}><AdminPageEditPage /></ProtectedRoute>} />
        <Route path="/admin/pages/:id"             element={<ProtectedRoute maxLevel={2}><AdminPageEditPage /></ProtectedRoute>} />
        <Route path="/admin/subscribers"           element={<ProtectedRoute maxLevel={2}><AdminSubscribersPage /></ProtectedRoute>} />
        <Route path="/admin/rate-import"           element={<ProtectedRoute maxLevel={1}><AdminRateImportPage /></ProtectedRoute>} />

        {/* ── Affiliate ────────────────────────────────────────────────── */}
        <Route path="/affiliate-signup" element={<AffiliateSignupPage />} />
        <Route path="/affiliate" element={<ProtectedRoute exactLevel={6}><AffiliateDashboard /></ProtectedRoute>} />

        {/* ── Partner / Venue / Planner ───────────────────────────────── */}
        <Route path="/partner-signup" element={<PartnerSignupPage />} />

        {/* ── Customer Portal ──────────────────────────────────────────── */}
        <Route
          path="/customer"
          element={<ProtectedRoute exactLevel={5}><CustomerLayout /></ProtectedRoute>}
        >
          <Route index            element={<CustomerDashboard />} />
          <Route path="events"    element={<CustomerEventsPage />} />
          <Route path="invoices"  element={<CustomerInvoicesPage />} />
          <Route path="refer"     element={<CustomerReferralPage />} />
          <Route path="commissions" element={<CommissionsTab />} />
        </Route>

        {/* ── Agent Portal ────────────────────────────────────────────── */}
        <Route
          path="/agent"
          element={<ProtectedRoute exactLevel={7}><AgentLayout /></ProtectedRoute>}
        >
          <Route index                 element={<AgentDashboard />} />
          <Route path="leads"          element={<AgentLeadsPage />} />
          <Route path="leads/:id"      element={<AgentLeadDetailPage />} />
          <Route path="commissions"    element={<AgentCommissionsPage />} />
        </Route>

        {/* ── Planner Portal ──────────────────────────────────────────── */}
        <Route
          path="/planner"
          element={<ProtectedRoute exactLevel={8}><PlannerLayout /></ProtectedRoute>}
        >
          <Route index                  element={<PlannerDashboard />} />
          <Route path="referrals"       element={<PlannerReferralsPage />} />
          <Route path="commissions"     element={<PlannerCommissionsPage />} />
        </Route>

        {/* ── Public Pages ─────────────────────────────────────────────── */}
        <Route path="/about"          element={<AboutPage />} />
        <Route path="/contact"        element={<ContactPage />} />
        <Route path="/faq"            element={<FaqPage />} />
        <Route path="/terms"          element={<TermsPage />} />
        <Route path="/privacy"        element={<PrivacyPage />} />
        <Route path="/pages/:slug"    element={<PublicPage />} />

        {/* ── Blog ─────────────────────────────────────────────────────── */}
        <Route path="/blog"           element={<BlogIndexPage />} />
        <Route path="/blog/:slug"     element={<BlogPostPage />} />

        {/* ── 404 ─────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  )
}
