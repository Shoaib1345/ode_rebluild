<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use App\Models\W9Upload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Chunk 35 — Planner Portal.
 *
 * Covers:
 *   - RequirePlannerAccess middleware
 *   - Dashboard KPI counts scoped to planner's referral_string
 *   - Commission_per_referral = 15 constant
 *   - W9 gate on commission amounts
 *   - Referrals list scoped + filterable
 *   - Commission list scoped + W9-gated
 *   - Data isolation: planner cannot see other planners' referrals
 */
class PlannerPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Middleware ─────────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_planner_routes(): void
    {
        $this->getJson('/api/planner/dashboard')->assertUnauthorized();
    }

    public function test_non_planner_cannot_access_planner_routes(): void
    {
        $customer = $this->makeUser(5);
        $this->actingAs($customer)->getJson('/api/planner/dashboard')->assertForbidden();
    }

    public function test_admin_cannot_access_planner_routes(): void
    {
        $admin = $this->makeUser(1);
        $this->actingAs($admin)->getJson('/api/planner/dashboard')->assertForbidden();
    }

    public function test_agent_cannot_access_planner_routes(): void
    {
        $agent = $this->makeUser(7);
        $this->actingAs($agent)->getJson('/api/planner/dashboard')->assertForbidden();
    }

    // ── Dashboard ──────────────────────────────────────────────────────────────

    public function test_planner_can_view_dashboard(): void
    {
        $planner = $this->makePlanner();

        $this->actingAs($planner)->getJson('/api/planner/dashboard')
             ->assertOk()
             ->assertJsonStructure([
                 'referral_string',
                 'commission_per_referral',
                 'referrals' => ['total', 'paid', 'this_month', 'paid_month'],
                 'commissions' => ['count', 'pending', 'paid'],
                 'w9_verified',
             ]);
    }

    public function test_dashboard_commission_per_referral_is_15(): void
    {
        $planner = $this->makePlanner();

        $this->actingAs($planner)->getJson('/api/planner/dashboard')
             ->assertOk()
             ->assertJsonPath('commission_per_referral', 15);
    }

    public function test_dashboard_counts_only_own_referrals(): void
    {
        $planner = $this->makePlanner(['referral_string' => 'REF-PLANNER']);
        $other   = $this->makePlanner(['referral_string' => 'REF-OTHER']);

        // 3 leads for this planner
        Lead::factory()->count(3)->create([
            'referral_string'   => 'REF-PLANNER',
            'submission_status' => 'payment_received',
            'status'            => 1,
        ]);

        // 2 leads for another planner — must not be counted
        Lead::factory()->count(2)->create([
            'referral_string'   => 'REF-OTHER',
            'submission_status' => 'payment_received',
            'status'            => 1,
        ]);

        $this->actingAs($planner)->getJson('/api/planner/dashboard')
             ->assertOk()
             ->assertJsonPath('referrals.total', 3)
             ->assertJsonPath('referrals.paid', 3);
    }

    public function test_dashboard_commission_hidden_without_w9(): void
    {
        $planner = $this->makePlanner(['referral_string' => 'REF-P1']);
        $lead    = Lead::factory()->create(['submission_status' => 'payment_received']);

        Commission::create([
            'user_id'    => $planner->id,
            'lead_id'    => $lead->id,
            'amount'     => '15.00',
            'type'       => 'planner',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($planner)->getJson('/api/planner/dashboard')
             ->assertOk()
             ->assertJsonPath('commissions.pending', null)
             ->assertJsonPath('commissions.paid', null)
             ->assertJsonPath('w9_verified', false);
    }

    public function test_dashboard_commission_visible_with_verified_w9(): void
    {
        $admin   = $this->makeUser(1);
        $planner = $this->makePlanner(['referral_string' => 'REF-P2']);
        $lead    = Lead::factory()->create(['submission_status' => 'payment_received']);

        Commission::create([
            'user_id'    => $planner->id,
            'lead_id'    => $lead->id,
            'amount'     => '15.00',
            'type'       => 'planner',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        W9Upload::create([
            'user_id'     => $planner->id,
            'file_path'   => 'referrals/test.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 512,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $this->actingAs($planner)->getJson('/api/planner/dashboard')
             ->assertOk()
             ->assertJsonPath('commissions.pending', 15)
             ->assertJsonPath('w9_verified', true);
    }

    // ── Referrals ──────────────────────────────────────────────────────────────

    public function test_planner_can_list_referrals(): void
    {
        $planner = $this->makePlanner(['referral_string' => 'REF-LIST']);

        Lead::factory()->count(4)->create([
            'referral_string' => 'REF-LIST',
            'status'          => 1,
        ]);

        $this->actingAs($planner)->getJson('/api/planner/referrals')
             ->assertOk()
             ->assertJsonPath('total', 4);
    }

    public function test_referrals_excludes_other_planners_leads(): void
    {
        $planner = $this->makePlanner(['referral_string' => 'REF-MINE']);
        $other   = $this->makePlanner(['referral_string' => 'REF-THEIRS']);

        Lead::factory()->create(['referral_string' => 'REF-MINE',   'status' => 1]);
        Lead::factory()->create(['referral_string' => 'REF-THEIRS', 'status' => 1]);
        Lead::factory()->create(['status' => 1]); // no referral

        $this->actingAs($planner)->getJson('/api/planner/referrals')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_referrals_can_be_filtered_by_status(): void
    {
        $planner = $this->makePlanner(['referral_string' => 'REF-FLT']);

        Lead::factory()->create([
            'referral_string'   => 'REF-FLT',
            'submission_status' => 'payment_received',
            'status'            => 1,
        ]);
        Lead::factory()->create([
            'referral_string'   => 'REF-FLT',
            'submission_status' => 'tried',
            'status'            => 1,
        ]);

        $this->actingAs($planner)->getJson('/api/planner/referrals?status=payment_received')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    // ── Commissions ────────────────────────────────────────────────────────────

    public function test_planner_commissions_hidden_without_w9(): void
    {
        $planner = $this->makePlanner();
        $lead    = Lead::factory()->create();

        Commission::create([
            'user_id'    => $planner->id,
            'lead_id'    => $lead->id,
            'amount'     => '15.00',
            'type'       => 'planner',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($planner)->getJson('/api/planner/commissions')
             ->assertOk()
             ->assertJsonPath('w9_verified', false)
             ->assertJsonPath('commissions.data.0.amount', null);
    }

    public function test_planner_commissions_visible_with_verified_w9(): void
    {
        $admin   = $this->makeUser(1);
        $planner = $this->makePlanner();
        $lead    = Lead::factory()->create();

        Commission::create([
            'user_id'    => $planner->id,
            'lead_id'    => $lead->id,
            'amount'     => '15.00',
            'type'       => 'planner',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        W9Upload::create([
            'user_id'     => $planner->id,
            'file_path'   => 'referrals/test.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 512,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $this->actingAs($planner)->getJson('/api/planner/commissions')
             ->assertOk()
             ->assertJsonPath('w9_verified', true)
             ->assertJsonPath('commissions.data.0.amount', '15.00');
    }

    public function test_planner_cannot_see_other_planners_commissions(): void
    {
        $planner = $this->makePlanner();
        $other   = $this->makePlanner();
        $lead    = Lead::factory()->create();

        Commission::create([
            'user_id'    => $other->id,
            'lead_id'    => $lead->id,
            'amount'     => '15.00',
            'type'       => 'planner',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($planner)->getJson('/api/planner/commissions')
             ->assertOk()
             ->assertJsonPath('commissions.total', 0);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function seedRoles(): void
    {
        foreach ([
            0 => 'Super Admin', 1 => 'Admin', 2 => 'Staff',
            5 => 'Customer', 6 => 'Affiliate', 7 => 'Agent', 8 => 'Planner',
        ] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function makeUser(int $level, array $extra = []): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(array_merge(['role_id' => $role->id, 'status' => 1], $extra));
    }

    private function makePlanner(array $extra = []): User
    {
        return $this->makeUser(8, array_merge(
            ['referral_string' => 'REF-' . strtoupper(substr(uniqid(), -6))],
            $extra
        ));
    }
}
