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

    public function test_affiliate_signup_is_pending_and_issues_no_token(): void
    {
        $res = $this->postJson('/api/affiliate/register', $this->registerPayload());

        $res->assertCreated()
            ->assertJsonMissingPath('token')
            ->assertJsonPath('user.status', 0);

        $this->assertDatabaseHas('users', ['email' => 'amy@example.com', 'status' => 0]);
    }

    public function test_pending_affiliate_cannot_log_in(): void
    {
        $this->postJson('/api/affiliate/register', $this->registerPayload())->assertCreated();

        $this->postJson('/api/auth/login', [
            'email'    => 'amy@example.com',
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

    public function test_admin_can_reject_affiliate(): void
    {
        $this->postJson('/api/affiliate/register', $this->registerPayload())->assertCreated();
        $affiliate = User::where('email', 'amy@example.com')->first();

        $this->actingAs($this->admin())
            ->patchJson("/api/admin/users/{$affiliate->id}/reject")
            ->assertOk();

        $this->assertSoftDeleted('users', ['id' => $affiliate->id]);
    }

    public function test_approve_is_admin_only(): void
    {
        $this->postJson('/api/affiliate/register', $this->registerPayload())->assertCreated();
        $affiliate = User::where('email', 'amy@example.com')->first();

        // Unauthenticated
        $this->patchJson("/api/admin/users/{$affiliate->id}/approve")->assertUnauthorized();
    }
}
