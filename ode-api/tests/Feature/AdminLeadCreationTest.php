<?php

namespace Tests\Feature;

use App\Models\EventType;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Admin manual lead creation (POST /api/admin/leads) + hold pipeline filter.
 */
class AdminLeadCreationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([0 => 'Super Admin', 1 => 'Admin', 5 => 'Customer'] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function makeUser(int $level): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(['role_id' => $role->id, 'status' => 1]);
    }

    private function payload(array $o = []): array
    {
        return array_merge([
            'event_type_name' => 'Birthday Party',
            'event_dates'     => '2031-06-18',
            'event_state'     => 'CA',
            'persons'         => 80,
            'first_name'      => 'Carl',
            'last_name'       => 'Customer',
            'email'           => 'carl@example.com',
            'phone'           => '5550001111',
        ], $o);
    }

    public function test_admin_creates_manual_lead_with_plan(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);

        $res = $this->actingAs($this->makeUser(1))->postJson('/api/admin/leads', $this->payload([
            'event_type_id' => $type->id,
            'carrier'       => 'ASI',
            'premium'       => 100,
            'broker_fee'    => 35,
            'processing_fee'=> 5,
            'total'         => 140,
            'min_limit'     => 1,
            'max_limit'     => 2,
        ]));

        $res->assertCreated();
        $lead = Lead::find($res->json('lead.id'));

        $this->assertSame('plan_added_manually', $lead->submission_status);
        $this->assertNull($lead->payment_id);
        $this->assertSame(140.0, (float) $lead->lead_offered_plans['total']);
        $this->assertSame('ASI', $lead->carrier);
    }

    public function test_admin_creates_manual_lead_without_plan_is_mq(): void
    {
        $res = $this->actingAs($this->makeUser(1))->postJson('/api/admin/leads', $this->payload());

        $res->assertCreated();
        $this->assertSame('mq', Lead::find($res->json('lead.id'))->submission_status);
    }

    public function test_non_admin_cannot_create_lead(): void
    {
        $this->actingAs($this->makeUser(5))
            ->postJson('/api/admin/leads', $this->payload())
            ->assertForbidden();
    }

    public function test_hold_filter_returns_only_on_hold_leads(): void
    {
        Lead::factory()->create(['is_on_hold' => true,  'status' => 1]);
        Lead::factory()->create(['is_on_hold' => false, 'status' => 1]);

        $res = $this->actingAs($this->makeUser(1))->getJson('/api/admin/leads?hold=1');

        $res->assertOk()->assertJsonPath('total', 1);
    }
}
