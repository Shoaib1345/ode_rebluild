import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ui/ProtectedRoute'

// ─── Lazy-loaded pages (add as each chunk is built) ──────────────────────────

// Public
const HomePage        = lazy(() => import('../pages/home/HomePage'))

// Auth (Chunk 9)
const LoginPage       = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage    = lazy(() => import('../pages/auth/RegisterPage'))

// Quote Wizard (Chunks 11–15)
const EventTypePage    = lazy(() => import('../pages/quote/EventTypePage'))
const QuoteDetailsPage = lazy(() => import('../pages/quote/QuoteDetailsPage'))
const QuotePlansPage   = lazy(() => import('../pages/quote/QuotePlansPage'))
const QuoteInfoPage    = lazy(() => import('../pages/quote/QuoteInfoPage'))
const QuotePaymentPage = lazy(() => import('../pages/quote/QuotePaymentPage'))
const QuoteConfirmationPage = lazy(() => import('../pages/quote/QuoteConfirmationPage'))

// Invoice (Chunk 21)
const InvoicePayPage     = lazy(() => import('../pages/invoice/InvoicePayPage'))
const InvoiceSuccessPage = lazy(() => import('../pages/invoice/InvoiceSuccessPage'))

// Admin (Chunks 17–20)
const DashboardPage       = lazy(() => import('../pages/admin/DashboardPage'))
const LeadsPage           = lazy(() => import('../pages/admin/LeadsPage'))
const LeadDetailPage      = lazy(() => import('../pages/admin/LeadDetailPage'))
const InvoicesPage        = lazy(() => import('../pages/admin/InvoicesPage'))
const InvoiceCreatePage   = lazy(() => import('../pages/admin/InvoiceCreatePage'))
const InvoiceDetailPage   = lazy(() => import('../pages/admin/InvoiceDetailPage'))

// Affiliate (Chunks 22–23)
const AffiliateSignupPage  = lazy(() => import('../pages/affiliate/AffiliateSignupPage'))
const AffiliateDashboard   = lazy(() => import('../pages/affiliate/AffiliateDashboard'))

// Partner (Chunk 24)
const PartnerSignupPage    = lazy(() => import('../pages/partner/PartnerSignupPage'))

// Customer Portal (Chunk 33)
const CustomerLayout         = lazy(() => import('../pages/customer/CustomerLayout'))
const CustomerDashboard      = lazy(() => import('../pages/customer/CustomerDashboard'))
const CustomerEventsPage     = lazy(() => import('../pages/customer/CustomerEventsPage'))
const CustomerInvoicesPage   = lazy(() => import('../pages/customer/CustomerInvoicesPage'))
const CustomerReferralPage   = lazy(() => import('../pages/customer/CustomerReferralPage'))
const CommissionsTab         = lazy(() => import('../components/commission/CommissionsTab'))

// Agent Portal (Chunk 34)
const AgentLayout            = lazy(() => import('../pages/agent/AgentLayout'))
const AgentDashboard         = lazy(() => import('../pages/agent/AgentDashboard'))
const AgentLeadsPage         = lazy(() => import('../pages/agent/AgentLeadsPage'))
const AgentLeadDetailPage    = lazy(() => import('../pages/agent/AgentLeadDetailPage'))
const AgentCommissionsPage   = lazy(() => import('../pages/agent/AgentCommissionsPage'))

// Public pages (Chunk 26)
const PublicPage    = lazy(() => import('../pages/public/PublicPage'))
const AboutPage     = lazy(() => import('../pages/public/AboutPage'))
const ContactPage   = lazy(() => import('../pages/public/ContactPage'))
const TermsPage     = lazy(() => import('../pages/public/TermsPage'))
const PrivacyPage   = lazy(() => import('../pages/public/PrivacyPage'))

// Blog (Chunk 27)
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
        <Route path="/onedayevent"    element={<EventTypePage />} />
        <Route path="/quote/details"  element={<QuoteDetailsPage />} />
        <Route path="/quote/plans"    element={<QuotePlansPage />} />
        <Route path="/quote/info"     element={<QuoteInfoPage />} />
        <Route path="/quote/payment" element={<QuotePaymentPage />} />
        <Route path="/quote/confirmation/:leadNumber" element={<QuoteConfirmationPage />} />

        {/* ── Invoice (Chunk 21) ───────────────────────────────────────── */}
        <Route path="/invoice/:encodeId"         element={<InvoicePayPage />} />
        <Route path="/invoice/:encodeId/success" element={<InvoiceSuccessPage />} />

        {/* ── Admin (Chunks 17–20) ──────────────────────────────────────── */}
        <Route path="/admin"                    element={<ProtectedRoute maxLevel={2}><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin/leads"              element={<ProtectedRoute maxLevel={2}><LeadsPage /></ProtectedRoute>} />
        <Route path="/admin/leads/:id"          element={<ProtectedRoute maxLevel={2}><LeadDetailPage /></ProtectedRoute>} />
        <Route path="/admin/invoices"           element={<ProtectedRoute maxLevel={2}><InvoicesPage /></ProtectedRoute>} />
        <Route path="/admin/invoices/new"       element={<ProtectedRoute maxLevel={2}><InvoiceCreatePage /></ProtectedRoute>} />
        <Route path="/admin/invoices/:id"       element={<ProtectedRoute maxLevel={2}><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="/admin/blog"               element={<ProtectedRoute maxLevel={2}><AdminBlogPage /></ProtectedRoute>} />
        <Route path="/admin/blog/new"           element={<ProtectedRoute maxLevel={2}><AdminBlogEditPage /></ProtectedRoute>} />
        <Route path="/admin/blog/:id/edit"      element={<ProtectedRoute maxLevel={2}><AdminBlogEditPage /></ProtectedRoute>} />

        {/* ── Affiliate (Chunks 22–23) ─────────────────────────────────── */}
        <Route path="/affiliate-signup" element={<AffiliateSignupPage />} />
        <Route path="/affiliate" element={<ProtectedRoute exactLevel={6}><AffiliateDashboard /></ProtectedRoute>} />

        {/* ── Partner / Venue / Planner (Chunk 24) ────────────────────── */}
        <Route path="/partner-signup" element={<PartnerSignupPage />} />

        {/* ── Customer Portal (Chunk 33) ───────────────────────────────── */}
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

        {/* ── Agent Portal (Chunk 34) ─────────────────────────────────── */}
        <Route
          path="/agent"
          element={<ProtectedRoute exactLevel={7}><AgentLayout /></ProtectedRoute>}
        >
          <Route index                 element={<AgentDashboard />} />
          <Route path="leads"          element={<AgentLeadsPage />} />
          <Route path="leads/:id"      element={<AgentLeadDetailPage />} />
          <Route path="commissions"    element={<AgentCommissionsPage />} />
        </Route>

        {/* ── Public Pages (Chunk 26) ──────────────────────────────────── */}
        <Route path="/about"          element={<AboutPage />} />
        <Route path="/contact"        element={<ContactPage />} />
        <Route path="/terms"          element={<TermsPage />} />
        <Route path="/privacy"        element={<PrivacyPage />} />
        <Route path="/pages/:slug"    element={<PublicPage />} />

        {/* ── Blog (Chunk 27) ──────────────────────────────────────────── */}
        <Route path="/blog"           element={<BlogIndexPage />} />
        <Route path="/blog/:slug"     element={<BlogPostPage />} />

        {/* ── 404 ─────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  )
}
