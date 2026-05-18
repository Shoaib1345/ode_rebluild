<?php

namespace Tests\Feature;

use App\Models\EmailTemplate;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Feature tests for Admin Email Templates CRUD.
 *
 * Covers:
 *   - Access control: unauthenticated / non-admin blocked
 *   - Index: list all templates
 *   - Show: get single, 404 for missing
 *   - Store: create, validation (duplicate key, invalid key format)
 *   - Update: edit fields
 *   - Destroy: delete
 *   - Send test: sends to admin's email
 */
class AdminEmailTemplatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
        Mail::fake();
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_email_templates(): void
    {
        $this->getJson('/api/admin/email-templates')->assertUnauthorized();
    }

    public function test_non_admin_cannot_access_email_templates(): void
    {
        $affiliate = $this->makeUser(6);
        $this->actingAs($affiliate)->getJson('/api/admin/email-templates')->assertForbidden();
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_email_templates(): void
    {
        $admin = $this->makeUser(1);
        EmailTemplate::factory()->count(3)->create();

        $this->actingAs($admin)->getJson('/api/admin/email-templates')
             ->assertOk()
             ->assertJsonCount(3);
    }

    public function test_index_returns_key_subject_and_is_active(): void
    {
        $admin    = $this->makeUser(1);
        EmailTemplate::factory()->create(['key' => 'post_event', 'subject' => 'Best wishes']);

        $response = $this->actingAs($admin)->getJson('/api/admin/email-templates')->assertOk();

        $this->assertEquals('post_event', $response->json('0.key'));
        $this->assertEquals('Best wishes', $response->json('0.subject'));
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_admin_can_view_single_template(): void
    {
        $admin    = $this->makeUser(1);
        $template = EmailTemplate::factory()->create(['key' => 'post_event']);

        $this->actingAs($admin)->getJson("/api/admin/email-templates/{$template->id}")
             ->assertOk()
             ->assertJsonPath('key', 'post_event')
             ->assertJsonStructure(['id', 'key', 'subject', 'body', 'variables', 'is_active']);
    }

    public function test_show_returns_404_for_missing_template(): void
    {
        $admin = $this->makeUser(1);
        $this->actingAs($admin)->getJson('/api/admin/email-templates/99999')->assertNotFound();
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function test_admin_can_create_template(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->postJson('/api/admin/email-templates', [
            'key'     => 'post_event',
            'subject' => 'Best wishes from One Day Event',
            'body'    => '<p>Hi {firstName}, we hope your {eventType} was wonderful!</p>',
            'variables' => [
                ['name' => 'firstName', 'description' => 'Recipient first name'],
                ['name' => 'eventType', 'description' => 'Type of event'],
            ],
        ])
             ->assertCreated()
             ->assertJsonPath('key', 'post_event')
             ->assertJsonPath('is_active', true);

        $this->assertDatabaseHas('email_templates', ['key' => 'post_event']);
    }

    public function test_store_rejects_duplicate_key(): void
    {
        $admin = $this->makeUser(1);
        EmailTemplate::factory()->create(['key' => 'post_event']);

        $this->actingAs($admin)->postJson('/api/admin/email-templates', [
            'key'     => 'post_event',
            'subject' => 'Another subject',
            'body'    => '<p>Body</p>',
        ])->assertUnprocessable();
    }

    public function test_store_rejects_invalid_key_format(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->postJson('/api/admin/email-templates', [
            'key'     => 'My Template Key!', // spaces and special chars not allowed
            'subject' => 'Subject',
            'body'    => '<p>Body</p>',
        ])->assertUnprocessable();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_admin_can_update_template(): void
    {
        $admin    = $this->makeUser(1);
        $template = EmailTemplate::factory()->create(['subject' => 'Old subject']);

        $this->actingAs($admin)->patchJson("/api/admin/email-templates/{$template->id}", [
            'subject'   => 'New subject',
            'is_active' => false,
        ])
             ->assertOk()
             ->assertJsonPath('subject', 'New subject')
             ->assertJsonPath('is_active', false);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function test_admin_can_delete_template(): void
    {
        $admin    = $this->makeUser(1);
        $template = EmailTemplate::factory()->create();

        $this->actingAs($admin)->deleteJson("/api/admin/email-templates/{$template->id}")
             ->assertOk()
             ->assertJsonPath('message', 'Template deleted.');

        $this->assertDatabaseMissing('email_templates', ['id' => $template->id]);
    }

    // ── Send test ─────────────────────────────────────────────────────────────

    public function test_admin_can_send_test_email(): void
    {
        $admin    = $this->makeUser(1);
        $template = EmailTemplate::factory()->create([
            'subject'   => 'Hello {firstName}',
            'body'      => '<p>Hi {firstName}!</p>',
            'variables' => [['name' => 'firstName', 'description' => 'First name']],
        ]);

        $this->actingAs($admin)->postJson("/api/admin/email-templates/{$template->id}/send-test")
             ->assertOk()
             ->assertJsonPath('message', "Test email sent to {$admin->email}.");

        Mail::assertSent(\App\Mail\TemplatedMail::class);
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
