<?php

use App\Http\Controllers\Admin\DocuSignController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LeadAssignmentController;
use App\Http\Controllers\Admin\PdfController;
use App\Http\Controllers\Admin\RateImportController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\DocuSignWebhookController;
use App\Http\Controllers\Admin\EmailTemplateController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\Admin\PayrollController;
use App\Http\Controllers\Admin\SubscriberController as AdminSubscriberController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Affiliate\PortalController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\Agent\PortalController as AgentPortalController;
use App\Http\Controllers\Customer\PortalController as CustomerPortalController;
use App\Http\Controllers\Planner\PortalController as PlannerPortalController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PartnerSignupController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\PendingQuoteController;
use App\Http\Controllers\PublicInvoiceController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\SubscriberController;
use App\Http\Controllers\W9Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — One Day Event Rebuild
|--------------------------------------------------------------------------
| All routes return JSON. Auth is via Laravel Sanctum tokens.
| Route groups are organized by feature chunk (see development-roadmap.md)
*/

// ─── Health Check ───────────────────────────────────────────────────────────
Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'app'    => config('app.name'),
    'env'    => config('app.env'),
]));

// ─── Auth (Chunk 8) ──────────────────────────────────────────────────────────
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });
});

// ─── Quote Engine (Chunk 10) ─────────────────────────────────────────────────
Route::middleware('throttle:quote')->group(function () {
    Route::get('/event-types', [QuoteController::class, 'eventTypes']);
    Route::get('/us-states',   [QuoteController::class, 'usStates']);
    Route::get('/quote',       [QuoteController::class, 'getQuote']);
    Route::get('/broker-fee',  [QuoteController::class, 'getBrokerFee']);
});

// ─── Lead / Payment (Chunk 15) ───────────────────────────────────────────────
Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:payment');

// ─── Pending Quote Save / Resume (Chunk 44) ───────────────────────────────────
Route::post('/leads/pending',          [PendingQuoteController::class, 'save'])->middleware('throttle:60,1');
Route::get('/quotes/pending/{token}',  [PendingQuoteController::class, 'resume']);

// ─── Public Invoice (Chunk 21) ───────────────────────────────────────────────
Route::get('/invoice/{encodeId}',      [PublicInvoiceController::class, 'show']);
Route::post('/invoice/{encodeId}/pay', [PublicInvoiceController::class, 'pay'])->middleware('throttle:payment');

// ─── Affiliate Signup (Chunk 22) ─────────────────────────────────────────────
Route::post('/affiliate/register', [AffiliateController::class, 'register'])->middleware('throttle:signup');

// ─── Partner / Venue / Planner Signup (Chunk 24) ─────────────────────────────
Route::post('/partner/register', [PartnerSignupController::class, 'register'])->middleware('throttle:signup');

// ─── Public Pages (Chunk 26) ─────────────────────────────────────────────────
Route::get('/pages/nav',     [PageController::class, 'nav']);
Route::get('/pages/{slug}',  [PageController::class, 'show']);

// ─── File downloads (Chunk 42) — auth enforced inside controller via middleware ─
// Requires auth:sanctum (admin or the lead's owner). We put it inside the
// sanctum group below to keep it consistent.

// ─── DocuSign Webhook (Chunk 41) ─────────────────────────────────────────────
// Must be public (no auth:sanctum) — DocuSign Connect posts without credentials.
Route::post('/webhooks/docusign', [DocuSignWebhookController::class, 'handle']);

// ─── Contact Form + Subscribe (Chunk 40) ─────────────────────────────────────
Route::post('/contact',   [ContactController::class, 'submit'])->middleware('throttle:60,1');
Route::post('/subscribe', [SubscriberController::class, 'subscribe'])->middleware('throttle:10,1');

// ─── Blog (Chunk 27) ─────────────────────────────────────────────────────────
Route::get('/blog',          [BlogController::class, 'index']);
Route::get('/blog/{slug}',   [BlogController::class, 'show']);

