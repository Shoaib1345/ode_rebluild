<?php

namespace Tests\Feature;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Feature tests for Pending Quote Save / Resume.
 *
 * Covers:
 *   - POST /api/leads/pending  — create, update, validation
 *   - GET  /api/quotes/pending/{token}  — resume, 404 for unknown/completed
 */
class PendingQuoteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    // ── Save — create ─────────────────────────────────────────────────────────

    public function test_save_creates_pending_lead_and_returns_token(): void
    {
        $response = $this->postJson('/api/leads/pending', $this->savePayload());

        $response->assertStatus(201)
                 ->assertJsonStructure(['pending_quote_id', 'created'])
                 ->assertJsonPath('created', true);

        $token = $response->json('pending_quote_id');
        $this->assertNotEmpty($token);
        $this->assertEquals(32, strlen($token));

        $this->assertDatabaseHas('leads', [
            'email'             => 'test@example.com',
            'submission_status' => 'saved',
            'pending_ode_quote_link_id' => $token,
        ]);
    }

    public function test_save_stores_wizard_state_and_route(): void
    {
        $payload = $this->savePayload([
            'current_route' => '/quote/plans',
            'wizard_state'  => ['params' => ['event_type_id' => 5], 'selectedPlan' => null],
        ]);

        $response = $this->postJson('/api/leads/pending', $payload)->assertStatus(201);
        $token    = $response->json('pending_quote_id');

        $lead    = Lead::where('pending_ode_quote_link_id', $token)->firstOrFail();
        $stored  = json_decode($lead->pending_json_form_array, true);

        $this->assertEquals('/quote/plans', $stored['current_route']);
        $this->assertEquals(5, $stored['wizard_state']['params']['event_type_id']);
    }

    public function test_save_extracts_first_name_from_wizard_state(): void
    {
        $payload = $this->savePayload([
            'wizard_state' => [
                'customerInfo' => ['first_name' => 'Alice'],
            ],
        ]);

        $response = $this->postJson('/api/leads/pending', $payload)->assertStatus(201);
        $token    = $response->json('pending_quote_id');

        $this->assertDatabaseHas('leads', [
            'pending_ode_quote_link_id' => $token,
            'first_name'                => 'Alice',
        ]);
    }

    public function test_save_requires_email(): void
    {
        $payload = $this->savePayload();
        unset($payload['email']);

        $this->postJson('/api/leads/pending', $payload)->assertUnprocessable();
    }

    public function test_save_rejects_invalid_email(): void
    {
        $this->postJson('/api/leads/pending', $this->savePayload(['email' => 'not-an-email']))
             ->assertUnprocessable();
    }

    public function test_save_requires_current_route(): void
    {
        $payload = $this->savePayload();
        unset($payload['current_route']);

        $this->postJson('/api/leads/pending', $payload)->assertUnprocessable();
    }

    public function test_save_requires_wizard_state(): void
    {
        $payload = $this->savePayload();
        unset($payload['wizard_state']);

        $this->postJson('/api/leads/pending', $payload)->assertUnprocessable();
    }

    // ── Save — update ─────────────────────────────────────────────────────────

    public function test_save_with_existing_token_updates_lead(): void
    {
        // Create initial pending lead
        $token = $this->createPendingLead();

        // Update with new route and state
        $updatePayload = $this->savePayload([
            'current_route'    => '/quote/info',
            'wizard_state'     => ['selectedPlan' => ['carrier' => 'ASI']],
            'pending_quote_id' => $token,
        ]);

        $response = $this->postJson('/api/leads/pending', $updatePayload)
                         ->assertOk()
                         ->assertJsonPath('created', false)
                         ->assertJsonPath('pending_quote_id', $token);

        // Only one lead row should exist
        $this->assertEquals(1, Lead::where('pending_ode_quote_link_id', $token)->count());

        $stored = json_decode(
            Lead::where('pending_ode_quote_link_id', $token)->value('pending_json_form_array'),
            true
        );
        $this->assertEquals('/quote/info', $stored['current_route']);
        $this->assertEquals('ASI', $stored['wizard_state']['selectedPlan']['carrier']);
    }

    public function test_save_with_unknown_token_creates_new_lead(): void
    {
        $response = $this->postJson('/api/leads/pending', $this->savePayload([
            'pending_quote_id' => 'nonexistent_token_1234567890abcdef',
        ]))->assertStatus(201)
           ->assertJsonPath('created', true);

        // New token generated (not the one we sent)
        $newToken = $response->json('pending_quote_id');
        $this->assertNotEquals('nonexistent_token_1234567890abcdef', $newToken);
    }

    public function test_save_does_not_update_completed_leads(): void
    {
        // A completed lead with the same token should NOT be updated
        $lead = Lead::factory()->create([
            'submission_status'         => 'payment_received',
            'pending_ode_quote_link_id' => 'completed_token_12345678901234',
        ]);

        $response = $this->postJson('/api/leads/pending', $this->savePayload([
            'pending_quote_id' => 'completed_token_12345678901234',
        ]))->assertStatus(201)
           ->assertJsonPath('created', true);

        // Original lead should be untouched
        $this->assertDatabaseHas('leads', [
            'id'                => $lead->id,
            'submission_status' => 'payment_received',
        ]);
    }

    // ── Resume ────────────────────────────────────────────────────────────────

    public function test_resume_returns_wizard_state(): void
    {
        $token = $this->createPendingLead([
            'current_route' => '/quote/plans',
            'wizard_state'  => ['params' => ['event_state' => 'CA']],
        ]);

        $this->getJson("/api/quotes/pending/{$token}")
             ->assertOk()
             ->assertJsonPath('current_route', '/quote/plans')
             ->assertJsonPath('wizard_state.params.event_state', 'CA')
             ->assertJsonPath('pending_quote_id', $token);
    }

    public function test_resume_returns_email(): void
    {
        $token = $this->createPendingLead();

        $response = $this->getJson("/api/quotes/pending/{$token}")->assertOk();
        $this->assertEquals('test@example.com', $response->json('email'));
    }

    public function test_resume_returns_404_for_unknown_token(): void
    {
        $this->getJson('/api/quotes/pending/unknowntoken12345678901234567890')
             ->assertNotFound();
    }

    public function test_resume_returns_404_for_completed_lead(): void
    {
        $lead = Lead::factory()->create([
            'submission_status'         => 'payment_received',
            'pending_ode_quote_link_id' => 'paid_token_123456789012345678',
            'pending_json_form_array'   => json_encode(['current_route' => '/quote/info', 'wizard_state' => []]),
        ]);

        $this->getJson("/api/quotes/pending/paid_token_123456789012345678")
             ->assertNotFound();
    }

    public function test_resume_defaults_route_when_missing(): void
    {
        // Store a payload without current_route (edge case)
        $lead = Lead::factory()->create([
            'submission_status'         => 'saved',
            'pending_ode_quote_link_id' => 'norouttoken12345678901234567',
            'pending_json_form_array'   => json_encode(['wizard_state' => ['foo' => 'bar']]),
        ]);

        $this->getJson("/api/quotes/pending/norouttoken12345678901234567")
             ->assertOk()
             ->assertJsonPath('current_route', '/quote/details');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function savePayload(array $overrides = []): array
    {
        return array_merge([
            'email'         => 'test@example.com',
            'current_route' => '/quote/info',
            'wizard_state'  => [
                'params'       => ['event_type_id' => 1, 'event_state' => 'CA'],
                'selectedPlan' => null,
                'customerInfo' => [],
            ],
        ], $overrides);
    }

    /** Create a pending lead via the API and return its token. */
    private function createPendingLead(array $stateOverrides = []): string
    {
        $wizardState = array_merge([
            'current_route' => '/quote/info',
            'wizard_state'  => ['params' => ['event_type_id' => 1]],
        ], $stateOverrides);

        $payload = array_merge($this->savePayload(), $wizardState);

        return $this->postJson('/api/leads/pending', $payload)
                    ->assertStatus(201)
                    ->json('pending_quote_id');
    }
}
