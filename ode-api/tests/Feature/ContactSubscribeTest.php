<?php

namespace Tests\Feature;

use App\Models\Subscriber;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Feature tests for Chunk 40 — Contact Form + Newsletter Subscribe.
 *
 * Covers:
 *   - Contact: store submission, validation
 *   - Subscribe: create new subscriber, re-subscribe existing
 *   - Admin subscribers: list, search, delete, export
 */
class ContactSubscribeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
        Mail::fake();
    }

    // ── Contact form ──────────────────────────────────────────────────────────

    public function test_anyone_can_submit_contact_form(): void
    {
        $this->postJson('/api/contact', [
            'name'    => 'Jane Doe',
            'email'   => 'jane@example.com',
            'message' => 'I have a question about wedding coverage.',
        ])
             ->assertStatus(201)
             ->assertJsonPath('message', "Thank you! We'll be in touch soon.");

        $this->assertDatabaseHas('contact_submissions', [
            'email' => 'jane@example.com',
        ]);
    }

    public function test_contact_form_requires_name_email_message(): void
    {
        $this->postJson('/api/contact', [])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['name', 'email', 'message']);
    }

    public function test_contact_form_rejects_invalid_email(): void
    {
        $this->postJson('/api/contact', [
            'name'    => 'Jane',
            'email'   => 'not-an-email',
            'message' => 'Hello',
        ])->assertUnprocessable();
    }

    // ── Subscribe ─────────────────────────────────────────────────────────────

    public function test_anyone_can_subscribe(): void
    {
        $this->postJson('/api/subscribe', [
            'email' => 'newsletter@example.com',
            'name'  => 'Jane Doe',
        ])
             ->assertOk()
             ->assertJsonPath('message', "You're subscribed! Thanks for signing up.");

        $this->assertDatabaseHas('subscribers', [
            'email'     => 'newsletter@example.com',
            'is_active' => 1,
        ]);
    }

    public function test_subscribe_requires_valid_email(): void
    {
        $this->postJson('/api/subscribe', ['email' => 'not-valid'])
             ->assertUnprocessable();
    }

    public function test_re_subscribing_existing_email_reactivates(): void
    {
        Subscriber::factory()->create([
            'email'           => 'returning@example.com',
            'is_active'       => false,
            'unsubscribed_at' => now()->subDays(7),
        ]);

        $this->postJson('/api/subscribe', ['email' => 'returning@example.com'])
             ->assertOk();

        $this->assertDatabaseHas('subscribers', [
            'email'     => 'returning@example.com',
            'is_active' => 1,
        ]);
    }

    // ── Admin subscribers ─────────────────────────────────────────────────────

    public function test_admin_can_list_subscribers(): void
    {
        $admin = $this->makeUser(1);
        Subscriber::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/subscribers')
                         ->assertOk();

        $this->assertEquals(3, $response->json('total'));
    }

    public function test_admin_can_search_subscribers(): void
    {
        $admin = $this->makeUser(1);
        Subscriber::factory()->create(['email' => 'alice@example.com']);
        Subscriber::factory()->create(['email' => 'bob@other.com']);

        $response = $this->actingAs($admin)->getJson('/api/admin/subscribers?search=alice')
                         ->assertOk();

        $this->assertEquals(1, $response->json('total'));
    }

    public function test_admin_can_delete_subscriber(): void
    {
        $admin = $this->makeUser(1);
        $sub   = Subscriber::factory()->create();

        $this->actingAs($admin)->deleteJson("/api/admin/subscribers/{$sub->id}")
             ->assertOk()
             ->assertJsonPath('message', 'Subscriber removed.');

        $this->assertDatabaseMissing('subscribers', ['id' => $sub->id]);
    }

    public function test_admin_can_export_subscribers_csv(): void
    {
        $admin = $this->makeUser(1);
        Subscriber::factory()->count(2)->create(['is_active' => true]);

        $response = $this->actingAs($admin)->get('/api/admin/subscribers/export');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }

    public function test_non_admin_cannot_list_subscribers(): void
    {
        $customer = $this->makeUser(5);
        $this->actingAs($customer)->getJson('/api/admin/subscribers')->assertForbidden();
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
