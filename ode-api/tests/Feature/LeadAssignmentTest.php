<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Admin Lead Assignments.
 *
 * Covers:
 *   - Access control: unauthenticated / non-admin blocked
 *   - GET  /admin/leads/{id}/assignments
 *   - POST /admin/leads/{id}/assignments
 *   - DELETE /admin/leads/{id}/assignments/{userId}
 *   - GET  /admin/assignable-users
 *   - Business rules: no duplicate assignments, role restriction
 */
class LeadAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
        $this->admin = $this->makeUser(1); // Admin
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_list_assignments(): void
    {
        $lead = Lead::factory()->create();
        $this->getJson("/api/admin/leads/{$lead->id}/assignments")->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_assignments(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create();

        $this->actingAs($customer)
             ->getJson("/api/admin/leads/{$lead->id}/assignments")
             ->assertForbidden();
    }

    public function test_unauthenticated_cannot_assign(): void
    {
        $lead = Lead::factory()->create();
        $this->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => 1])
             ->assertUnauthorized();
    }

    public function test_non_admin_cannot_assign(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create();

        $this->actingAs($customer)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => 1])
             ->assertForbidden();
    }

    // ── List assignments ──────────────────────────────────────────────────────

    public function test_index_returns_empty_when_no_assignments(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->admin)
             ->getJson("/api/admin/leads/{$lead->id}/assignments")
             ->assertOk()
             ->assertJson(['assignees' => []]);
    }

    public function test_index_returns_assigned_users(): void
    {
        $lead  = Lead::factory()->create();
        $agent = $this->makeUser(7); // Agent
        $lead->assignedUsers()->attach($agent->id);

        $response = $this->actingAs($this->admin)
                         ->getJson("/api/admin/leads/{$lead->id}/assignments")
                         ->assertOk();

        $assignees = $response->json('assignees');
        $this->assertCount(1, $assignees);
        $this->assertEquals($agent->id, $assignees[0]['id']);
        $this->assertEquals($agent->first_name, $assignees[0]['first_name']);
        $this->assertArrayHasKey('role_name', $assignees[0]);
    }

    public function test_index_returns_multiple_assignees(): void
    {
        $lead     = Lead::factory()->create();
        $agent    = $this->makeUser(7);
        $staff    = $this->makeUser(2);
        $planner  = $this->makeUser(8);

        $lead->assignedUsers()->attach([$agent->id, $staff->id, $planner->id]);

        $response = $this->actingAs($this->admin)
                         ->getJson("/api/admin/leads/{$lead->id}/assignments")
                         ->assertOk();

        $this->assertCount(3, $response->json('assignees'));
    }

    public function test_index_returns_404_for_missing_lead(): void
    {
        $this->actingAs($this->admin)
             ->getJson('/api/admin/leads/99999/assignments')
             ->assertNotFound();
    }

    // ── Assign ────────────────────────────────────────────────────────────────

    public function test_admin_can_assign_agent_to_lead(): void
    {
        $lead  = Lead::factory()->create();
        $agent = $this->makeUser(7);

        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => $agent->id])
             ->assertStatus(201)
             ->assertJsonPath('assignee.id', $agent->id);

        $this->assertTrue(
            $lead->assignedUsers()->where('users.id', $agent->id)->exists()
        );
    }

    public function test_admin_can_assign_staff_to_lead(): void
    {
        $lead  = Lead::factory()->create();
        $staff = $this->makeUser(2);

        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => $staff->id])
             ->assertStatus(201);
    }

    public function test_admin_can_assign_planner_to_lead(): void
    {
        $lead    = Lead::factory()->create();
        $planner = $this->makeUser(8);

        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => $planner->id])
             ->assertStatus(201);
    }

    public function test_cannot_assign_customer_to_lead(): void
    {
        $lead     = Lead::factory()->create();
        $customer = $this->makeUser(5);

        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => $customer->id])
             ->assertUnprocessable()
             ->assertJsonFragment(['message' => 'Only staff, agents, and planners can be assigned to leads.']);
    }

    public function test_cannot_assign_affiliate_to_lead(): void
    {
        $lead      = Lead::factory()->create();
        $affiliate = $this->makeUser(6);

        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => $affiliate->id])
             ->assertUnprocessable();
    }

    public function test_cannot_assign_same_user_twice(): void
    {
        $lead  = Lead::factory()->create();
        $agent = $this->makeUser(7);
        $lead->assignedUsers()->attach($agent->id);

        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => $agent->id])
             ->assertUnprocessable()
             ->assertJsonFragment(['message' => 'User is already assigned to this lead.']);
    }

    public function test_assign_requires_user_id(): void
    {
        $lead = Lead::factory()->create();
        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", [])
             ->assertUnprocessable();
    }

    public function test_assign_returns_404_for_missing_lead(): void
    {
        $agent = $this->makeUser(7);
        $this->actingAs($this->admin)
             ->postJson('/api/admin/leads/99999/assignments', ['user_id' => $agent->id])
             ->assertNotFound();
    }

    public function test_assign_returns_404_for_missing_user(): void
    {
        $lead = Lead::factory()->create();
        $this->actingAs($this->admin)
             ->postJson("/api/admin/leads/{$lead->id}/assignments", ['user_id' => 99999])
             ->assertUnprocessable(); // validation fails (exists:users,id)
    }

    // ── Unassign ──────────────────────────────────────────────────────────────

    public function test_admin_can_unassign_user(): void
    {
        $lead  = Lead::factory()->create();
        $agent = $this->makeUser(7);
        $lead->assignedUsers()->attach($agent->id);

        $this->actingAs($this->admin)
             ->deleteJson("/api/admin/leads/{$lead->id}/assignments/{$agent->id}")
             ->assertOk()
             ->assertJsonPath('message', 'User unassigned.');

        $this->assertFalse(
            $lead->assignedUsers()->where('users.id', $agent->id)->exists()
        );
    }

    public function test_unassign_unattached_user_is_silently_ok(): void
    {
        $lead  = Lead::factory()->create();
        $agent = $this->makeUser(7);
        // Not attached — detach() is idempotent

        $this->actingAs($this->admin)
             ->deleteJson("/api/admin/leads/{$lead->id}/assignments/{$agent->id}")
             ->assertOk();
    }

    public function test_unassign_returns_404_for_missing_lead(): void
    {
        $agent = $this->makeUser(7);
        $this->actingAs($this->admin)
             ->deleteJson("/api/admin/leads/99999/assignments/{$agent->id}")
             ->assertNotFound();
    }

    // ── Assignable users ──────────────────────────────────────────────────────

    public function test_assignable_users_returns_staff_agents_planners(): void
    {
        $staff   = $this->makeUser(2);
        $agent   = $this->makeUser(7);
        $planner = $this->makeUser(8);
        // Should NOT appear
        $this->makeUser(5); // customer
        $this->makeUser(6); // affiliate

        $response = $this->actingAs($this->admin)
                         ->getJson('/api/admin/assignable-users')
                         ->assertOk();

        $ids = collect($response->json())->pluck('id')->toArray();
        $this->assertContains($staff->id,   $ids);
        $this->assertContains($agent->id,   $ids);
        $this->assertContains($planner->id, $ids);
    }

    public function test_assignable_users_does_not_include_customers_or_affiliates(): void
    {
        $customer  = $this->makeUser(5);
        $affiliate = $this->makeUser(6);

        $response = $this->actingAs($this->admin)
                         ->getJson('/api/admin/assignable-users')
                         ->assertOk();

        $ids = collect($response->json())->pluck('id')->toArray();
        $this->assertNotContains($customer->id,  $ids);
        $this->assertNotContains($affiliate->id, $ids);
    }

    public function test_assignable_users_response_shape(): void
    {
        $agent = $this->makeUser(7);

        $response = $this->actingAs($this->admin)
                         ->getJson('/api/admin/assignable-users')
                         ->assertOk();

        $item = collect($response->json())->firstWhere('id', $agent->id);
        $this->assertNotNull($item);
        $this->assertArrayHasKey('first_name', $item);
        $this->assertArrayHasKey('last_name',  $item);
        $this->assertArrayHasKey('email',      $item);
        $this->assertArrayHasKey('role_name',  $item);
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

    private function makeUser(int $level): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(['role_id' => $role->id, 'status' => 1]);
    }
}
