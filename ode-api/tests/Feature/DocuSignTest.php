<?php

namespace Tests\Feature;

use App\Models\DocSignStatus;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use App\Services\DocuSignService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Feature tests for DocuSign Integration.
 *
 * DocuSignService is mocked so no real DocuSign credentials are needed.
 *
 * Covers:
 *   - Access control: unauthenticated / non-admin blocked
 *   - GET status: no envelope, existing envelope
 *   - POST send: new envelope, resend existing pending
 *   - POST send: 502 when service throws
 *   - Webhook: updates status, sets signed_at on completion
 *   - Webhook: ignores unknown envelope IDs
 */
class DocuSignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_send_envelope(): void
    {
        $lead = Lead::factory()->create();
        $this->postJson("/api/admin/leads/{$lead->id}/docusign/send")->assertUnauthorized();
    }

    public function test_non_admin_cannot_send_envelope(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create();

        $this->actingAs($customer)
             ->postJson("/api/admin/leads/{$lead->id}/docusign/send")
             ->assertForbidden();
    }

    // ── Status endpoint ───────────────────────────────────────────────────────

    public function test_status_returns_null_when_no_envelope(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        $this->actingAs($admin)
             ->getJson("/api/admin/leads/{$lead->id}/docusign/status")
             ->assertOk()
             ->assertJsonPath('status', null);
    }

    public function test_status_returns_existing_envelope(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        DocSignStatus::create([
            'lead_id'     => $lead->id,
            'envelope_id' => 'env-abc-123',
            'status'      => 'sent',
            'sent_at'     => now(),
        ]);

        $this->actingAs($admin)
             ->getJson("/api/admin/leads/{$lead->id}/docusign/status")
             ->assertOk()
             ->assertJsonPath('envelope_id', 'env-abc-123')
             ->assertJsonPath('status', 'sent');
    }

    // ── Send endpoint ─────────────────────────────────────────────────────────

    public function test_admin_can_send_new_envelope(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create(['email' => 'insured@example.com']);

        $this->mockDocuSign()->shouldReceive('sendEnvelope')
             ->once()
             ->andReturn(['envelope_id' => 'env-new-001', 'status' => 'sent']);

        $this->actingAs($admin)
             ->postJson("/api/admin/leads/{$lead->id}/docusign/send")
             ->assertCreated()
             ->assertJsonPath('envelope_id', 'env-new-001')
             ->assertJsonPath('status', 'sent');

        $this->assertDatabaseHas('doc_sign_statuses', [
            'lead_id'     => $lead->id,
            'envelope_id' => 'env-new-001',
            'status'      => 'sent',
        ]);
    }

    public function test_send_resends_existing_pending_envelope(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        DocSignStatus::create([
            'lead_id'     => $lead->id,
            'envelope_id' => 'env-existing',
            'status'      => 'sent',
            'sent_at'     => now()->subHours(2),
        ]);

        $this->mockDocuSign()->shouldReceive('resendEnvelope')
             ->once()
             ->with('env-existing');

        $this->actingAs($admin)
             ->postJson("/api/admin/leads/{$lead->id}/docusign/send")
             ->assertOk()
             ->assertJsonPath('envelope_id', 'env-existing');
    }

    public function test_send_returns_502_when_service_throws(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        $this->mockDocuSign()->shouldReceive('sendEnvelope')
             ->once()
             ->andThrow(new \RuntimeException('DocuSign API unavailable'));

        $this->actingAs($admin)
             ->postJson("/api/admin/leads/{$lead->id}/docusign/send")
             ->assertStatus(502);
    }

    public function test_send_returns_404_for_missing_lead(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)
             ->postJson('/api/admin/leads/99999/docusign/send')
             ->assertNotFound();
    }

    // ── Webhook ───────────────────────────────────────────────────────────────

    public function test_webhook_updates_status(): void
    {
        $lead = Lead::factory()->create();
        DocSignStatus::create([
            'lead_id'     => $lead->id,
            'envelope_id' => 'env-webhook-1',
            'status'      => 'sent',
            'sent_at'     => now(),
        ]);

        $this->postJson('/api/webhooks/docusign', [
            'envelopeId' => 'env-webhook-1',
            'status'     => 'delivered',
        ])->assertOk();

        $this->assertDatabaseHas('doc_sign_statuses', [
            'envelope_id' => 'env-webhook-1',
            'status'      => 'delivered',
        ]);
    }

    public function test_webhook_sets_signed_at_on_completion(): void
    {
        $lead = Lead::factory()->create();
        DocSignStatus::create([
            'lead_id'     => $lead->id,
            'envelope_id' => 'env-completed',
            'status'      => 'delivered',
            'sent_at'     => now(),
        ]);

        $this->postJson('/api/webhooks/docusign', [
            'envelopeId' => 'env-completed',
            'status'     => 'completed',
        ])->assertOk();

        $record = DocSignStatus::where('envelope_id', 'env-completed')->first();
        $this->assertEquals('completed', $record->status);
        $this->assertNotNull($record->signed_at);
    }

    public function test_webhook_ignores_unknown_envelope(): void
    {
        $this->postJson('/api/webhooks/docusign', [
            'envelopeId' => 'env-unknown-xyz',
            'status'     => 'completed',
        ])->assertOk();
    }

    public function test_webhook_returns_200_when_envelope_id_missing(): void
    {
        $this->postJson('/api/webhooks/docusign', [])->assertOk();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Bind a mock DocuSignService and return it for further expectations. */
    private function mockDocuSign(): \Mockery\MockInterface
    {
        $mock = Mockery::mock(DocuSignService::class);
        $this->app->instance(DocuSignService::class, $mock);
        return $mock;
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

    private function makeUser(int $level): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(['role_id' => $role->id, 'status' => 1]);
    }
}
