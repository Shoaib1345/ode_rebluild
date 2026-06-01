<?php

namespace Tests\Feature;

use App\Models\EventType;
use App\Models\Lead;
use App\Models\LeadAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Manual-quote (underwriting) lead submission — POST /api/leads/manual-quote.
 * Creates a non-charging lead with submission_status = 'mq'.
 */
class ManualQuoteTest extends TestCase
{
    use RefreshDatabase;

    private function payload(int $eventTypeId, array $overrides = []): array
    {
        return array_merge([
            'event_type_id'        => $eventTypeId,
            'event_type_name'      => 'Birthday Party',
            'event_dates'          => '2031-06-18,2031-06-20',  // non-consecutive
            'event_state'          => 'CA',
            'persons'              => 120,
            'noha'                 => true,
            'first_name'           => 'Jane',
            'last_name'            => 'Doe',
            'email'                => 'jane@example.com',
            'phone'                => '5551234567',
            'manual_quote_reasons' => ['Hired / non-owned auto coverage requested'],
        ], $overrides);
    }

    public function test_manual_quote_creates_mq_lead_without_payment(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);

        $res = $this->postJson('/api/leads/manual-quote', $this->payload($type->id));

        $res->assertCreated()
            ->assertJsonStructure(['lead_number', 'message']);

        $lead = Lead::find($res->json('lead_number'));
        $this->assertNotNull($lead);
        $this->assertSame('mq', $lead->submission_status);
        $this->assertSame('jane@example.com', $lead->email);
        $this->assertNull($lead->payment_id);           // no charge
        $this->assertSame('Jane', $lead->first_name);
    }

    public function test_manual_quote_records_reason_action(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);

        $res = $this->postJson('/api/leads/manual-quote', $this->payload($type->id));
        $leadId = $res->json('lead_number');

        $action = LeadAction::where('lead_id', $leadId)->first();
        $this->assertNotNull($action);
        $this->assertStringContainsString('Manual quote requested', $action->message);
    }

    public function test_manual_quote_requires_contact_fields(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);

        $this->postJson('/api/leads/manual-quote', $this->payload($type->id, [
            'email'      => '',
            'first_name' => '',
        ]))->assertStatus(422)
           ->assertJsonValidationErrors(['email', 'first_name']);
    }
}
