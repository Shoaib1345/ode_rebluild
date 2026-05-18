<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CarrierGlLimit;
use App\Models\EventRate;
use App\Models\EventRateState;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Admin Rate Import (§23).
 *
 * POST /admin/rates/import          → import event_rates CSV
 * POST /admin/rates/import/gl       → import carrier_gl_limits CSV
 * GET  /admin/rates/template        → download event_rates CSV template
 * GET  /admin/rates/template/gl     → download carrier_gl_limits CSV template
 * GET  /admin/rates/stats           → row counts
 */
class RateImportController extends Controller
{
    // ── Column definitions ────────────────────────────────────────────────────

    private const RATE_HEADERS = [
        'event_type_id', 'carrier',
        'min_audience', 'max_audience',
        'rate', 'min_limit', 'max_limit', 'limit_type',
        'host_liquor', 'liquor', 'noha', 'w_o_s', 'p_a_n_c_b', 'e_a_i',
        'same_day_coverage', 'weekend_coverage',
        'quote_instantly', 'bind_instantly',
        'additional_people', 'additional_charges',
        'states',   // pipe-separated 2-letter codes, e.g. CA|NY|TX
    ];

    private const GL_HEADERS = [
        'carrier', 'min_limit', 'max_limit', 'gl_limit', 'gl_limit_type',
    ];

    private const BOOLEAN_FIELDS = [
        'host_liquor', 'liquor', 'noha', 'w_o_s', 'p_a_n_c_b', 'e_a_i',
        'same_day_coverage', 'weekend_coverage',
        'quote_instantly', 'bind_instantly',
        'additional_people', 'additional_charges',
    ];

    // ── Import event_rates ────────────────────────────────────────────────────