// ─── Protected Routes ────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Admin (Chunks 16–19, 32) ─────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Chunk 16: Dashboard
        Route::get('/stats', [DashboardController::class, 'stats']);

        // Chunk 20: Invoices
        Route::get('/invoices',          [InvoiceController::class, 'index']);
        Route::post('/invoices',         [InvoiceController::class, 'store']);
        Route::get('/invoices/{id}',     [InvoiceController::class, 'show']);
        Route::patch('/invoices/{id}',   [InvoiceController::class, 'update']);
        Route::delete('/invoices/{id}',  [InvoiceController::class, 'destroy']);

        // Chunks 18–19: Leads CRUD
        Route::get('/leads',                         [LeadController::class, 'index']);
        Route::get('/leads/{id}',                    [LeadController::class, 'show']);
        Route::patch('/leads/{id}',                  [LeadController::class, 'update']);
        Route::post('/leads/{id}/notes',             [LeadController::class, 'storeNote']);

        // Chunk 27: Blog admin
        Route::get('/blog',           [BlogController::class, 'adminIndex']);
        Route::post('/blog',          [BlogController::class, 'store']);
        Route::get('/blog/{id}',      [BlogController::class, 'adminShow']);
        Route::patch('/blog/{id}',    [BlogController::class, 'update']);
        Route::delete('/blog/{id}',   [BlogController::class, 'destroy']);

        // Chunk 41: DocuSign
        Route::post('/leads/{id}/docusign/send',   [DocuSignController::class, 'send']);
        Route::get('/leads/{id}/docusign/status',  [DocuSignController::class, 'status']);

        // Chunk 42: PDF generation triggers
        Route::post('/leads/{id}/generate-pdf',      [PdfController::class, 'generate']);
        Route::post('/leads/{id}/generate-pdf/coi',  [PdfController::class, 'generateCoi']);
        Route::get('/leads/{id}/pdf-status',         [PdfController::class, 'status']);

        // Chunk 45: Lead Assignments
        Route::get('/assignable-users',                              [LeadAssignmentController::class, 'assignableUsers']);
        Route::get('/leads/{id}/assignments',                        [LeadAssignmentController::class, 'index']);
        Route::post('/leads/{id}/assignments',                       [LeadAssignmentController::class, 'store']);
        Route::delete('/leads/{id}/assignments/{userId}',            [LeadAssignmentController::class, 'destroy']);

        // Chunk 36: User management
        Route::get('/users/roles',          [UserController::class, 'roles']);
        Route::get('/users',                [UserController::class, 'index']);
        Route::post('/users',               [UserController::class, 'store']);
        Route::get('/users/{id}',           [UserController::class, 'show']);
        Route::patch('/users/{id}',         [UserController::class, 'update']);
        Route::delete('/users/{id}',        [UserController::class, 'destroy']);

        // Chunk 39: Email templates
        Route::get('/email-templates',                 [EmailTemplateController::class, 'index']);
        Route::post('/email-templates',                [EmailTemplateController::class, 'store']);
        Route::get('/email-templates/{id}',            [EmailTemplateController::class, 'show']);
        Route::patch('/email-templates/{id}',          [EmailTemplateController::class, 'update']);
        Route::delete('/email-templates/{id}',         [EmailTemplateController::class, 'destroy']);
        Route::post('/email-templates/{id}/send-test', [EmailTemplateController::class, 'sendTest']);

        // Chunk 37: Payroll — summary first to avoid {id} capture
        Route::get('/payroll/summary',    [PayrollController::class, 'summary']);
        Route::get('/payroll',            [PayrollController::class, 'index']);
        Route::post('/payroll/bulk-pay',  [PayrollController::class, 'bulkMarkPaid']);
        Route::patch('/payroll/{id}/pay', [PayrollController::class, 'markPaid']);

        // Chunk 38: W9 admin — global list + per-user history + verify
        Route::get('/w9',                           [W9Controller::class, 'adminIndex']);
        Route::get('/users/{userId}/w9',            [W9Controller::class, 'adminShow']);
        Route::patch('/users/{userId}/w9/verify',   [W9Controller::class, 'verify']);

        // Chunk 40: Admin Pages CRUD + Subscribers
        Route::post('/pages/reorder',       [AdminPageController::class, 'reorder']);
        Route::get('/pages',                [AdminPageController::class, 'index']);
        Route::post('/pages',               [AdminPageController::class, 'store']);
        Route::get('/pages/{id}',           [AdminPageController::class, 'show']);
        Route::patch('/pages/{id}',         [AdminPageController::class, 'update']);
        Route::delete('/pages/{id}',        [AdminPageController::class, 'destroy']);

        Route::get('/subscribers/export',   [AdminSubscriberController::class, 'export']);
        Route::get('/subscribers',          [AdminSubscriberController::class, 'index']);
        Route::delete('/subscribers/{id}',  [AdminSubscriberController::class, 'destroy']);

        // Chunk 43: Rate Import
        Route::get('/rates/stats',            [RateImportController::class, 'stats']);
        Route::get('/rates/template',         [RateImportController::class, 'rateTemplate']);
        Route::get('/rates/template/gl',      [RateImportController::class, 'glLimitsTemplate']);
        Route::post('/rates/import',          [RateImportController::class, 'importRates']);
        Route::post('/rates/import/gl',       [RateImportController::class, 'importGlLimits']);
    });

    // ── Affiliate Portal (Chunk 23) ──────────────────────────────────────────
    Route::middleware('affiliate')->prefix('affiliate')->group(function () {
        Route::get('/stats',     [PortalController::class, 'stats']);
        Route::get('/referrals', [PortalController::class, 'referrals']);
        Route::get('/payouts',   [PortalController::class, 'payouts']);
    });

    // ── Agent Portal (Chunk 34) ──────────────────────────────────────────────
    Route::middleware('agent')->prefix('agent')->group(function () {
        Route::get('/dashboard',            [AgentPortalController::class, 'dashboard']);
        Route::get('/leads',                [AgentPortalController::class, 'leads']);
        Route::get('/leads/{id}',           [AgentPortalController::class, 'show']);
        Route::patch('/leads/{id}',         [AgentPortalController::class, 'update']);
        Route::post('/leads/{id}/notes',    [AgentPortalController::class, 'storeNote']);
        Route::get('/commissions',          [AgentPortalController::class, 'commissions']);
    });

    // ── Planner Portal (Chunk 35) ───────────────────────────────────────────
    Route::middleware('planner')->prefix('planner')->group(function () {
        Route::get('/dashboard',    [PlannerPortalController::class, 'dashboard']);
        Route::get('/referrals',    [PlannerPortalController::class, 'referrals']);
        Route::get('/commissions',  [PlannerPortalController::class, 'commissions']);
    });

    // ── Customer Portal (Chunk 33) ───────────────────────────────────────────
    Route::middleware('customer')->prefix('customer')->group(function () {
        Route::get('/dashboard',              [CustomerPortalController::class, 'dashboard']);
        Route::get('/events',                 [CustomerPortalController::class, 'events']);
        Route::get('/events/{id}/certificate',[CustomerPortalController::class, 'certificate']);
        Route::get('/invoices',               [CustomerPortalController::class, 'invoices']);
        Route::get('/referral-link',          [CustomerPortalController::class, 'referralLink']);
    });

    // ── File downloads (Chunk 42) — any authenticated user ───────────────────
    Route::get('/files/{category}/{id}', [FileController::class, 'download']);

    // ── W9 Upload Portal (Chunk 32) — any authenticated user ─────────────────
    Route::prefix('w9')->group(function () {
        Route::post('/',              [W9Controller::class, 'store']);    // upload PDF
        Route::get('/',               [W9Controller::class, 'show']);     // current status
        Route::get('/download/{id}',  [W9Controller::class, 'download']); // stream / presign
    });

    // ── Commissions Portal (Chunk 32) — any authenticated user ───────────────
    Route::prefix('commissions')->group(function () {
        Route::get('/',         [CommissionController::class, 'index']);   // paginated list
        Route::get('/summary',  [CommissionController::class, 'summary']); // totals widget
    });
});
