<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

/**
 * Admin impersonation — POST /api/admin/users/{id}/impersonate.
 */
class ImpersonationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([0 => 'Super Admin', 1 => 'Admin', 5 => 'Customer'] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function user(int $level): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(['role_id' => $role->id, 'status' => 1]);
    }

    public function test_admin_can_impersonate_a_customer(): void
    {
        $customer = $this->user(5);

        $res = $this->actingAs($this->user(1))
            ->postJson("/api/admin/users/{$customer->id}/impersonate")
            ->assertOk()
            ->assertJsonStructure(['token', 'user', 'message'])
            ->assertJsonPath('user.id', $customer->id);

        // The issued token belongs to (authenticates as) the customer.
        $token = PersonalAccessToken::findToken($res->json('token'));
        $this->assertNotNull($token);
        $this->assertSame($customer->id, $token->tokenable_id);
        $this->assertSame(User::class, $token->tokenable_type);
    }

    public function test_cannot_impersonate_super_admin(): void
    {
        $super = $this->user(0);

        $this->actingAs($this->user(1))
            ->postJson("/api/admin/users/{$super->id}/impersonate")
            ->assertForbidden();
    }

    public function test_non_admin_cannot_impersonate(): void
    {
        $customer = $this->user(5);

        $this->actingAs($this->user(5))
            ->postJson("/api/admin/users/{$customer->id}/impersonate")
            ->assertForbidden();
    }
}