    public function importRates(Request $request): JsonResponse
    {
        $request->validate([
            'file'    => 'required|file|mimes:csv,txt|max:5120',
            'replace' => 'sometimes|boolean',
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        if ($handle === false) {
            return response()->json(['message' => 'Could not read uploaded file.'], 422);
        }

        // Read header row
        $headers = fgetcsv($handle);
        if ($headers === false || $headers === null) {
            fclose($handle);
            return response()->json(['message' => 'CSV file is empty.'], 422);
        }

        // Normalize headers (trim + lowercase)
        $headers = array_map(fn ($h) => strtolower(trim($h)), $headers);
        $missing = array_diff(self::RATE_HEADERS, $headers);
        if ($missing) {
            fclose($handle);
            return response()->json([
                'message' => 'CSV is missing required columns.',
                'missing' => array_values($missing),
            ], 422);
        }

        $colIndex = array_flip($headers);

        // Parse all rows first so we can validate before touching the DB
        $rows   = [];
        $errors = [];
        $line   = 1; // 1-indexed (header = line 0)

        while (($row = fgetcsv($handle)) !== false) {
            $line++;
            if (count($row) < count($headers)) {
                $errors[] = "Line {$line}: too few columns.";
                continue;
            }

            $data = [];
            foreach (self::RATE_HEADERS as $col) {
                $data[$col] = trim($row[$colIndex[$col]] ?? '');
            }

            // Basic numeric validations
            $v = Validator::make($data, [
                'event_type_id'  => 'required|integer|min:1',
                'carrier'        => 'required|string|max:100',
                'min_audience'   => 'required|integer|min:0',
                'max_audience'   => 'required|integer|min:0',
                'rate'           => 'required|numeric|min:0',
                'min_limit'      => 'required|integer|min:0',
                'max_limit'      => 'required|integer|min:0',
                'limit_type'     => 'required|string|max:50',
                'states'         => 'required|string',
            ]);

            if ($v->fails()) {
                foreach ($v->errors()->all() as $err) {
                    $errors[] = "Line {$line}: {$err}";
                }
                continue;
            }

            // Parse boolean fields (1/0/true/false/yes/no)
            foreach (self::BOOLEAN_FIELDS as $field) {
                $data[$field] = $this->parseBool($data[$field]);
            }

            // Parse states
            $states = array_filter(
                array_map('strtoupper', explode('|', $data['states'])),
                fn ($s) => preg_match('/^[A-Z]{2}$/', $s)
            );
            $data['_states'] = array_values($states);
            unset($data['states']);

            $rows[] = $data;
        }

        fclose($handle);

        if ($errors) {
            return response()->json([
                'message' => 'Validation errors found in CSV.',
                'errors'  => $errors,
            ], 422);
        }

        if (empty($rows)) {
            return response()->json(['message' => 'CSV contains no data rows.'], 422);
        }

        // ── Write to DB ───────────────────────────────────────────────────────
        $imported = 0;
        DB::transaction(function () use ($rows, $request, &$imported) {
            if ($request->boolean('replace')) {
                EventRateState::query()->delete();
                EventRate::query()->delete();
            }

            foreach ($rows as $data) {
                $stateList = $data['_states'];
                unset($data['_states']);

                $rate = EventRate::create($data);

                foreach ($stateList as $code) {
                    EventRateState::create([
                        'event_rate_id' => $rate->id,
                        'state_code'    => $code,
                    ]);
                }

                $imported++;
            }
        });

        return response()->json([
            'message'  => "{$imported} rate row(s) imported successfully.",
            'imported' => $imported,
        ]);
    }

    // ── Import carrier_gl_limits ──────────────────────────────────────────────

    public function importGlLimits(Request $request): JsonResponse
    {
        $request->validate([
            'file'    => 'required|file|mimes:csv,txt|max:2048',
            'replace' => 'sometimes|boolean',
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        if ($handle === false) {
            return response()->json(['message' => 'Could not read uploaded file.'], 422);
        }

        $headers = fgetcsv($handle);
        if ($headers === false || $headers === null) {
            fclose($handle);
            return response()->json(['message' => 'CSV file is empty.'], 422);
        }

        $headers = array_map(fn ($h) => strtolower(trim($h)), $headers);
        $missing = array_diff(self::GL_HEADERS, $headers);
        if ($missing) {
            fclose($handle);
            return response()->json([
                'message' => 'CSV is missing required columns.',
                'missing' => array_values($missing),
            ], 422);
        }

        $colIndex = array_flip($headers);
        $rows     = [];
        $errors   = [];
        $line     = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $line++;
            if (count($row) < count($headers)) {
                $errors[] = "Line {$line}: too few columns.";
                continue;
            }

            $data = [];
            foreach (self::GL_HEADERS as $col) {
                $data[$col] = trim($row[$colIndex[$col]] ?? '');
            }

            $v = Validator::make($data, [
                'carrier'       => 'required|string|max:100',
                'min_limit'     => 'required|integer|min:0',
                'max_limit'     => 'required|integer|min:0',
                'gl_limit'      => 'required|string|max:30',   // display string e.g. "$1 million"
                'gl_limit_type' => 'required|string|max:50',
            ]);

            if ($v->fails()) {
                foreach ($v->errors()->all() as $err) {
                    $errors[] = "Line {$line}: {$err}";
                }
                continue;
            }

            $rows[] = $data;
        }

        fclose($handle);

        if ($errors) {
            return response()->json([
                'message' => 'Validation errors found in CSV.',
                'errors'  => $errors,
            ], 422);
        }

        if (empty($rows)) {
            return response()->json(['message' => 'CSV contains no data rows.'], 422);
        }

        $imported = 0;
        DB::transaction(function () use ($rows, $request, &$imported) {
            if ($request->boolean('replace')) {
                CarrierGlLimit::query()->delete();
            }

            foreach ($rows as $data) {
                CarrierGlLimit::create($data);
                $imported++;
            }
        });

        return response()->json([
            'message'  => "{$imported} GL limit row(s) imported successfully.",
            'imported' => $imported,
        ]);
    }

    // ── CSV templates ─────────────────────────────────────────────────────────

    public function rateTemplate(): StreamedResponse
    {
        $example = [
            1, 'ASI',
            0, 50,
            25.00, 100000, 300000, 'per_occurrence',
            1, 0, 'N/A', 'N/A', 'N/A', 'N/A',
            1, 1, 1, 1, 0, 0,
            'CA|NY|TX',
        ];

        return response()->streamDownload(function () use ($example) {
            $out = fopen('php://output', 'w');
            fputcsv($out, self::RATE_HEADERS);
            fputcsv($out, $example);
            fclose($out);
        }, 'event_rates_template.csv', ['Content-Type' => 'text/csv']);
    }

    public function glLimitsTemplate(): StreamedResponse
    {
        $example = ['ASI', 100000, 300000, '$1 million', 'Per Occurrence'];

        return response()->streamDownload(function () use ($example) {
            $out = fopen('php://output', 'w');
            fputcsv($out, self::GL_HEADERS);
            fputcsv($out, $example);
            fclose($out);
        }, 'carrier_gl_limits_template.csv', ['Content-Type' => 'text/csv']);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public function stats(): JsonResponse
    {
        return response()->json([
            'event_rates_count'     => EventRate::count(),
            'event_rate_states_count' => EventRateState::count(),
            'carrier_gl_limits_count' => CarrierGlLimit::count(),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function parseBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        return in_array(strtolower((string) $value), ['1', 'true', 'yes'], true);
    }
}
