<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use App\Models\W9Upload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Feature tests for Customer Portal.
 *
 * Covers:
 *   - RequireCustomerAccess middleware enforcement
 *   - Dashboard summary counts
 *   - Events (policies) — scoped to owner only
 *   - Certificate stub endpoint
 *   - Invoices — scoped to owner only, with pay_url
 *   - Referral link + earnings (W9-gated amounts)
 *   - Data isolation: other customers' data is never reachable
 */
class CustomerPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Middleware ─────────────────────────────────────────────────────────────

    public function test_unauthenticated_user_cannot_access_customer_routes(): void
    {
        $this->getJson('/api/customer/dashboard')->assertUnauthorized();
    }

    public function test_non_customer_cannot_access_customer_routes(): void
    {
        $affiliate = $this->makeUser(6); // affiliate, not customer

        $this->actingAs($affiliate)->getJson('/api/customer/dashboard')->assertForbidden();
    }

    public function test_admin_cannot_access_customer_routes(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->getJson('/api/customer/dashboard')->assertForbidden();
    }

    // ── Dashboard ──────────────────────────────────────────────────────────────

    public function test_customer_can_view_dashboard(): void
    {
        $customer = $this->makeUser(5);

        $this->actingAs($customer)->getJson('/api/customer/dashboard')
             ->assertOk()
             ->assertJsonStructure([
                 'policies_count', 'open_invoices_count',
                 'commissions_count', 'pending_commission', 'w9_verified',
             ]);
    }

    public function test_dashboard_counts_policies_for_this_customer_only(): void
    {
        $customer = $this->makeUser(5);
        $other    = $this->makeUser(5);

        // Customer has 2 purchased leads
        Lead::factory()->count(2)->create([
            'user_id'           => $customer->id,
            'submission_status' => 'payment_received',
        ]);

        // Another customer's lead — must NOT be counted
        Lead::factory()->create([
            'user_id'           => $other->id,
            'submission_status' => 'payment_received',
        ]);

        $this->actingAs($customer)->getJson('/api/customer/dashboard')
             ->assertOk()
             ->assertJsonPath('policies_count', 2);
    }

    public function test_dashboard_counts_open_invoices(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['user_id' => $customer->id]);

        // 2 open + 1 paid invoices
        Invoice::factory()->count(2)->create([
            'lead_id'        => $lead->id,
            'invoice_status' => Invoice::STATUS_UNPAID,
        ]);
        Invoice::factory()->create([
            'lead_id'        => $lead->id,
            'invoice_status' => Invoice::STATUS_PAID,
        ]);

        $this->actingAs($customer)->getJson('/api/customer/dashboard')
             ->assertOk()
             ->assertJsonPath('open_invoices_count', 2);
    }

    public function test_dashboard_pending_commission_is_null_without_w9(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['referred_by_customer_id' => $customer->id]);

        Commission::create([
            'user_id'    => $customer->id,
            'lead_id'    => $lead->id,
            'amount'     => '5.00',
            'type'       => 'customer',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($customer)->getJson('/api/customer/dashboard')
             ->assertOk()
             ->assertJsonPath('pending_commission', null)
             ->assertJsonPath('w9_verified', false);
    }

    public function test_dashboard_pending_commission_visible_with_verified_w9(): void
    {
        $admin    = $this->makeUser(1);
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['referred_by_customer_id' => $customer->id]);

        Commission::create([
            'user_id'    => $customer->id,
            'lead_id'    => $lead->id,
            'amount'     => '5.00',
            'type'       => 'customer',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        W9Upload::create([
            'user_id'     => $customer->id,
            'file_path'   => 'referrals/test.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 512,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $this->actingAs($customer)->getJson('/api/customer/dashboard')
             ->assertOk()
             ->assertJsonPath('pending_commission', 5)  // JSON encodes 5.0 as integer 5
             ->assertJsonPath('w9_verified', true);
    }

    // ── Events (policies) ─────────────────────────────────────────────────────

    public function test_customer_can_list_their_events(): void
    {
        $customer = $this->makeUser(5);
        Lead::factory()->count(3)->create([
            'user_id'           => $customer->id,
            'submission_status' => 'payment_received',
        ]);

        $response = $this->actingAs($customer)->getJson('/api/customer/events');

        $response->assertOk()
                 ->assertJsonPath('total', 3);
    }

    public function test_events_only_shows_payment_received_leads(): void
    {
        $customer = $this->makeUser(5);

        Lead::factory()->create([
            'user_id'           => $customer->id,
            'submission_status' => 'payment_received',
        ]);
        // These should be excluded
        Lead::factory()->create([
            'user_id'           => $customer->id,
            'submission_status' => 'tried',
        ]);
        Lead::factory()->create([
            'user_id'           => $customer->id,
            'submission_status' => 'payment',
        ]);

        $this->actingAs($customer)->getJson('/api/customer/events')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_events_response_includes_certificate_url(): void
    {
        $customer = $this->makeUser(5);
        Lead::factory()->create([
            'user_id'           => $customer->id,
            'submission_status' => 'payment_received',
        ]);

        $response = $this->actingAs($customer)->getJson('/api/customer/events');

        $response->assertOk();
        $this->assertStringContainsString('certificate', $response->json('data.0.certificate_url'));
    }

    public function test_events_does_not_show_other_customers_leads(): void
    {
        $customer = $this->makeUser(5);
        $other    = $this->makeUser(5);

        Lead::factory()->create([
            'user_id'           => $other->id,
            'submission_status' => 'payment_received',
        ]);

        $this->actingAs($customer)->getJson('/api/customer/events')
             ->assertOk()
             ->assertJsonPath('total', 0);
    }

    public function test_events_matches_by_email_when_no_user_id(): void
    {
        $customer = $this->makeUser(5);

        // Lead created without user_id (pre-account purchase), but matching email
        Lead::factory()->create([
            'user_id'           => null,
            'email'             => $customer->email,
            'submission_status' => 'payment_received',
        ]);

        $this->actingAs($customer)->getJson('/api/customer/events')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    // ── Certificate ─────────────────────────────────────────────────────────────

    public function test_certificate_endpoint_returns_202_when_coi_not_ready(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create([
            'user_id'           => $customer->id,
            'submission_status' => 'payment_received',
            'coi_pdf_path'      => null,
        ]);

        $this->actingAs($customer)->getJson("/api/customer/events/{$lead->id}/certificate")
             ->assertStatus(202)
             ->assertJsonPath('ready', false)
             ->assertJsonPath('lead_id', $lead->id);
    }

    public function test_certificate_endpoint_streams_pdf_when_ready(): void
    {
        $customer = $this->makeUser(5);
        $path     = 'cois/filled_claims/cust-coi.pdf';
        Storage::disk('local')->put($path, '%PDF stub content');

        $lead = Lead::factory()->create([
            'user_id'           => $customer->id,
            'submission_status' => 'payment_received',
            'coi_pdf_path'      => $path,
        ]);

        $this->actingAs($customer)->get("/api/customer/events/{$lead->id}/certificate")
             ->assertOk()
             ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_certificate_endpoint_denies_access_to_other_customers_lead(): void
    {
        $customer = $this->makeUser(5);
        $other    = $this->makeUser(5);
        $lead     = Lead::factory()->create([
            'user_id'           => $other->id,
            'submission_status' => 'payment_received',
        ]);

        $this->actingAs($customer)->getJson("/api/customer/events/{$lead->id}/certificate")
             ->assertNotFound();
    }

    // ── Invoices ───────────────────────────────────────────────────────────────

    public function test_customer_can_list_their_invoices(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['user_id' => $customer->id]);

        Invoice::factory()->count(3)->create(['lead_id' => $lead->id]);

        $this->actingAs($customer)->getJson('/api/customer/invoices')
             ->assertOk()
             ->assertJsonPath('total', 3);
    }

    public function test_invoice_response_includes_pay_url(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['user_id' => $customer->id]);
        Invoice::factory()->create([
            'lead_id'    => $lead->id,
            'encode_id'  => 'ABC123',
        ]);

        $response = $this->actingAs($customer)->getJson('/api/customer/invoices');

        $response->assertOk();
        $this->assertStringContainsString('ABC123', $response->json('data.0.pay_url'));
    }

    public function test_invoices_filter_by_status_open(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['user_id' => $customer->id]);

        Invoice::factory()->create(['lead_id' => $lead->id, 'invoice_status' => Invoice::STATUS_UNPAID]);
        Invoice::factory()->create(['lead_id' => $lead->id, 'invoice_status' => Invoice::STATUS_PAID]);

        $this->actingAs($customer)->getJson('/api/customer/invoices?status=open')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_invoices_do_not_show_other_customers_invoices(): void
    {
        $customer = $this->makeUser(5);
        $other    = $this->makeUser(5);
        $otherLead = Lead::factory()->create(['user_id' => $other->id]);

        Invoice::factory()->count(2)->create(['lead_id' => $otherLead->id]);

        $this->actingAs($customer)->getJson('/api/customer/invoices')
             ->assertOk()
             ->assertJsonPath('total', 0);
    }

    // ── Referral link ──────────────────────────────────────────────────────────

    public function test_referral_link_contains_user_id(): void
    {
        $customer = $this->makeUser(5);

        $response = $this->actingAs($customer)->getJson('/api/customer/referral-link');

        $response->assertOk();
        $link = $response->json('referral_link');
        $this->assertStringContainsString((string) $customer->id, $link);
        $this->assertStringContainsString('ref_customer=', $link);
    }

    public function test_referral_link_shows_correct_commission_per_referral(): void
    {
        $customer = $this->makeUser(5);

        $this->actingAs($customer)->getJson('/api/customer/referral-link')
             ->assertOk()
             ->assertJsonPath('commission_per_referral', 5);  // JSON encodes 5.0 as integer 5
    }

    public function test_referral_counts_only_paid_referrals(): void
    {
        $customer = $this->makeUser(5);

        // 2 completed referrals
        Lead::factory()->count(2)->create([
            'referred_by_customer_id' => $customer->id,
            'submission_status'       => 'payment_received',
        ]);
        // 1 incomplete — should not count
        Lead::factory()->create([
            'referred_by_customer_id' => $customer->id,
            'submission_status'       => 'tried',
        ]);

        $this->actingAs($customer)->getJson('/api/customer/referral-link')
             ->assertOk()
             ->assertJsonPath('referrals_count', 2);
    }

    public function test_referral_earnings_hidden_without_verified_w9(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['referred_by_customer_id' => $customer->id]);

        Commission::create([
            'user_id'    => $customer->id,
            'lead_id'    => $lead->id,
            'amount'     => '5.00',
            'type'       => 'customer',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($customer)->getJson('/api/customer/referral-link')
             ->assertOk()
             ->assertJsonPath('earnings.total', null)
             ->assertJsonPath('w9_verified', false);
    }

    public function test_referral_earnings_visible_with_verified_w9(): void
    {
        $admin    = $this->makeUser(1);
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['referred_by_customer_id' => $customer->id]);

        Commission::create([
            'user_id'    => $customer->id,
            'lead_id'    => $lead->id,
            'amount'     => '5.00',
            'type'       => 'customer',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        W9Upload::create([
            'user_id'     => $customer->id,
            'file_path'   => 'referrals/test.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 512,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $this->actingAs($customer)->getJson('/api/customer/referral-link')
             ->assertOk()
             ->assertJsonPath('earnings.total', 5)  // JSON encodes 5.0 as integer 5
             ->assertJsonPath('w9_verified', true);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function seedRoles(): void
    {
        foreach ([
            0 => 'Super Admin', 1 => 'Admin', 2 => 'Staff',
            5 => 'Customer', 6 => 'Affiliate', 7 => 'Agent', 8 => 'Planner',
        ] as $level => $name) {
            UserRole::firstOrCreate(
                ['access_level' => $level],
                ['role_name'    => $name]
            );
        }
    }

    private function makeUser(int $accessLevel, array $extra = []): User
    {
        $role = UserRole::where('access_level', $accessLevel)->first();
        return User::factory()->create(array_merge(['role_id' => $role->id, 'status' => 1], $extra));
    }
}
