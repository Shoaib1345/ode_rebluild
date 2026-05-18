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
 * Feature tests for Agent Portal.
 *
 * Covers:
 *   - RequireAgentAccess middleware
 *   - Dashboard KPI counts scoped to assigned leads
 *   - Leads list — scoped + filterable
 *   - Lead detail + data isolation
 *   - Update (status + on_hold only, no other fields)
 *   - Note creation on assigned leads
 *   - Commission list with W9 visibility gate
 *   - Data isolation: agents cannot access each other's leads or commissions
 */
class AgentPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Middleware ─────────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_agent_routes(): void
    {
        $this->getJson('/api/agent/dashboard')->assertUnauthorized();
    }

    public function test_non_agent_cannot_access_agent_routes(): void
    {
        $customer = $this->makeUser(5);
        $this->actingAs($customer)->getJson('/api/agent/dashboard')->assertForbidden();
    }

    public function test_admin_cannot_access_agent_routes(): void
    {
        $admin = $this->makeUser(1);
        $this->actingAs($admin)->getJson('/api/agent/dashboard')->assertForbidden();
    }

    // ── Dashboard ──────────────────────────────────────────────────────────────

    public function test_agent_can_view_dashboard(): void
    {
        $agent = $this->makeAgent();

        $this->actingAs($agent)->getJson('/api/agent/dashboard')
             ->assertOk()
             ->assertJsonStructure([
                 'leads'        => ['total', 'payment_received', 'finished', 'on_hold', 'by_status'],
                 'commissions'  => ['count', 'pending', 'paid'],
                 'w9_verified',
             ]);
    }

    public function test_dashboard_counts_only_assigned_leads(): void
    {
        $agent = $this->makeAgent();
        $other = $this->makeAgent();

        // 3 leads assigned to this agent
        $leads = Lead::factory()->count(3)->create(['submission_status' => 'payment_received']);
        foreach ($leads as $lead) {
            $lead->assignedUsers()->attach($agent->id);
        }

        // 1 lead assigned only to another agent — must not be counted
        $otherLead = Lead::factory()->create();
        $otherLead->assignedUsers()->attach($other->id);

        $this->actingAs($agent)->getJson('/api/agent/dashboard')
             ->assertOk()
             ->assertJsonPath('leads.total', 3)
             ->assertJsonPath('leads.payment_received', 3);
    }

    public function test_dashboard_commission_pending_hidden_without_w9(): void
    {
        $agent = $this->makeAgent(['commission_pct' => 10, 'commission_flat' => 5]);
        $lead  = Lead::factory()->create(['submission_status' => 'payment_received']);
        $lead->assignedUsers()->attach($agent->id);

        Commission::create([
            'user_id'    => $agent->id,
            'lead_id'    => $lead->id,
            'amount'     => '15.00',
            'type'       => 'agent',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($agent)->getJson('/api/agent/dashboard')
             ->assertOk()
             ->assertJsonPath('commissions.pending', null)
             ->assertJsonPath('w9_verified', false);
    }

    public function test_dashboard_commission_visible_with_verified_w9(): void
    {
        $admin = $this->makeUser(1);
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create(['submission_status' => 'payment_received']);
        $lead->assignedUsers()->attach($agent->id);

        Commission::create([
            'user_id'    => $agent->id,
            'lead_id'    => $lead->id,
            'amount'     => '15.00',
            'type'       => 'agent',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        W9Upload::create([
            'user_id'     => $agent->id,
            'file_path'   => 'referrals/test.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 512,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $this->actingAs($agent)->getJson('/api/agent/dashboard')
             ->assertOk()
             ->assertJsonPath('commissions.pending', 15)
             ->assertJsonPath('w9_verified', true);
    }

    // ── Leads list ─────────────────────────────────────────────────────────────

    public function test_agent_can_list_assigned_leads(): void
    {
        $agent = $this->makeAgent();
        $leads = Lead::factory()->count(5)->create();
        foreach ($leads as $l) { $l->assignedUsers()->attach($agent->id); }

        $this->actingAs($agent)->getJson('/api/agent/leads')
             ->assertOk()
             ->assertJsonPath('total', 5);
    }

    public function test_leads_list_excludes_unassigned_leads(): void
    {
        $agent = $this->makeAgent();
        $other = $this->makeAgent();

        $mine  = Lead::factory()->create();
        $mine->assignedUsers()->attach($agent->id);

        $theirs = Lead::factory()->create();
        $theirs->assignedUsers()->attach($other->id);

        $unassigned = Lead::factory()->create();

        $this->actingAs($agent)->getJson('/api/agent/leads')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_leads_can_be_filtered_by_status(): void
    {
        $agent = $this->makeAgent();

        $paid = Lead::factory()->create(['submission_status' => 'payment_received']);
        $paid->assignedUsers()->attach($agent->id);

        $tried = Lead::factory()->create(['submission_status' => 'tried']);
        $tried->assignedUsers()->attach($agent->id);

        $this->actingAs($agent)->getJson('/api/agent/leads?status=payment_received')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    // ── Lead detail ────────────────────────────────────────────────────────────

    public function test_agent_can_view_assigned_lead_detail(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create();
        $lead->assignedUsers()->attach($agent->id);

        $this->actingAs($agent)->getJson("/api/agent/leads/{$lead->id}")
             ->assertOk()
             ->assertJsonPath('id', $lead->id);
    }

    public function test_agent_cannot_view_unassigned_lead(): void
    {
        $agent = $this->makeAgent();
        $other = $this->makeAgent();
        $lead  = Lead::factory()->create();
        $lead->assignedUsers()->attach($other->id);

        $this->actingAs($agent)->getJson("/api/agent/leads/{$lead->id}")
             ->assertNotFound();
    }

    // ── Lead update ────────────────────────────────────────────────────────────

    public function test_agent_can_update_submission_status(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create(['submission_status' => 'tried']);
        $lead->assignedUsers()->attach($agent->id);

        $this->actingAs($agent)->patchJson("/api/agent/leads/{$lead->id}", [
            'submission_status' => 'payment_received',
        ])->assertOk()->assertJsonPath('submission_status', 'payment_received');
    }

    public function test_agent_can_toggle_on_hold(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create(['is_on_hold' => false]);
        $lead->assignedUsers()->attach($agent->id);

        $this->actingAs($agent)->patchJson("/api/agent/leads/{$lead->id}", [
            'is_on_hold' => true,
        ])->assertOk()->assertJsonPath('is_on_hold', true);
    }

    public function test_agent_cannot_update_unassigned_lead(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create();

        $this->actingAs($agent)->patchJson("/api/agent/leads/{$lead->id}", [
            'submission_status' => 'finished',
        ])->assertNotFound();
    }

    public function test_agent_cannot_update_restricted_fields(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create(['email' => 'original@example.com']);
        $lead->assignedUsers()->attach($agent->id);

        // bound and closing_reason are admin-only; they should be silently ignored
        $this->actingAs($agent)->patchJson("/api/agent/leads/{$lead->id}", [
            'bound'          => true,
            'closing_reason' => 'hacked',
        ])->assertOk();

        // Fields must not have changed
        $this->assertDatabaseHas('leads', [
            'id'    => $lead->id,
            'bound' => 0,  // unchanged
        ]);
    }

    // ── Notes ──────────────────────────────────────────────────────────────────

    public function test_agent_can_add_note_to_assigned_lead(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create();
        $lead->assignedUsers()->attach($agent->id);

        $this->actingAs($agent)->postJson("/api/agent/leads/{$lead->id}/notes", [
            'message' => 'Customer asked to reschedule.',
        ])->assertCreated()
          ->assertJsonPath('message', 'Customer asked to reschedule.')
          ->assertJsonPath('added_by', $agent->id);
    }

    public function test_agent_cannot_add_note_to_unassigned_lead(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create();

        $this->actingAs($agent)->postJson("/api/agent/leads/{$lead->id}/notes", [
            'message' => 'Attempting to write a note.',
        ])->assertNotFound();
    }

    // ── Commissions ────────────────────────────────────────────────────────────

    public function test_agent_commissions_hidden_without_w9(): void
    {
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create();
        $lead->assignedUsers()->attach($agent->id);

        Commission::create([
            'user_id'    => $agent->id,
            'lead_id'    => $lead->id,
            'amount'     => '20.00',
            'type'       => 'agent',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($agent)->getJson('/api/agent/commissions')
             ->assertOk()
             ->assertJsonPath('w9_verified', false)
             ->assertJsonPath('commissions.data.0.amount', null);
    }

    public function test_agent_commissions_visible_with_verified_w9(): void
    {
        $admin = $this->makeUser(1);
        $agent = $this->makeAgent();
        $lead  = Lead::factory()->create();
        $lead->assignedUsers()->attach($agent->id);

        Commission::create([
            'user_id'    => $agent->id,
            'lead_id'    => $lead->id,
            'amount'     => '20.00',
            'type'       => 'agent',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        W9Upload::create([
            'user_id'     => $agent->id,
            'file_path'   => 'referrals/test.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 512,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $this->actingAs($agent)->getJson('/api/agent/commissions')
             ->assertOk()
             ->assertJsonPath('w9_verified', true)
             ->assertJsonPath('commissions.data.0.amount', '20.00');
    }

    public function test_agent_cannot_see_other_agents_commissions(): void
    {
        $agent = $this->makeAgent();
        $other = $this->makeAgent();
        $lead  = Lead::factory()->create();

        Commission::create([
            'user_id'    => $other->id,
            'lead_id'    => $lead->id,
            'amount'     => '20.00',
            'type'       => 'agent',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $this->actingAs($agent)->getJson('/api/agent/commissions')
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

    private function makeAgent(array $extra = []): User
    {
        return $this->makeUser(7, $extra);
    }
}
