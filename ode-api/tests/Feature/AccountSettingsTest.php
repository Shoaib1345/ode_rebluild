<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Self-service account settings — profile update + password change.
 * Every endpoint operates on the authenticated user only.
 */
class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([0 => 'Super Admin', 1 => 'Admin', 5 => 'Customer'] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function makeUser(int $level = 1, array $extra = []): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(array_merge(['role_id' => $role->id, 'status' => 1], $extra));
    }

    // ── Auth guard ────────────────────────────────────────────────────────────────

    public function test_guest_cannot_update_account(): void
    {
        $this->patchJson('/api/account', ['first_name' => 'X'])->assertUnauthorized();
        $this->postJson('/api/account/password', [])->assertUnauthorized();
    }

    // ── Profile ───────────────────────────────────────────────────────────────────

    public function test_user_can_update_own_profile(): void
    {
        $user = $this->makeUser(1, ['first_name' => 'Old', 'email' => 'old@example.com']);

        $this->actingAs($user)->patchJson('/api/account', [
            'first_name' => 'New',
            'last_name'  => 'Name',
            'email'      => 'new@example.com',
            'phone'      => '5551234567',
        ])->assertOk()->assertJsonPath('user.email', 'new@example.com');

        $this->assertDatabaseHas('users', [
            'id'         => $user->id,
            'first_name' => 'New',
            'email'      => 'new@example.com',
            'phone'      => '5551234567',
        ]);
    }

    public function test_profile_email_must_be_unique(): void
    {
        $this->makeUser(1, ['email' => 'taken@example.com']);
        $user = $this->makeUser(1, ['email' => 'mine@example.com']);

        $this->actingAs($user)->patchJson('/api/account', ['email' => 'taken@example.com'])
             ->assertStatus(422)
             ->assertJsonValidationErrors('email');
    }

    public function test_user_can_keep_own_email_on_update(): void
    {
        $user = $this->makeUser(1, ['email' => 'mine@example.com']);

        $this->actingAs($user)->patchJson('/api/account', [
            'email'      => 'mine@example.com',
            'first_name' => 'Same',
        ])->assertOk();
    }

    // ── Password ──────────────────────────────────────────────────────────────────

    public function test_user_can_change_password_with_correct_current(): void
    {
        $user = $this->makeUser(1, ['password' => 'OldPass123']);

        $this->actingAs($user)->postJson('/api/account/password', [
            'current_password'      => 'OldPass123',
            'password'              => 'BrandNew456',
            'password_confirmation' => 'BrandNew456',
        ])->assertOk();

        $this->assertTrue(Hash::check('BrandNew456', $user->fresh()->password));
    }

    public function test_change_password_rejects_wrong_current(): void
    {
        $user = $this->makeUser(1, ['password' => 'OldPass123']);

        $this->actingAs($user)->postJson('/api/account/password', [
            'current_password'      => 'WrongOne',
            'password'              => 'BrandNew456',
            'password_confirmation' => 'BrandNew456',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('OldPass123', $user->fresh()->password));
    }

    public function test_change_password_requires_confirmation_and_min_length(): void
    {
        $user = $this->makeUser(1, ['password' => 'OldPass123']);

        $this->actingAs($user)->postJson('/api/account/password', [
            'current_password'      => 'OldPass123',
            'password'              => 'short',
            'password_confirmation' => 'mismatch',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_change_password_revokes_other_tokens_but_keeps_current(): void
    {
        $user = $this->makeUser(1, ['password' => 'OldPass123']);

        // An older session token that should be revoked.
        $user->createToken('old-device');
        // The token this request authenticates with.
        $current = $user->createToken('current')->plainTextToken;

        $this->withToken($current)->postJson('/api/account/password', [
            'current_password'      => 'OldPass123',
            'password'              => 'BrandNew456',
            'password_confirmation' => 'BrandNew456',
        ])->assertOk();

        // Only the current token remains.
        $this->assertSame(1, $user->fresh()->tokens()->count());
    }
}
