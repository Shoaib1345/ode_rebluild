<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use App\Services\CommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for CommissionService — every commission type and idempotency guard.
 *
 * All amounts per FULL-SPEC-V2.md §25:
 *   affiliate = $10  |  planner = $15  |  customer = $5
 *   agent = (premium × pct / 100) + flat
 */
class CommissionServiceTest extends TestCase
{
    use RefreshDatabase;

    private CommissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(CommissionService::class);
        $this->seedRoles();
    }

    // ── Affiliate ($10) ────────────────────────────────────────────────────────

    public function test_accrue_affiliate_by_fk(): void
    {
        $affiliate = $this->makeUser(6);
        $lead      = $this->makeLead(['referred_by_affiliate_id' => $affiliate->id]);

        $commission = $this->service->accrueAffiliate($lead);

        $this->assertNotNull($commission);
        $this->assertEquals('10.00', $commission->amount);
        $this->assertEquals('affiliate', $commission->type);
        $this->assertEquals('accrued', $commission->status);
        $this->assertEquals($affiliate->id, $commission->user_id);
        $this->assertEquals($lead->id, $commission->lead_id);
    }

    public function test_accrue_affiliate_by_referral_string_fallback(): void
    {
        $affiliate = $this->makeUser(6, ['referral_string' => 'MYCODE123']);
        $lead      = $this->makeLead(['affiliate_string' => 'MYCODE123']);

        $commission = $this->service->accrueAffiliate($lead);

        $this->assertNotNull($commission);
        $this->assertEquals('10.00', $commission->amount);
        $this->assertEquals($affiliate->id, $commission->user_id);
    }

    public function test_accrue_affiliate_returns_null_when_no_referral(): void
    {
        $lead = $this->makeLead();

        $result = $this->service->accrueAffiliate($lead);

        $this->assertNull($result);
        $this->assertEquals(0, Commission::where('lead_id', $lead->id)->count());
    }

    public function test_accrue_affiliate_uses_configured_flat_rate(): void
    {
        $affiliate = $this->makeUser(6, ['commission_flat' => 25.00]);
        $lead      = $this->makeLead(['referred_by_affiliate_id' => $affiliate->id]);

        $commission = $this->service->accrueAffiliate($lead);

        $this->assertEquals('25.00', $commission->amount); // configured flat overrides $10 default
    }

    public function test_accrue_affiliate_uses_configured_percentage(): void
    {
        $affiliate = $this->makeUser(6, ['commission_pct' => 12.00]);
        $lead      = $this->makeLeadWithPlans([
            'premium'                  => 200,
            'referred_by_affiliate_id' => $affiliate->id,
        ]);

        $commission = $this->service->accrueAffiliate($lead);

        $this->assertEquals('24.00', $commission->amount); // 200 × 12/100
    }

    // ── Agent (% + flat) ───────────────────────────────────────────────────────

    public function test_accrue_agent_with_pct_and_flat(): void
    {
        $agent = $this->makeUser(7, [
            'commission_pct'  => 10.00,  // 10%
            'commission_flat' => 5.00,   // + $5 flat
        ]);

        // premium = $100 → (100 × 10/100) + 5 = $15
        $lead = $this->makeLeadWithPlans(['premium' => 100]);
        $lead->assignedUsers()->attach($agent->id);

        $commissions = $this->service->accrueAgent($lead);

        $this->assertCount(1, $commissions);
        $this->assertEquals('15.00', $commissions[0]->amount);
        $this->assertEquals('agent', $commissions[0]->type);
    }

    public function test_accrue_agent_pct_only(): void
    {
        $agent = $this->makeUser(7, ['commission_pct' => 8.00, 'commission_flat' => 0]);

        // premium = $200 → (200 × 8/100) + 0 = $16
        $lead = $this->makeLeadWithPlans(['premium' => 200]);
        $lead->assignedUsers()->attach($agent->id);

        $commissions = $this->service->accrueAgent($lead);

        $this->assertEquals('16.00', $commissions[0]->amount);
    }

    public function test_accrue_agent_returns_empty_when_no_assigned_agent(): void
    {
        $lead   = $this->makeLeadWithPlans();
        $result = $this->service->accrueAgent($lead);

        $this->assertEmpty($result);
        $this->assertEquals(0, Commission::where('lead_id', $lead->id)->count());
    }

    // ── Planner ($15) ──────────────────────────────────────────────────────────

    public function test_accrue_planner(): void
    {
        $planner = $this->makeUser(8);
        $lead    = $this->makeLead(['referred_by_planner_id' => $planner->id]);

        $commission = $this->service->accruePlanner($lead);

        $this->assertNotNull($commission);
        $this->assertEquals('15.00', $commission->amount);
        $this->assertEquals('planner', $commission->type);
        $this->assertEquals($planner->id, $commission->user_id);
    }

    public function test_accrue_planner_returns_null_when_no_referral(): void
    {
        $lead   = $this->makeLead();
        $result = $this->service->accruePlanner($lead);

        $this->assertNull($result);
    }

    // ── Customer ($5) ──────────────────────────────────────────────────────────

    public function test_accrue_customer(): void
    {
        $customer = $this->makeUser(5);
        $lead     = $this->makeLead(['referred_by_customer_id' => $customer->id]);

        $commission = $this->service->accrueCustomer($lead);

        $this->assertNotNull($commission);
        $this->assertEquals('5.00', $commission->amount);
        $this->assertEquals('customer', $commission->type);
        $this->assertEquals($customer->id, $commission->user_id);
    }

    public function test_accrue_customer_returns_null_when_no_referral(): void
    {
        $lead   = $this->makeLead();
        $result = $this->service->accrueCustomer($lead);

        $this->assertNull($result);
    }

    // ── Idempotency ────────────────────────────────────────────────────────────

    public function test_affiliate_commission_is_idempotent(): void
    {
        $affiliate = $this->makeUser(6);
        $lead      = $this->makeLead(['referred_by_affiliate_id' => $affiliate->id]);

        // Call three times
        $this->service->accrueAffiliate($lead);
        $this->service->accrueAffiliate($lead);
        $this->service->accrueAffiliate($lead);

        // Only one row for this lead
        $this->assertEquals(1, Commission::where('lead_id', $lead->id)->count());
        $this->assertEquals('10.00', Commission::where('lead_id', $lead->id)->first()->amount);
    }

    public function test_planner_commission_is_idempotent(): void
    {
        $planner = $this->makeUser(8);
        $lead    = $this->makeLead(['referred_by_planner_id' => $planner->id]);

        $this->service->accruePlanner($lead);
        $this->service->accruePlanner($lead);

        $this->assertEquals(1, Commission::where('lead_id', $lead->id)->count());
    }

    public function test_customer_commission_is_idempotent(): void
    {
        $customer = $this->makeUser(5);
        $lead     = $this->makeLead(['referred_by_customer_id' => $customer->id]);

        $this->service->accrueCustomer($lead);
        $this->service->accrueCustomer($lead);

        $this->assertEquals(1, Commission::where('lead_id', $lead->id)->count());
    }

    // ── accrueAll ──────────────────────────────────────────────────────────────

    public function test_accrue_all_fires_all_commission_types(): void
    {
        $affiliate = $this->makeUser(6);
        $planner   = $this->makeUser(8);
        $customer  = $this->makeUser(5);
        $agent     = $this->makeUser(7, ['commission_pct' => 5.00, 'commission_flat' => 10.00]);

        $lead = $this->makeLeadWithPlans([
            'premium'                  => 120,
            'referred_by_affiliate_id' => $affiliate->id,
            'referred_by_planner_id'   => $planner->id,
            'referred_by_customer_id'  => $customer->id,
        ]);
        $lead->assignedUsers()->attach($agent->id);

        $this->service->accrueAll($lead);

        $commissions = Commission::where('lead_id', $lead->id)->get()->keyBy('type');

        $this->assertArrayHasKey('affiliate', $commissions);
        $this->assertArrayHasKey('planner',   $commissions);
        $this->assertArrayHasKey('customer',  $commissions);
        $this->assertArrayHasKey('agent',     $commissions);

        $this->assertEquals('10.00', $commissions['affiliate']->amount);
        $this->assertEquals('15.00', $commissions['planner']->amount);
        $this->assertEquals('5.00',  $commissions['customer']->amount);
        // agent: (120 × 5/100) + 10 = 6 + 10 = 16
        $this->assertEquals('16.00', $commissions['agent']->amount);
    }

    public function test_accrue_all_is_idempotent_when_called_twice(): void
    {
        $affiliate = $this->makeUser(6);
        $lead      = $this->makeLead(['referred_by_affiliate_id' => $affiliate->id]);

        $this->service->accrueAll($lead);
        $this->service->accrueAll($lead);

        // Only 1 affiliate commission row for this lead regardless of how many times called
        $this->assertEquals(1, Commission::where('lead_id', $lead->id)->count());
    }

    // ── Commission model helpers ───────────────────────────────────────────────

    public function test_commission_mark_paid(): void
    {
        $affiliate = $this->makeUser(6);
        $lead      = $this->makeLead(['referred_by_affiliate_id' => $affiliate->id]);
        $commission = $this->service->accrueAffiliate($lead);

        $commission->markPaid('Zelle', 'Q1 payout');

        $commission->refresh();
        $this->assertEquals('paid',   $commission->status);
        $this->assertEquals('Zelle',  $commission->paid_method);
        $this->assertEquals('Q1 payout', $commission->paid_note);
        $this->assertNotNull($commission->paid_at);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function seedRoles(): void
    {
        $levels = [
            0 => 'Super Admin',
            1 => 'Admin',
            2 => 'Staff',
            5 => 'Customer',
            6 => 'Affiliate',
            7 => 'Agent',
            8 => 'Planner',
        ];

        foreach ($levels as $level => $name) {
            UserRole::firstOrCreate(
                ['access_level' => $level],
                ['role_name'    => $name]
            );
        }
    }

    private function makeUser(int $accessLevel, array $extra = []): User
    {
        $role = UserRole::where('access_level', $accessLevel)->first();

        return User::factory()->create(array_merge([
            'role_id' => $role->id,
            'status'  => 1,
        ], $extra));
    }

    private function makeLead(array $extra = []): Lead
    {
        return Lead::factory()->create(array_merge([
            'submission_status' => 'payment_received',
            'status'            => 1,
        ], $extra));
    }

    private function makeLeadWithPlans(array $extra = []): Lead
    {
        $premium = $extra['premium'] ?? 100;
        unset($extra['premium']);

        return Lead::factory()->create(array_merge([
            'submission_status' => 'payment_received',
            'status'            => 1,
            'lead_offered_plans' => [
                'rate_id'        => 1,
                'carrier'        => 'ASI',
                'premium'        => $premium,
                'broker_fee'     => 20,
                'processing_fee' => 5,
                'extra_charge'   => 0,
                'total'          => $premium + 25,
                'min_limit'      => 1,
                'max_limit'      => 2,
            ],
        ], $extra));
    }
}
