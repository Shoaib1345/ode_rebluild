<?php

namespace Tests\Feature;

use App\Models\EventRate;
use App\Models\EventRateState;
use App\Models\EventType;
use App\Services\QuoteService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pricing-parity tests for the quote engine.
 *
 * Expected values are hand-computed from the LEGACY ode_new algorithm
 * (Events::get_quote_ajax + common_helper::broker_fee/processFee/extraFee):
 *   subtotal       = premium + add-ons + additional-insured uplift
 *   broker_fee     = tier(subtotal) [+ overrides] (+5 ASI) (-10 vendor)   // NO urgency
 *   processing_fee = ceil((subtotal + broker_fee) / 100 * 3.5)
 *   total          = ceil(subtotal + broker_fee + processing_fee)         // NO extra_charge
 *   extra_charge   = urgency + private_residence(5)                       // separate, not in total
 */
class QuotePricingTest extends TestCase
{
    use RefreshDatabase;

    private function quote(): QuoteService
    {
        return app(QuoteService::class);
    }

    /** Create an event_rate (state CA) and return it. */
    private function makeRate(int $eventTypeId, string $carrier, float $rate, int $minLimit, int $maxLimit, array $overrides = []): EventRate
    {
        $row = EventRate::create(array_merge([
            'event_type_id'      => $eventTypeId,
            'carrier'            => $carrier,
            'min_audience'       => 0,
            'max_audience'       => 1000,
            'rate'               => $rate,
            'min_limit'          => $minLimit,
            'max_limit'          => $maxLimit,
            'limit_type'         => 'per_occurrence',
            'host_liquor'        => false,
            'liquor'             => false,
            'noha'               => 'N/A',
            'w_o_s'              => 'N/A',
            'p_a_n_c_b'          => 'N/A',
            'e_a_i'              => 'N/A',
            'same_day_coverage'  => true,
            'weekend_coverage'   => true,
            'quote_instantly'    => true,
            'bind_instantly'     => true,
            'additional_people'  => null,
            'additional_charges' => null,
        ], $overrides));

        EventRateState::create(['event_rate_id' => $row->id, 'state_code' => 'CA']);

        return $row;
    }

    private function baseParams(int $eventTypeId, array $overrides = []): array
    {
        return array_merge([
            'event_type'          => $eventTypeId,
            'event_state'         => 'CA',
            'persons'             => 50,
            'event_dates'         => '2031-06-18',  // a far-future Wednesday (no urgency)
            'timezone'            => 'America/Los_Angeles',
            'private_residence'   => false,
            'additional_insureds' => 0,
        ], $overrides);
    }

    // ── Scenario 1: basic standard event, ASI carrier ──────────────────────────

    public function test_basic_quote_standard_event_asi(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'ASI', 100, 1, 2);

        $plans = $this->quote()->getQuote($this->baseParams($type->id));
        $p     = $plans['firstOption'];

