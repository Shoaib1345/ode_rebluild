<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

/**
 * Forgot-password / reset-password flow.
 */
class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([1 => 'Admin', 5 => 'Customer'] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function user(array $extra = []): User
    {
        $role = UserRole::where('access_level', 5)->first();
        return User::factory()->create(array_merge([
            'role_id'  => $role->id,
            'status'   => 1,
            'email'    => 'reset@example.com',
            'password' => 'OldPass123',
        ], $extra));
    }

    public function test_forgot_password_sends_email_to_existing_user(): void
    {
        Mail::fake();
        $this->user();

        $this->postJson('/api/auth/forgot-password', ['email' => 'reset@example.com'])
             ->assertOk();

        Mail::assertSent(ResetPasswordMail::class, fn ($m) => $m->hasTo('reset@example.com'));
    }

    public function test_forgot_password_is_generic_for_unknown_email(): void
    {
        Mail::fake();

        // Same 200 response, but no email sent (no account enumeration).
        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
             ->assertOk();

        Mail::assertNothingSent();
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user  = $this->user();
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token'                 => $token,
            'email'                 => 'reset@example.com',
            'password'              => 'BrandNew456',
            'password_confirmation' => 'BrandNew456',
        ])->assertOk();

        $this->assertTrue(Hash::check('BrandNew456', $user->fresh()->password));
    }

    public function test_reset_fails_with_invalid_token(): void
    {
        $this->user();

        $this->postJson('/api/auth/reset-password', [
            'token'                 => 'totally-wrong-token',
            'email'                 => 'reset@example.com',
            'password'              => 'BrandNew456',
            'password_confirmation' => 'BrandNew456',
        ])->assertStatus(422);
    }

    public function test_reset_requires_matching_confirmation(): void
    {
        $user  = $this->user();
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token'                 => $token,
            'email'                 => 'reset@example.com',
            'password'              => 'BrandNew456',
            'password_confirmation' => 'different',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }
}
