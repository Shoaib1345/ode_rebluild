<?php

namespace Tests\Feature;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Named additional-insured party storage (legacy ODE10A).
 */
class AdditionalInsuredTest extends TestCase
{
    use RefreshDatabase;

    public function test_additional_insured_details_round_trip(): void
    {
        $details = [
            ['name' => 'Acme Venue', 'relation' => 'Venue',   'street' => '1 Main St', 'city' => 'Los Angeles', 'state' => 'CA', 'zip' => '90001', 'email' => 'venue@acme.com'],
            ['name' => 'Bob Caterer', 'relation' => 'Caterer', 'street' => '2 Oak Ave', 'city' => 'Los Angeles', 'state' => 'CA', 'zip' => '90002', 'email' => ''],
        ];

        $lead = Lead::factory()->create([
            'additional_insured'         => 2,
            'additional_insured_details' => $details,
        ]);

        $fresh = Lead::find($lead->id);

        $this->assertIsArray($fresh->additional_insured_details);
        $this->assertCount(2, $fresh->additional_insured_details);
        $this->assertSame('Acme Venue', $fresh->additional_insured_details[0]['name']);
        $this->assertSame('Caterer',    $fresh->additional_insured_details[1]['relation']);
    }

    public function test_additional_insured_details_defaults_null(): void
    {
        $lead = Lead::factory()->create();
        $this->assertNull(Lead::find($lead->id)->additional_insured_details);
    }
}