        $this->assertNotNull($p);
        $this->assertEquals(100, $p['premium']);
        $this->assertEquals(35,  $p['broker_fee']);      // 30 base + 5 ASI
        $this->assertEquals(5,   $p['processing_fee']);  // ceil(135/100*3.5)
        $this->assertEquals(0,   $p['extra_charge']);
        $this->assertEquals(140, $p['total']);           // ceil(100+35+5)
    }

    // ── Scenario 2: same-day urgency stays OUT of total ────────────────────────

    public function test_same_day_weekend_urgency_is_separate_extra_charge(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-06-14 12:00:00', 'America/Los_Angeles')); // Saturday

        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'ASI', 100, 1, 2);

        $plans = $this->quote()->getQuote($this->baseParams($type->id, [
            'event_dates' => '2025-06-14',
        ]));
        $p = $plans['firstOption'];

        $this->assertNotNull($p);
        $this->assertEquals(35,  $p['broker_fee']);   // urgency NOT in broker fee
        $this->assertEquals(15,  $p['extra_charge']); // same-day weekend = 15
        $this->assertEquals(140, $p['total']);        // urgency NOT in total

        Carbon::setTestNow();
    }

    public function test_same_day_weekday_urgency_is_ten(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-06-16 12:00:00', 'America/Los_Angeles')); // Monday

        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'ASI', 100, 1, 2);

        $plans = $this->quote()->getQuote($this->baseParams($type->id, [
            'event_dates' => '2025-06-16',
        ]));
        $p = $plans['firstOption'];

        $this->assertEquals(10,  $p['extra_charge']); // same-day weekday = 10
        $this->assertEquals(140, $p['total']);

        Carbon::setTestNow();
    }

    // ── Scenario 3: private residence stays OUT of total ───────────────────────

    public function test_private_residence_is_separate_extra_charge(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'FDEAN', 100, 1, 2);   // ASI excluded for private residence

        $plans = $this->quote()->getQuote($this->baseParams($type->id, [
            'private_residence' => true,
        ]));
        $p = $plans['firstOption'];

        $this->assertNotNull($p);
        $this->assertEquals(30,  $p['broker_fee']);    // FDEAN, no ASI surcharge
        $this->assertEquals(5,   $p['extra_charge']);  // private residence = 5
        $this->assertEquals(135, $p['total']);         // ceil(100+30+5), extra NOT included
    }

    // ── Scenario 4: vendor discount ────────────────────────────────────────────

    public function test_vendor_event_broker_discount(): void
    {
        $type = EventType::create(['event_type' => 'Vendor at Event', 'client_added' => false]);
        $this->makeRate($type->id, 'FDEAN', 100, 1, 2);

        $plans = $this->quote()->getQuote($this->baseParams($type->id));
        $p     = $plans['firstOption'];

        $this->assertEquals(20,  $p['broker_fee']);   // 30 base - 10 vendor
        $this->assertEquals(125, $p['total']);        // ceil(100+20+5)
    }

    // ── Scenario 5: wedding small-event flat fee ───────────────────────────────

    public function test_wedding_small_event_flat_broker_fee(): void
    {
        $type = EventType::create(['event_type' => 'Wedding Reception', 'client_added' => false]);
        $this->makeRate($type->id, 'FDEAN', 100, 1, 2);

        $plans = $this->quote()->getQuote($this->baseParams($type->id, ['persons' => 40]));
        $p     = $plans['firstOption'];

        $this->assertEquals(10,  $p['broker_fee']);   // ≤50 people → flat 10
        $this->assertEquals(114, $p['total']);        // ceil(100+10+4)
    }

    public function test_wedding_excludes_ih_carrier(): void
    {
        $type = EventType::create(['event_type' => 'Wedding Reception', 'client_added' => false]);
        $this->makeRate($type->id, 'IH',    100, 1, 2);   // must be excluded
        $this->makeRate($type->id, 'FDEAN', 120, 1, 5);

        $plans = $this->quote()->getQuote($this->baseParams($type->id, ['persons' => 40]));

        // No plan should reference an IH rate
        foreach ($plans as $p) {
            if ($p !== null) {
                $this->assertNotEquals('IH', $p['carrier']);
            }
        }
    }

    // ── Scenario 6: additional-insured uplift ──────────────────────────────────

    public function test_additional_insured_uplift(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'FDEAN', 100, 1, 2, [
            'additional_people'  => 10,
            'additional_charges' => 5,
        ]);

        $plans = $this->quote()->getQuote($this->baseParams($type->id, [
            'additional_insureds' => 15,   // (15-10)*5 = 25 uplift
        ]));
        $p = $plans['firstOption'];

        $this->assertEquals(125, $p['premium']);  // 100 + 25
        $this->assertEquals(30,  $p['broker_fee']);
        $this->assertEquals(6,   $p['processing_fee']); // ceil(155/100*3.5)=6
        $this->assertEquals(161, $p['total']);          // ceil(125+30+6)
    }

    // ── Scenario 7: four buckets + recommendation ──────────────────────────────

    public function test_four_buckets_and_recommendation(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'FDEAN', 50,  1, 2);
        $this->makeRate($type->id, 'FDEAN', 80,  1, 5);
        $this->makeRate($type->id, 'FDEAN', 120, 2, 5);
        $this->makeRate($type->id, 'FDEAN', 200, 5, 5);

        $plans = $this->quote()->getQuote($this->baseParams($type->id));

        $this->assertEquals(73,  $plans['firstOption']['total']);   // ceil(50+20+3)
        $this->assertEquals(114, $plans['secondOption']['total']);  // ceil(80+30+4)
        $this->assertEquals(156, $plans['thirdOption']['total']);   // ceil(120+30+6)
        $this->assertEquals(259, $plans['fourthOption']['total']);  // ceil(200+50+9)

        // firstOption (73 × 1.40 = 102.2) is cheaper than all higher plans → recommended
        $this->assertTrue($plans['firstOption']['recommended']);
        $this->assertFalse($plans['secondOption']['recommended']);
    }

    // ── Scenario 8: fallback cascade for secondOption ──────────────────────────

    public function test_second_option_falls_back_to_one_four(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'FDEAN', 50,  1, 2);
        $this->makeRate($type->id, 'FDEAN', 80,  1, 4);  // no (1,5) → cascade picks (1,4)
        $this->makeRate($type->id, 'FDEAN', 120, 2, 5);
        $this->makeRate($type->id, 'FDEAN', 200, 5, 5);

        $plans = $this->quote()->getQuote($this->baseParams($type->id));

        $this->assertEquals(1, $plans['secondOption']['min_limit']);
        $this->assertEquals(4, $plans['secondOption']['max_limit']);
    }

    // ── Scenario 9: empty-slot fill + re-sort by limit pair ────────────────────

    public function test_empty_slots_refilled_and_resorted_by_limit(): void
    {
        $type = EventType::create(['event_type' => 'Birthday Party', 'client_added' => false]);
        $this->makeRate($type->id, 'FDEAN', 50, 1, 2);
        $this->makeRate($type->id, 'FDEAN', 90, 2, 3);   // only fills the (2,x) tier

        $plans = $this->quote()->getQuote($this->baseParams($type->id));

        // After re-sort: (1,2) → first, (2,3) → second, rest null
        $this->assertEquals([1, 2], [$plans['firstOption']['min_limit'],  $plans['firstOption']['max_limit']]);
        $this->assertEquals([2, 3], [$plans['secondOption']['min_limit'], $plans['secondOption']['max_limit']]);
        $this->assertNull($plans['thirdOption']);
        $this->assertNull($plans['fourthOption']);
    }
}
