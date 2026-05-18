<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Admin Payroll.
 *
 * Covers:
 *   - Access control
 *   - Index: list, filter by type, status, user_id, date range
 *   - Summary: totals and breakdown
 *   - Mark paid (single): success, already-paid guard, 404, validation
 *   - Bulk mark paid: success, skip already-paid
 */
class AdminPayrollTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_payroll(): void
    {
        $this->getJson('/api/admin/payroll')->assertUnauthorized();
    }

    public function test_non_admin_cannot_access_payroll(): void
    {
        $affiliate = $this->makeUser(6);
        $this->actingAs($affiliate)->getJson('/api/admin/payroll')->assertForbidden();
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_commissions(): void
    {
        $admin = $this->makeUser(1);
        Commission::factory()->count(5)->create();

        $this->actingAs($admin)->getJson('/api/admin/payroll')
             ->assertOk()
             ->assertJsonStructure(['data', 'total', 'current_page', 'last_page']);
    }

    public function test_commissions_can_be_filtered_by_type(): void
    {
        $admin = $this->makeUser(1);
        $user  = $this->makeUser(6);
        $lead  = Lead::factory()->create();

        Commission::factory()->create(['user_id' => $user->id, 'lead_id' => $lead->id, 'type' => 'affiliate']);
        Commission::factory()->create(['user_id' => $user->id, 'lead_id' => Lead::factory()->create()->id, 'type' => 'planner']);

        $this->actingAs($admin)->getJson('/api/admin/payroll?type=affiliate')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_commissions_can_be_filtered_by_status(): void
    {
        $admin = $this->makeUser(1);

        Commission::factory()->count(3)->create(['status' => 'accrued']);
        Commission::factory()->count(2)->paid()->create();

        $this->actingAs($admin)->getJson('/api/admin/payroll?status=accrued')
             ->assertOk()
             ->assertJsonPath('total', 3);
    }

    public function test_commissions_can_be_filtered_by_user_id(): void
    {
        $admin      = $this->makeUser(1);
        $targetUser = $this->makeUser(7);

        Commission::factory()->count(2)->create(['user_id' => $targetUser->id]);
        Commission::factory()->count(3)->create(); // other users

        $this->actingAs($admin)->getJson("/api/admin/payroll?user_id={$targetUser->id}")
             ->assertOk()
             ->assertJsonPath('total', 2);
    }

    public function test_commissions_can_be_filtered_by_date_range(): void
    {
        $admin = $this->makeUser(1);

        Commission::factory()->create(['accrued_at' => '2025-01-15 00:00:00']);
        Commission::factory()->create(['accrued_at' => '2025-03-10 00:00:00']);
        Commission::factory()->create(['accrued_at' => '2025-06-01 00:00:00']);

        $this->actingAs($admin)->getJson('/api/admin/payroll?from=2025-02-01&to=2025-04-30')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    public function test_admin_can_get_payroll_summary(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->getJson('/api/admin/payroll/summary')
             ->assertOk()
             ->assertJsonStructure(['total_accrued', 'total_paid', 'by_type']);
    }

    public function test_summary_reflects_totals_correctly(): void
    {
        $admin = $this->makeUser(1);

        Commission::factory()->create(['amount' => 10.00, 'status' => 'accrued']);
        Commission::factory()->create(['amount' => 15.00, 'status' => 'accrued']);
        Commission::factory()->paid()->create(['amount' => 20.00]);

        $response = $this->actingAs($admin)->getJson('/api/admin/payroll/summary')
             ->assertOk();

        $this->assertEquals('25.00', $response->json('total_accrued'));
        $this->assertEquals('20.00', $response->json('total_paid'));
    }

    // ── Mark paid (single) ────────────────────────────────────────────────────

    public function test_admin_can_mark_commission_paid(): void
    {
        $admin      = $this->makeUser(1);
        $commission = Commission::factory()->create(['status' => 'accrued']);

        $this->actingAs($admin)->patchJson("/api/admin/payroll/{$commission->id}/pay", [
            'paid_method' => 'Zelle',
            'paid_note'   => 'Paid via Zelle transfer.',
        ])
             ->assertOk()
             ->assertJsonPath('status', 'paid')
             ->assertJsonPath('paid_method', 'Zelle');

        $this->assertDatabaseHas('commissions', [
            'id'          => $commission->id,
            'status'      => 'paid',
            'paid_method' => 'Zelle',
        ]);

        $this->assertNotNull(Commission::find($commission->id)->paid_at);
    }

    public function test_mark_paid_requires_valid_method(): void
    {
        $admin      = $this->makeUser(1);
        $commission = Commission::factory()->create();

        $this->actingAs($admin)->patchJson("/api/admin/payroll/{$commission->id}/pay", [
            'paid_method' => 'Bitcoin', // invalid
        ])->assertUnprocessable();
    }

    public function test_cannot_mark_already_paid_commission(): void
    {
        $admin      = $this->makeUser(1);
        $commission = Commission::factory()->paid()->create();

        $this->actingAs($admin)->patchJson("/api/admin/payroll/{$commission->id}/pay", [
            'paid_method' => 'Check',
        ])->assertUnprocessable();
    }

    public function test_mark_paid_returns_404_for_nonexistent(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->patchJson('/api/admin/payroll/99999/pay', [
            'paid_method' => 'ACH',
        ])->assertNotFound();
    }

    // ── Bulk mark paid ────────────────────────────────────────────────────────

    public function test_admin_can_bulk_mark_commissions_paid(): void
    {
        $admin = $this->makeUser(1);

        $c1 = Commission::factory()->create(['status' => 'accrued']);
        $c2 = Commission::factory()->create(['status' => 'accrued']);
        $c3 = Commission::factory()->create(['status' => 'accrued']);

        $this->actingAs($admin)->postJson('/api/admin/payroll/bulk-pay', [
            'ids'         => [$c1->id, $c2->id, $c3->id],
            'paid_method' => 'ACH',
        ])
             ->assertOk()
             ->assertJsonPath('paid_count', 3);

        foreach ([$c1->id, $c2->id, $c3->id] as $id) {
            $this->assertDatabaseHas('commissions', ['id' => $id, 'status' => 'paid']);
        }
    }

    public function test_bulk_pay_skips_already_paid_commissions(): void
    {
        $admin     = $this->makeUser(1);
        $accrued   = Commission::factory()->create(['status' => 'accrued']);
        $alreadyPaid = Commission::factory()->paid()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/payroll/bulk-pay', [
            'ids'         => [$accrued->id, $alreadyPaid->id],
            'paid_method' => 'Wire',
        ])->assertOk();

        // Only the accrued one gets counted
        $this->assertEquals(1, $response->json('paid_count'));
    }

    public function test_bulk_pay_requires_valid_method(): void
    {
        $admin = $this->makeUser(1);
        $c     = Commission::factory()->create();

        $this->actingAs($admin)->postJson('/api/admin/payroll/bulk-pay', [
            'ids'         => [$c->id],
            'paid_method' => 'Cash', // invalid
        ])->assertUnprocessable();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
}
