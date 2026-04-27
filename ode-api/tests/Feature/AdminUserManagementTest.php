<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Chunk 36 — Admin User Management.
 *
 * Covers:
 *   - Index: pagination, role filter, search, status filter
 *   - Show: full user detail
 *   - Store: create user, auto temp password, referral string for partners
 *   - Update: edit fields, guard own role change
 *   - Destroy: soft-delete, guard own account
 *   - Roles: list available roles
 *   - Access control: non-admin cannot use these routes
 */
class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_user_routes(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }

    public function test_non_admin_cannot_access_user_routes(): void
    {
        $customer = $this->makeUser(5);
        $this->actingAs($customer)->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_agent_cannot_access_user_routes(): void
    {
        $agent = $this->makeUser(7);
        $this->actingAs($agent)->getJson('/api/admin/users')->assertForbidden();
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_users(): void
    {
        $admin = $this->makeUser(1);
        User::factory()->count(5)->create(['role_id' => $this->roleId(6)]);

        $this->actingAs($admin)->getJson('/api/admin/users')
             ->assertOk()
             ->assertJsonStructure(['data', 'total', 'current_page', 'last_page']);
    }

    public function test_users_can_be_filtered_by_role(): void
    {
        $admin     = $this->makeUser(1);
        $agentRole = $this->roleId(7);

        User::factory()->count(3)->create(['role_id' => $agentRole]);
        User::factory()->count(2)->create(['role_id' => $this->roleId(6)]); // affiliates

        $response = $this->actingAs($admin)->getJson('/api/admin/users?role=agent')
             ->assertOk();

        // Only the 3 agents returned (plus potentially the admin themselves if agent)
        $this->assertEquals(3, $response->json('total'));
    }

    public function test_users_can_be_filtered_by_staff_role(): void
    {
        $admin = $this->makeUser(1);
        User::factory()->count(2)->create(['role_id' => $this->roleId(2)]); // staff

        $this->actingAs($admin)->getJson('/api/admin/users?role=staff')
             ->assertOk()
             ->assertJsonPath('total', 3); // 2 staff + the admin themselves
    }

    public function test_users_can_be_searched_by_name(): void
    {
        $admin = $this->makeUser(1);
        User::factory()->create(['first_name' => 'Zebediah', 'last_name' => 'Unique', 'role_id' => $this->roleId(6)]);
        User::factory()->count(3)->create(['role_id' => $this->roleId(6)]);

        $this->actingAs($admin)->getJson('/api/admin/users?search=Zebediah')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_users_can_be_filtered_by_status(): void
    {
        $admin = $this->makeUser(1);
        User::factory()->count(2)->create(['role_id' => $this->roleId(6), 'status' => 0]);
        User::factory()->count(3)->create(['role_id' => $this->roleId(6), 'status' => 1]);

        $this->actingAs($admin)->getJson('/api/admin/users?role=affiliate&status=0')
             ->assertOk()
             ->assertJsonPath('total', 2);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_admin_can_view_user_detail(): void
    {
        $admin  = $this->makeUser(1);
        $target = $this->makeUser(7);

        $this->actingAs($admin)->getJson("/api/admin/users/{$target->id}")
             ->assertOk()
             ->assertJsonPath('id', $target->id)
             ->assertJsonPath('email', $target->email)
             ->assertJsonStructure(['role', 'commission_pct', 'commission_flat', 'is_on_payroll']);
    }

    public function test_show_returns_404_for_nonexistent_user(): void
    {
        $admin = $this->makeUser(1);
        $this->actingAs($admin)->getJson('/api/admin/users/99999')->assertNotFound();
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function test_admin_can_create_agent_user(): void
    {
        $admin   = $this->makeUser(1);
        $agentId = $this->roleId(7);

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'role_id'    => $agentId,
            'first_name' => 'Jane',
            'last_name'  => 'Doe',
            'email'      => 'jane.agent@example.com',
        ]);

        $response->assertCreated()
                 ->assertJsonPath('email', 'jane.agent@example.com')
                 ->assertJsonPath('role.access_level', 7);

        $this->assertNotNull($response->json('temp_password'));
        $this->assertDatabaseHas('users', ['email' => 'jane.agent@example.com']);
    }

    public function test_store_generates_referral_string_for_affiliate(): void
    {
        $admin = $this->makeUser(1);

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'role_id'    => $this->roleId(6),
            'first_name' => 'Aff',
            'last_name'  => 'User',
            'email'      => 'aff@example.com',
        ])->assertCreated();

        $this->assertNotNull($response->json('referral_string'));
    }

    public function test_store_generates_referral_string_for_planner(): void
    {
        $admin = $this->makeUser(1);

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'role_id'    => $this->roleId(8),
            'first_name' => 'Plan',
            'last_name'  => 'Ner',
            'email'      => 'planner@example.com',
        ])->assertCreated();

        $this->assertNotNull($response->json('referral_string'));
    }

    public function test_store_does_not_generate_referral_string_for_staff(): void
    {
        $admin = $this->makeUser(1);

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'role_id'    => $this->roleId(2),
            'first_name' => 'Staff',
            'last_name'  => 'Person',
            'email'      => 'staff@example.com',
        ])->assertCreated();

        $this->assertNull($response->json('referral_string'));
    }

    public function test_store_rejects_duplicate_email(): void
    {
        $admin    = $this->makeUser(1);
        $existing = $this->makeUser(6);

        $this->actingAs($admin)->postJson('/api/admin/users', [
            'role_id'    => $this->roleId(6),
            'first_name' => 'Dup',
            'last_name'  => 'User',
            'email'      => $existing->email,
        ])->assertUnprocessable();
    }

    public function test_store_cannot_create_super_admin(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->postJson('/api/admin/users', [
            'role_id'    => $this->roleId(0),
            'first_name' => 'Super',
            'last_name'  => 'Admin',
            'email'      => 'superadmin@example.com',
        ])->assertUnprocessable();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_admin_can_update_user_fields(): void
    {
        $admin  = $this->makeUser(1);
        $target = $this->makeUser(7, ['commission_pct' => 5]);

        $this->actingAs($admin)->patchJson("/api/admin/users/{$target->id}", [
            'commission_pct'  => 12,
            'commission_flat' => 25,
            'is_on_payroll'   => true,
        ])->assertOk()
          ->assertJsonPath('commission_pct', '12.00')
          ->assertJsonPath('is_on_payroll', true);
    }

    public function test_admin_can_deactivate_user(): void
    {
        $admin  = $this->makeUser(1);
        $target = $this->makeUser(6);

        $this->actingAs($admin)->patchJson("/api/admin/users/{$target->id}", [
            'status' => false,
        ])->assertOk()
          ->assertJsonPath('status', 0);

        $this->assertDatabaseHas('users', ['id' => $target->id, 'status' => 0]);
    }

    public function test_admin_cannot_change_own_role(): void
    {
        $admin = $this->makeUser(1);
        $staffRoleId = $this->roleId(2);

        // Role change on own account is silently ignored
        $this->actingAs($admin)->patchJson("/api/admin/users/{$admin->id}", [
            'role_id'    => $staffRoleId,
            'first_name' => 'Updated',
        ])->assertOk()
          ->assertJsonPath('first_name', 'Updated');

        // role_id must NOT have changed
        $this->assertDatabaseHas('users', [
            'id'      => $admin->id,
            'role_id' => $admin->role_id,
        ]);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function test_admin_can_soft_delete_user(): void
    {
        $admin  = $this->makeUser(1);
        $target = $this->makeUser(6);

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$target->id}")
             ->assertOk()
             ->assertJsonPath('message', 'User deleted.');

        $this->assertSoftDeleted('users', ['id' => $target->id]);
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$admin->id}")
             ->assertUnprocessable();
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_roles(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->getJson('/api/admin/users/roles')
             ->assertOk()
             ->assertJsonStructure([['id', 'role_name', 'access_level']]);
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

    private function roleId(int $level): int
    {
        return UserRole::where('access_level', $level)->value('id');
    }

    private function makeUser(int $level, array $extra = []): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(array_merge(['role_id' => $role->id, 'status' => 1], $extra));
    }
}
