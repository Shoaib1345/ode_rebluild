<?php

namespace Tests\Feature;

use App\Jobs\SendAffiliateWelcomeEmail;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Affiliate signup → pending → admin approval workflow.
 */
class AffiliateApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([
            0 => 'Super Admin', 1 => 'Admin', 5 => 'Customer', 6 => 'Affiliate',
        ] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function admin(): User
    {
        $role = UserRole::where('access_level', 1)->first();
        return User::factory()->create(['role_id' => $role->id, 'status' => 1]);
    }

    private function registerPayload(array $o = []): array
    {
        return array_merge([
            'first_name'     => 'Amy',
            'last_name'      => 'Affiliate',
            'email'          => 'amy@example.com',
            'phone'          => '5551234567',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'agree_to_terms' => true,
        ], $o);
    }

    public function test_affiliate_signup_is_pending_and_issues_a_login_token(): void
    {
        $res = $this->postJson('/api/affiliate/register', $this->registerPayload());

        // A token is issued so the applicant can immediately access their portal
        // and track approval status, even though they're still pending (status 0).
        $res->assertCreated()
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.status', 0);

        $this->assertNotEmpty($res->json('token'));
        $this->assertDatabaseHas('users', ['email' => 'amy@example.com', 'status' => 0]);
    }

    public function test_pending_affiliate_can_log_in_to_track_status(): void
    {
        $this->postJson('/api/affiliate/register', $this->registerPayload())->assertCreated();

        // Pending affiliates may log in so they can view their approval status.
        $this->postJson('/api/auth/login', [
            'email'    => 'amy@example.com',
            'password' => 'password123',
        ])->assertOk()
          ->assertJsonPath('user.status', 0)
          ->assertJsonPath('user.role.access_level', 6);
    }

    public function test_inactive_non_affiliate_still_cannot_log_in(): void
    {
        $role = UserRole::where('access_level', 5)->first(); // customer
        User::factory()->create([
            'role_id'  => $role->id,
            'email'    => 'inactive@example.com',
            'status'   => 0,
            'password' => 'password123',
        ]);

        $this->postJson('/api/auth/login', [
            'email'    => 'inactive@example.com',
            'password' => 'password123',
        ])->assertStatus(403);
    }

    public function test_admin_can_approve_affiliate_and_queues_welcome_email(): void
    {
        Queue::fake();

        $this->postJson('/api/affiliate/register', $this->registerPayload())->assertCreated();
        $affiliate = User::where('email', 'amy@example.com')->first();

        $this->actingAs($this->admin())
            ->patchJson("/api/admin/users/{$affiliate->id}/approve")
            ->assertOk()
            ->assertJsonPath('status', 1);

        $this->assertDatabaseHas('users', ['id' => $affiliate->id, 'status' => 1]);
        Queue::assertPushed(SendAffiliateWelcomeEmail::class);

        // Now login works.
        $this->postJson('/api/auth/login', [
            'email'    => 'amy@example.com',
            'password' => 'password123',
        ])->assertOk();
    }

    public function test_admin_can_reject_affiliate_with_status_flag(): void
    {
        $this->postJson('/api/affiliate/register', $this->registerPayload())->assertCreated();
        $affiliate = User::where('email', 'amy@example.com')->first();

        $this->actingAs($this->admin())
            ->patchJson("/api/admin/users/{$affiliate->id}/reject")
            ->assertOk()
            ->assertJsonPath('status', 2);

        // Flagged rejected, NOT soft-deleted — so they can still view their status.
        $this->assertDatabaseHas('users', ['id' => $affiliate->id, 'status' => 2, 'deleted_at' => null]);

        // A rejected affiliate can still log in to see they weren't approved.
        $this->postJson('/api/auth/login', [
            'email'    => 'amy@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.status', 2);
    }

    public function test_approve_is_admin_only(): void
    {
        $this->postJson('/api/affiliate/register', $this->registerPayload())->assertCreated();
        $affiliate = User::where('email', 'amy@example.com')->first();

        // Unauthenticated
        $this->patchJson("/api/admin/users/{$affiliate->id}/approve")->assertUnauthorized();
    }
}
