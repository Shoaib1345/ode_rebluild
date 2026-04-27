<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserRole;
use App\Models\W9Upload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Chunk 38 — Admin W9 Management.
 *
 * Covers:
 *   - Access control: unauthenticated / non-admin blocked
 *   - Index: list all uploads, filter by status, search by user
 *   - Response structure: user info, role, file info, verified_by
 *   - Verify action (already tested in W9UploadTest; smoke-checked here)
 */
class AdminW9ManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_w9_list(): void
    {
        $this->getJson('/api/admin/w9')->assertUnauthorized();
    }

    public function test_non_admin_cannot_access_w9_list(): void
    {
        $affiliate = $this->makeUser(6);
        $this->actingAs($affiliate)->getJson('/api/admin/w9')->assertForbidden();
    }

    public function test_agent_cannot_access_w9_list(): void
    {
        $agent = $this->makeUser(7);
        $this->actingAs($agent)->getJson('/api/admin/w9')->assertForbidden();
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_all_w9_uploads(): void
    {
        $admin = $this->makeUser(1);
        $this->createUpload($this->makeUser(6));
        $this->createUpload($this->makeUser(7));

        $this->actingAs($admin)->getJson('/api/admin/w9')
             ->assertOk()
             ->assertJsonStructure(['data', 'total', 'current_page', 'last_page'])
             ->assertJsonPath('total', 2);
    }

    public function test_response_includes_user_and_role_info(): void
    {
        $admin = $this->makeUser(1);
        $user  = $this->makeUser(6);
        $this->createUpload($user);

        $response = $this->actingAs($admin)->getJson('/api/admin/w9')->assertOk();

        $this->assertEquals($user->id,    $response->json('data.0.user.id'));
        $this->assertEquals($user->email, $response->json('data.0.user.email'));
        $this->assertNotNull($response->json('data.0.user.role'));
        $this->assertEquals(6, $response->json('data.0.user.role.access_level'));
    }

    public function test_admin_can_filter_pending_uploads(): void
    {
        $admin = $this->makeUser(1);

        $this->createUpload($this->makeUser(6));                    // pending
        $this->createVerifiedUpload($this->makeUser(7), $admin);    // verified

        $this->actingAs($admin)->getJson('/api/admin/w9?status=pending')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_admin_can_filter_verified_uploads(): void
    {
        $admin = $this->makeUser(1);

        $this->createUpload($this->makeUser(6));                    // pending
        $this->createVerifiedUpload($this->makeUser(7), $admin);    // verified
        $this->createVerifiedUpload($this->makeUser(8), $admin);    // verified

        $this->actingAs($admin)->getJson('/api/admin/w9?status=verified')
             ->assertOk()
             ->assertJsonPath('total', 2);
    }

    public function test_admin_can_search_uploads_by_user_name(): void
    {
        $admin       = $this->makeUser(1);
        $searchUser  = User::factory()->create([
            'role_id'    => UserRole::where('access_level', 6)->value('id'),
            'first_name' => 'Zebediah',
            'last_name'  => 'Unique',
            'status'     => 1,
        ]);
        $this->createUpload($searchUser);
        $this->createUpload($this->makeUser(7)); // not Zebediah

        $this->actingAs($admin)->getJson('/api/admin/w9?search=Zebediah')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_admin_can_search_uploads_by_email(): void
    {
        $admin      = $this->makeUser(1);
        $searchUser = User::factory()->create([
            'role_id' => UserRole::where('access_level', 6)->value('id'),
            'email'   => 'unique.w9.test@example.com',
            'status'  => 1,
        ]);
        $this->createUpload($searchUser);
        $this->createUpload($this->makeUser(7));

        $this->actingAs($admin)->getJson('/api/admin/w9?search=unique.w9.test')
             ->assertOk()
             ->assertJsonPath('total', 1);
    }

    public function test_empty_result_when_no_uploads_match_filter(): void
    {
        $admin = $this->makeUser(1);
        $this->createUpload($this->makeUser(6)); // pending

        $this->actingAs($admin)->getJson('/api/admin/w9?status=verified')
             ->assertOk()
             ->assertJsonPath('total', 0);
    }

    public function test_verified_upload_includes_verified_by_info(): void
    {
        $admin = $this->makeUser(1);
        $user  = $this->makeUser(6);
        $this->createVerifiedUpload($user, $admin);

        $response = $this->actingAs($admin)->getJson('/api/admin/w9?status=verified')
             ->assertOk();

        $this->assertNotNull($response->json('data.0.verified_at'));
        $this->assertEquals($admin->id, $response->json('data.0.verified_by.id'));
    }

    // ── Verify smoke test ─────────────────────────────────────────────────────

    public function test_admin_can_verify_from_global_list(): void
    {
        $admin  = $this->makeUser(1);
        $target = $this->makeUser(6);
        $this->createUpload($target);

        $this->actingAs($admin)
             ->patchJson("/api/admin/users/{$target->id}/w9/verify")
             ->assertOk()
             ->assertJsonPath('w9.status', 'verified');

        $this->assertNotNull(W9Upload::where('user_id', $target->id)->latest()->first()->verified_at);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function createUpload(User $user): W9Upload
    {
        return W9Upload::create([
            'user_id'   => $user->id,
            'file_path' => "referrals/{$user->id}-w9-" . now()->format('YmdHis') . '.pdf',
            'file_name' => 'w9.pdf',
            'file_size' => 1024,
        ]);
    }

    private function createVerifiedUpload(User $user, User $admin): W9Upload
    {
        return W9Upload::create([
            'user_id'     => $user->id,
            'file_path'   => "referrals/{$user->id}-w9-" . now()->format('YmdHis') . '.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 1024,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);
    }

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
