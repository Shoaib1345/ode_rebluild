<?php

namespace Tests\Feature;

use App\Models\CarrierGlLimit;
use App\Models\EventRate;
use App\Models\EventRateState;
use App\Models\EventType;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Feature tests for Chunk 43 — Rate Import.
 *
 * Covers:
 *   - Access control: unauthenticated / non-admin blocked
 *   - GET  /admin/rates/stats
 *   - GET  /admin/rates/template          → streams CSV with headers
 *   - GET  /admin/rates/template/gl       → streams CSV with headers
 *   - POST /admin/rates/import            → happy-path, multiple rows, replace mode, validation errors
 *   - POST /admin/rates/import/gl         → happy-path, replace mode, validation errors
 *
 * Note: carrier enum ('ASI','FDEAN','IH') — tests always use 'ASI'.
 * Note: EventType model uses $primaryKey = 'uid'; use getKey() to retrieve PK.
 */
class RateImportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
        $this->admin = $this->makeUser(1);
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_import_rates(): void
    {
        $file = $this->makeRateCsv([]);
        $this->postJson('/api/admin/rates/import', ['file' => $file])->assertUnauthorized();
    }

    public function test_non_admin_cannot_import_rates(): void
    {
        $customer = $this->makeUser(5);
        $file     = $this->makeRateCsv([]);

        $this->actingAs($customer)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertForbidden();
    }

    public function test_unauthenticated_cannot_view_stats(): void
    {
        $this->getJson('/api/admin/rates/stats')->assertUnauthorized();
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public function test_stats_returns_counts(): void
    {
        // EventType pk is 'uid' — use getKey() to retrieve the inserted ID
        $type   = EventType::factory()->create();
        $typeId = $type->getKey();

        $rate = EventRate::create($this->rateArray($typeId, 'ASI'));
        EventRateState::create(['event_rate_id' => $rate->id, 'state_code' => 'CA']);
        CarrierGlLimit::factory()->create();

        $this->actingAs($this->admin)
             ->getJson('/api/admin/rates/stats')
             ->assertOk()
             ->assertJson([
                 'event_rates_count'       => 1,
                 'event_rate_states_count' => 1,
                 'carrier_gl_limits_count' => 1,
             ]);
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    public function test_rate_template_download(): void
    {
        $this->actingAs($this->admin)
             ->get('/api/admin/rates/template')
             ->assertOk()
             ->assertHeader('content-disposition')
             ->assertDownload('event_rates_template.csv');
    }

    public function test_gl_limits_template_download(): void
    {
        $this->actingAs($this->admin)
             ->get('/api/admin/rates/template/gl')
             ->assertOk()
             ->assertHeader('content-disposition')
             ->assertDownload('carrier_gl_limits_template.csv');
    }

    // ── Import event rates ────────────────────────────────────────────────────

    public function test_import_rates_happy_path(): void
    {
        $typeId = EventType::factory()->create()->getKey();

        $rows = [$this->rateRow($typeId, 'ASI', 'CA|NY')];
        $file = $this->makeRateCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertOk()
             ->assertJsonPath('imported', 1);

        $rate = EventRate::where('carrier', 'ASI')->first();
        $this->assertNotNull($rate);
        $this->assertDatabaseHas('event_rate_states', ['event_rate_id' => $rate->id, 'state_code' => 'CA']);
        $this->assertDatabaseHas('event_rate_states', ['event_rate_id' => $rate->id, 'state_code' => 'NY']);
    }

    public function test_import_rates_multiple_rows(): void
    {
        $typeId = EventType::factory()->create()->getKey();

        $rows = [
            $this->rateRow($typeId, 'ASI',   'TX'),
            $this->rateRow($typeId, 'FDEAN', 'FL|GA'),
        ];
        $file = $this->makeRateCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertOk()
             ->assertJsonPath('imported', 2);

        $this->assertEquals(2, EventRate::count());
        $this->assertEquals(3, EventRateState::count()); // TX + FL + GA
    }

    public function test_import_rates_replace_mode_truncates_first(): void
    {
        $typeId  = EventType::factory()->create()->getKey();
        $oldRate = EventRate::create($this->rateArray($typeId, 'IH'));
        EventRateState::create(['event_rate_id' => $oldRate->id, 'state_code' => 'WA']);

        $rows = [$this->rateRow($typeId, 'FDEAN', 'OR')];
        $file = $this->makeRateCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file, 'replace' => true])
             ->assertOk();

        $this->assertEquals(1, EventRate::count());
        $this->assertDatabaseMissing('event_rates', ['carrier' => 'IH']);
        $this->assertEquals(0, EventRateState::where('state_code', 'WA')->count());
    }

    public function test_import_rates_append_mode_adds_to_existing(): void
    {
        $typeId = EventType::factory()->create()->getKey();
        EventRate::create($this->rateArray($typeId, 'ASI'));

        $rows = [$this->rateRow($typeId, 'FDEAN', 'CA')];
        $file = $this->makeRateCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertOk()
             ->assertJsonPath('imported', 1);

        $this->assertEquals(2, EventRate::count()); // existing + new
    }

    public function test_import_rates_rejects_missing_column(): void
    {
        // CSV missing most required columns
        $csv  = "event_type_id,carrier,min_audience\n1,ASI,0\n";
        $file = UploadedFile::fake()->createWithContent('rates.csv', $csv);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertUnprocessable()
             ->assertJsonStructure(['message', 'missing']);
    }

    public function test_import_rates_rejects_invalid_row_data(): void
    {
        $typeId = EventType::factory()->create()->getKey();

        // rate = 'not-a-number'
        $rows = [$this->rateRow($typeId, 'ASI', 'CA', ['rate' => 'not-a-number'])];
        $file = $this->makeRateCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertUnprocessable()
             ->assertJsonStructure(['message', 'errors']);
    }

    public function test_import_rates_rejects_empty_csv(): void
    {
        $file = UploadedFile::fake()->createWithContent('rates.csv', '');

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertUnprocessable();
    }

    public function test_import_rates_skips_invalid_state_codes(): void
    {
        $typeId = EventType::factory()->create()->getKey();

        // 'XX' is invalid (not 2 uppercase letters matching /^[A-Z]{2}$/... actually XX does match)
        // Use states with some garbage interspersed
        $rows = [$this->rateRow($typeId, 'ASI', 'CA|INVALID|NY|')];
        $file = $this->makeRateCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import', ['file' => $file])
             ->assertOk();

        $rate = EventRate::first();
        $codes = EventRateState::where('event_rate_id', $rate->id)->pluck('state_code')->toArray();
        // 'INVALID' (7 chars) should be filtered out; 'CA' and 'NY' kept; '' (empty) filtered
        $this->assertContains('CA', $codes);
        $this->assertContains('NY', $codes);
        $this->assertNotContains('INVALID', $codes);
    }

    // ── Import GL limits ──────────────────────────────────────────────────────

    public function test_import_gl_limits_happy_path(): void
    {
        $rows = [
            ['carrier' => 'ASI', 'min_limit' => 0, 'max_limit' => 50, 'gl_limit' => '$1 million', 'gl_limit_type' => 'Aggregate'],
        ];
        $file = $this->makeGlCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import/gl', ['file' => $file])
             ->assertOk()
             ->assertJsonPath('imported', 1);

        $this->assertDatabaseHas('carrier_gl_limits', [
            'carrier'       => 'ASI',
            'gl_limit_type' => 'Aggregate',
        ]);
    }

    public function test_import_gl_limits_replace_mode(): void
    {
        CarrierGlLimit::factory()->create(['carrier' => 'IH']);

        $rows = [
            ['carrier' => 'ASI', 'min_limit' => 0, 'max_limit' => 100, 'gl_limit' => '$500,000', 'gl_limit_type' => 'Per Occurrence'],
        ];
        $file = $this->makeGlCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import/gl', ['file' => $file, 'replace' => true])
             ->assertOk();

        $this->assertEquals(1, CarrierGlLimit::count());
        $this->assertDatabaseMissing('carrier_gl_limits', ['carrier' => 'IH']);
    }

    public function test_import_gl_limits_rejects_missing_column(): void
    {
        $csv  = "carrier,min_limit\nASI,0\n";
        $file = UploadedFile::fake()->createWithContent('gl.csv', $csv);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import/gl', ['file' => $file])
             ->assertUnprocessable()
             ->assertJsonStructure(['message', 'missing']);
    }

    public function test_import_gl_limits_rejects_non_numeric_limit(): void
    {
        $rows = [
            ['carrier' => 'ASI', 'min_limit' => 'abc', 'max_limit' => 100, 'gl_limit' => '$1 million', 'gl_limit_type' => 'Aggregate'],
        ];
        $file = $this->makeGlCsv($rows);

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import/gl', ['file' => $file])
             ->assertUnprocessable();
    }

    public function test_import_gl_limits_rejects_empty_csv(): void
    {
        $file = UploadedFile::fake()->createWithContent('gl.csv', '');

        $this->actingAs($this->admin)
             ->postJson('/api/admin/rates/import/gl', ['file' => $file])
             ->assertUnprocessable();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Build a single event_rate CSV row array (all required columns).
     * carrier must be one of: ASI, FDEAN, IH
     */
    private function rateRow(int $typeId, string $carrier, string $states, array $overrides = []): array
    {
        return array_merge($this->rateArray($typeId, $carrier), ['states' => $states], $overrides);
    }

    /** Base event_rate attribute array (no states key — for direct model creation). */
    private function rateArray(int $typeId, string $carrier): array
    {
        return [
            'event_type_id'      => $typeId,
            'carrier'            => $carrier,
            'min_audience'       => 0,
            'max_audience'       => 50,
            'rate'               => '25.00',
            'min_limit'          => 100000,
            'max_limit'          => 300000,
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
        ];
    }

    /** Create a fake UploadedFile for event_rates CSV. */
    private function makeRateCsv(array $rows): UploadedFile
    {
        $headers = [
            'event_type_id', 'carrier', 'min_audience', 'max_audience',
            'rate', 'min_limit', 'max_limit', 'limit_type',
            'host_liquor', 'liquor', 'noha', 'w_o_s', 'p_a_n_c_b', 'e_a_i',
            'same_day_coverage', 'weekend_coverage', 'quote_instantly', 'bind_instantly',
            'additional_people', 'additional_charges', 'states',
        ];

        $lines = [implode(',', $headers)];
        foreach ($rows as $row) {
            // Convert boolean-ish values to 1/0 for CSV
            $csvRow = [];
            foreach ($headers as $h) {
                $val = $row[$h] ?? '';
                if (is_bool($val)) {
                    $csvRow[] = $val ? '1' : '0';
                } elseif (is_null($val)) {
                    $csvRow[] = '';
                } else {
                    // Wrap in quotes if contains comma
                    $csvRow[] = str_contains((string) $val, ',') ? '"' . $val . '"' : $val;
                }
            }
            $lines[] = implode(',', $csvRow);
        }

        return UploadedFile::fake()->createWithContent('rates.csv', implode("\n", $lines) . "\n");
    }

    /** Create a fake UploadedFile for carrier_gl_limits CSV. */
    private function makeGlCsv(array $rows): UploadedFile
    {
        $headers = ['carrier', 'min_limit', 'max_limit', 'gl_limit', 'gl_limit_type'];
        $lines   = [implode(',', $headers)];

        foreach ($rows as $row) {
            $csvRow = [];
            foreach ($headers as $h) {
                $val = $row[$h] ?? '';
                $csvRow[] = str_contains((string) $val, ',') ? '"' . $val . '"' : $val;
            }
            $lines[] = implode(',', $csvRow);
        }

        return UploadedFile::fake()->createWithContent('gl.csv', implode("\n", $lines) . "\n");
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
