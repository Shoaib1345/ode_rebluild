<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadFile;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use mikehaertl\pdftk\Pdf;

/**
 * Fills the pre-signed, pre-stamped COI PDF template with lead data using PDFtk.
 *
 * Template:  storage/app/cois/template.pdf
 *            (= production sample_certificate_new_1_fillable.pdf — already carries
 *             the agency signature image baked in as a non-editable layer)
 *
 * ── CHECKBOX / BUTTON FIELD RULES ───────────────────────────────────────────
 * PDFtk requires the exact FieldStateOption value (not "Yes" / "true"):
 *
 *   Field key                      | On value                       | Off value
 *   -------------------------------|--------------------------------|----------
 *   commercial_general_liability   | COMMERCIAL GENERAL LIABILITY   | Off
 *   occur                          | OCCUR                          | Off
 *   claims_made                    | CLAIMS-MADE                    | Off
 *   commercial_gl_addl_insd        | ADDL INSD                      | Off
 *   commercial_gl_subr_wvd         | SUBR WVD                       | Off
 *   host_liqour                    | HOST LIQOUR                    | Off
 *
 * Text fields (multi-line, FieldFlags: 4096) such as agency_address,
 * insured_address, and certificate_holder_address accept "\n " line breaks.
 *
 * Prerequisites:
 *   - PDFtk binary installed:
 *       Windows: C:\Program Files (x86)\PDFtk\bin\pdftk.exe
 *       Linux:   /usr/bin/pdftk
 *   - Template at: storage/app/cois/template.pdf
 */
class CertificateService
{
    // ── Hardcoded agency / producer info ─────────────────────────────────────

    private const AGENCY_NAME    = 'Jeewanjee Insurance Agency';
    private const AGENCY_ADDRESS = '1494 Hamilton Ave Suite 103';
    private const AGENCY_CITY    = 'San Jose';
    private const AGENCY_STATE   = 'CA';
    private const AGENCY_ZIP     = '95125';
    private const CONTACT_NAME   = 'Zain Jeewanjee';
    private const CONTACT_PHONE  = '408-217-6787';
    private const CONTACT_FAX    = '408-997-7890';
    private const CONTACT_EMAIL  = 'support@onedayevent.com';

    // ── Carrier → insurer name + NAIC mapping ─────────────────────────────────

    private const CARRIER_MAP = [
        'Thimble' => [
            'name' => 'National Specialty Insurance Company', 'naic' => '22608',
        ],
        'FDean'  => [
            'name' => 'United States Fire Insurance Company', 'naic' => '21113',
        ],
        'FDEAN'  => [
            'name' => 'United States Fire Insurance Company', 'naic' => '21113',
        ],
        'HCC'    => [
            'name'  => 'New Hampshire Insurance Company',      'naic'  => '23841',
            'name2' => 'United States Fire Insurance Company', 'naic2' => '21113',
        ],
        'ASI'    => [
            'name' => 'Arch Insurance Company',                'naic' => '11150',
        ],
        'K&K'    => [
            'name' => 'Nationwide Mutual Insurance Company',   'naic' => '23787',
        ],
        'IH'     => [
            'name' => 'Evanston Insurance Company',            'naic' => '35378',
        ],
    ];

    /**
     * Boolean button fields: maps form key → PDFtk On-state value.
     * generateFromFields() converts PHP bool → On value or 'Off'.
     */
    private const BUTTON_STATES = [
        // CGL
        'commercial_general_liability'    => 'COMMERCIAL GENERAL LIABILITY',
        'occur'                           => 'OCCUR',
        'claims_made'                     => 'CLAIMS-MADE',
        'commercial_gl_addl_insd'         => 'ADDL INSD',
        'commercial_gl_subr_wvd'          => 'SUBR WVD',
        'host_liqour'                     => 'HOST LIQOUR',
        // CGL Gen'l Aggregate Limit Applies Per
        'policy'                          => 'POLICY',
        'pro_ject'                        => 'PRO-JECT',
        'loc'                             => 'LOC',
        'other'                           => 'OTHER',
        // Automobile Liability
        'auto_mobile_liability_addl_insd' => 'ADDL INSD',
        'auto_mobile_liability_subr_wvd'  => 'SUBR WVD',
        // Umbrella / Excess
        'umbrella_or_excess_addl_insd'    => 'ADDL INSD',
        'excluded_subr_wvd'               => 'SUBR WVD',
    ];

    /**
     * Multi-state button fields: frontend sends the exact PDFtk state value
     * (e.g. 'ANY AUTO', 'PER STATUTE'). Empty string → 'Off'.
     */
    private const PASSTHROUGH_BUTTONS = [
        'auto_mobile_liability',
        'umbrella_liab',
        'excess_liab',
        'ded_or_retention',
        'statute',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Auto-generate a filled COI PDF for the given lead (payment-triggered flow).
     *
     * Returns the storage-relative path, e.g. "cois/filled_claims/42-coi.pdf".
     *
     * @throws \RuntimeException on PDFtk failure.
     */
    public function generate(Lead $lead): string
    {
        $outputPath = $this->outputPath($lead->id);

        $fields = $this->buildFields($lead);
        $this->fillPdf($this->templatePath(), $fields, $outputPath);

        return "cois/filled_claims/{$lead->id}-coi.pdf";
    }

    /**
     * Persist a LeadFile record so the COI is visible in the customer portal.
     *
     * @param  string|null  $name      Display title; defaults to "Certificate of Insurance - ODE00{id}.pdf"
     * @param  string       $category  Defaults to "Certificate"
     */
    public function recordFile(
        Lead    $lead,
        string  $storagePath,
        ?string $name     = null,
        string  $category = 'Certificate'
    ): LeadFile {
        return $lead->files()->create([
            'name'             => $name ?? "Certificate of Insurance - ODE00{$lead->id}.pdf",
            'category'         => $category,
            'path'             => $storagePath,
            'send_to_customer' => true,
            'comments'         => 'Generated via admin COI wizard.',
        ]);
    }

    /**
     * Generate a filled COI PDF from wizard-submitted field values.
     *
     * The wizard sends boolean values for checkbox fields and split address
     * parts for address fields.  This method:
     *   1. Removes non-PDF metadata keys (coi_name, coi_category)
     *   2. Joins split address fields → multiline PDF field
     *   3. Converts boolean → exact PDFtk button-state value
     *   4. Fills and flattens the PDF
     *
     * @param  array<string,mixed>  $fields  Wizard form data
     * @throws \RuntimeException
     */
    public function generateFromFields(Lead $lead, array $fields): string
    {
        $outputPath = $this->outputPath($lead->id);
        $pdf        = $fields;

        // ── Strip non-PDF metadata ────────────────────────────────────────────
        unset($pdf['coi_name'], $pdf['coi_category']);

        // ── Join split address fields into multiline PDF fields ───────────────
        $pdf['agency_address'] = $this->joinAddress(
            $pdf['agency_address'] ?? '',
            $pdf['agency_city']    ?? '',
            $pdf['agency_state']   ?? '',
            $pdf['agency_zipcode'] ?? ''
        );
        unset($pdf['agency_city'], $pdf['agency_state'], $pdf['agency_zipcode']);

        $pdf['insured_address'] = $this->joinAddress(
            $pdf['insured_address'] ?? '',
            $pdf['insured_city']    ?? '',
            $pdf['insured_state']   ?? '',
            $pdf['insured_zipcode'] ?? ''
        );
        unset($pdf['insured_city'], $pdf['insured_state'], $pdf['insured_zipcode']);

        $pdf['certificate_holder_address'] = $this->joinAddress(
            $pdf['certificate_holder_address'] ?? '',
            $pdf['certificate_holder_city']    ?? '',
            $pdf['certificate_holder_state']   ?? '',
            $pdf['certificate_holder_zipcode'] ?? ''
        );
        unset(
            $pdf['certificate_holder_city'],
            $pdf['certificate_holder_state'],
            $pdf['certificate_holder_zipcode']
        );

        // ── Boolean → PDFtk On/Off ────────────────────────────────────────────
        foreach (self::BUTTON_STATES as $key => $onValue) {
            if (array_key_exists($key, $pdf)) {
                $pdf[$key] = $pdf[$key] ? $onValue : 'Off';
            }
        }

        // ── Multi-state passthrough: empty string → 'Off' ────────────────────
        foreach (self::PASSTHROUGH_BUTTONS as $key) {
            if (array_key_exists($key, $pdf)) {
                $pdf[$key] = $pdf[$key] ?: 'Off';
            }
        }

        // ── Automobile eff/exp — remap friendly keys to PDF field names ───────
        if (isset($pdf['auto_mobile_policy_eff'])) {
            $pdf['MMDDYYYY POLICY EFFRow5'] = $pdf['auto_mobile_policy_eff'];
            unset($pdf['auto_mobile_policy_eff']);
        }
        if (isset($pdf['auto_mobile_policy_exp'])) {
            $pdf['MMDDYYYY POLICY EXPRow5'] = $pdf['auto_mobile_policy_exp'];
            unset($pdf['auto_mobile_policy_exp']);
        }

        // ── Deductible heading (always present so the column label renders) ───
        if (isset($pdf['deductible'])) {
            $pdf['deductible_heading'] = 'Deductible';
        }

        $this->fillPdf($this->templatePath(), $pdf, $outputPath);

        return "cois/filled_claims/{$lead->id}-coi.pdf";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — field building
    // ─────────────────────────────────────────────────────────────────────────

    /** Build the complete field map from lead data (auto-generation path). */
    private function buildFields(Lead $lead): array
    {
        $plan    = $lead->lead_offered_plans ?? [];
        $carrier = $lead->carrier ?? ($plan['carrier'] ?? '');

        [$insurerName, $naicNo, $insurerName2, $naicNo2] = $this->resolveCarrier($carrier);
        [$effectiveDate, $expirationDate]                  = $this->resolveDates($lead);
        [$certNumber, $policyNumber]                       = $this->resolvePolicyNumbers($carrier, $lead->event_type_id);
        [$minLimit, $maxLimit]                             = $this->resolveLimits($plan);

        $hasAlcohol = in_array($lead->alcohol_served, ['hosted', 'sold'], true);
        $hasWaiver  = (bool) $lead->waiver_sub_status;

        $insuredName    = trim(($lead->ins_first_name ?? '') . ' ' . ($lead->ins_last_name ?? ''))
                          ?: trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? ''));

        $insuredAddress = $this->joinAddress(
            $lead->ins_street  ?? $lead->street,
            $lead->ins_city    ?? $lead->city,
            $lead->ins_state   ?? $lead->event_state,
            $lead->ins_zip     ?? $lead->zip
        );
        $agencyAddress  = $this->joinAddress(
            self::AGENCY_ADDRESS, self::AGENCY_CITY, self::AGENCY_STATE, self::AGENCY_ZIP
        );
        $holderAddress  = $this->joinAddress(
            $lead->venue_address ?? $lead->street,
            $lead->city,
            $lead->venue_state  ?? $lead->event_state,
            $lead->venue_zip    ?? $lead->zip
        );

        return [
            // ── Producer ─────────────────────────────────────────────────────
            'application_date' => now()->format('m/d/Y'),
            'agency_name'      => self::AGENCY_NAME,
            'agency_address'   => $agencyAddress,
            'contact_name'     => self::CONTACT_NAME,
            'contact_phone'    => self::CONTACT_PHONE,
            'contact_fax'      => self::CONTACT_FAX,
            'contact_email'    => self::CONTACT_EMAIL,

            // ── Insured ──────────────────────────────────────────────────────
            'insured_name'    => $insuredName,
            'insured_address' => $insuredAddress,

            // ── Insurers (slots A–F; only A and sometimes B are used) ─────────
            'insurance_a'    => $insurerName,
            'naic_insurer_a' => $naicNo,
            'insurance_b'    => $insurerName2,
            'naic_insurer_b' => $naicNo2,
            'insurance_c'    => '', 'naic_insurer_c' => '',
            'insurance_d'    => '', 'naic_insurer_d' => '',
            'insurance_e'    => '', 'naic_insurer_e' => '',
            'insurance_f'    => '', 'naic_insurer_f' => '',

            // ── Certificate meta ─────────────────────────────────────────────
            'certificate_number' => $certNumber,
            'revision_number'    => '0',

            // ── CGL checkboxes ────────────────────────────────────────────────
            'commercial_general_liability' => 'COMMERCIAL GENERAL LIABILITY',
            'occur'                        => 'OCCUR',
            'claims_made'                  => 'Off',
            'commercial_gl_addl_insd'      => 'ADDL INSD',
            'commercial_gl_subr_wvd'       => $hasWaiver ? 'SUBR WVD' : 'Off',
            'host_liqour'                  => $hasAlcohol ? 'HOST LIQOUR' : 'Off',

            // ── CGL Gen'l Aggregate Limit Applies Per ─────────────────────────
            'policy'   => 'POLICY',
            'pro_ject' => 'Off',
            'loc'      => 'Off',
            'other'    => 'Off',

            // ── CGL policy & dates ────────────────────────────────────────────
            'commercial_gl_policy_number' => $policyNumber,
            'commercial_gl_policy_eff'    => $effectiveDate,
            'commercial_gl_policy_exp'    => $expirationDate,

            // ── CGL coverage limits ───────────────────────────────────────────
            'commercial_gl_each_occurrence'     => '$' . number_format($minLimit * 1_000_000),
            'commercial_gl_general_aggregate'   => '$' . number_format($maxLimit * 1_000_000),
            'commercial_gl_products_comp'       => '$' . number_format($maxLimit * 1_000_000),
            'commercial_gl_personal_adv_injury' => '$' . number_format($minLimit * 1_000_000),
            'commercial_gl_med_exp'             => '$5,000',
            'commercial_gl_rented_premises'     => '$100,000',
            'deductible'                        => '',
            'deductible_heading'                => 'Deductible',

            // ── Automobile Liability — not applicable for event insurance ─────
            'auto_mobile_liability'           => 'Off',
            'auto_mobile_liability_addl_insd' => 'Off',
            'auto_mobile_liability_subr_wvd'  => 'Off',
            'auto_mobile_policy_number'       => '',
            'combined_single_limit'           => '',
            'bodily_injury_per_person'        => '',
            'bodily_injury_per_accident'      => '',
            'property_damage_per_accident'    => '',

            // ── Umbrella / Excess — not applicable for event insurance ─────────
            'umbrella_liab'                  => 'Off',
            'excess_liab'                    => 'Off',
            'umbrella_or_excess_addl_insd'   => 'Off',
            'excluded_subr_wvd'              => 'Off',
            'ded_or_retention'               => 'Off',
            'retention_amount'               => '',
            'umbrella_or_excess_policy_number' => '',
            'umbrella_or_excess_policy_eff'  => '',
            'umbrella_or_excess_policy_exp'  => '',
            'umbrella_each_occurrence'        => '',
            'umbrella_aggregate'              => '',

            // ── Workers Compensation — not applicable for event insurance ─────
            'statute'                                    => 'Off',
            'workers_compensation'                       => '',
            'workers_compensation_policy_number'         => '',
            'workers_compensation_each_accident'         => '',
            'workers_compensation_disease_employee'      => '',
            'workers_compensation_disease_policy_limit'  => '',

            // ── Certificate holder (venue) ────────────────────────────────────
            'certificate_holder_name'    => $lead->venue_name ?? '',
            'certificate_holder_address' => $holderAddress,

            // ── Description of operations ─────────────────────────────────────
            'description_of_operations' => $this->buildDescription($lead),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Resolve insurer name + NAIC from carrier string. */
    private function resolveCarrier(string $carrier): array
    {
        $map = self::CARRIER_MAP[$carrier] ?? [];
        return [
            $map['name']  ?? $carrier,
            $map['naic']  ?? '',
            $map['name2'] ?? '',
            $map['naic2'] ?? '',
        ];
    }

    /**
     * Resolve effective and expiration dates.
     *
     * effective  = event date
     * expiration = event date + 1 day
     */
    private function resolveDates(Lead $lead): array
    {
        $start = $lead->event_date instanceof \Carbon\Carbon
            ? $lead->event_date->copy()
            : ($lead->event_date ? Carbon::parse($lead->event_date) : now());

        return [
            $start->format('m/d/Y'),
            $start->copy()->addDay()->format('m/d/Y'),
        ];
    }

    /**
     * Resolve certificate + policy numbers.
     *
     * FDean + specific event types (Birthday, Wedding, Vendor) get hard-coded
     * numbers matching the production system; everything else is blank.
     */
    private function resolvePolicyNumbers(string $carrier, ?int $eventTypeId): array
    {
        if (
            in_array($carrier, ['FDean', 'FDEAN'], true) &&
            in_array($eventTypeId, [32, 10, 72], true)
        ) {
            return ['USS474691', 'SRPGAPML-101-0722'];
        }

        return ['', ''];
    }

    /**
     * Resolve coverage limits in millions from the lead's offered plan.
     * Falls back to 1M / 2M.
     */
    private function resolveLimits(array $plan): array
    {
        return [
            (int) ($plan['min_limit'] ?? 1),
            (int) ($plan['max_limit'] ?? 2),
        ];
    }

    /**
     * Join address parts into a two-line string the same way production does.
     *
     *   Line 1: street
     *   Line 2: city state zip  (space-separated, prefixed with \n + space)
     */
    private function joinAddress(
        ?string $street,
        ?string $city,
        ?string $state,
        ?string $zip
    ): string {
        $line1 = trim($street ?? '');
        $line2 = trim(implode(' ', array_filter([$city, $state, $zip])));
        return $line1 . ($line2 ? "\n " . $line2 : '');
    }

    /** Build the description-of-operations text block. */
    private function buildDescription(Lead $lead): string
    {
        $parts = array_filter([
            $lead->event_type_label ? 'Event Type: ' . $lead->event_type_label : null,
            $lead->event_name       ? 'Event Name: ' . $lead->event_name       : null,
            $lead->event_date
                ? 'Event Date: ' . (
                    $lead->event_date instanceof \Carbon\Carbon
                        ? $lead->event_date->format('m/d/Y')
                        : Carbon::parse($lead->event_date)->format('m/d/Y')
                  )
                : null,
            $lead->event_state  ? 'State: '  . $lead->event_state  : null,
            $lead->no_of_people ? 'Guests: ' . $lead->no_of_people : null,
        ]);

        $description = implode(' | ', $parts);

        // List named additional insureds in the description box (ACORD practice).
        $aiLine = $this->formatAdditionalInsureds($lead->additional_insured_details);
        if ($aiLine !== '') {
            $description .= ($description !== '' ? "\n\n" : '') . $aiLine;
        }

        return $description;
    }

    /**
     * Format named additional insureds for the certificate, e.g.
     * "Additional Insureds: Acme Venue (Venue), Bob Caterer." Empty when none.
     *
     * @param  array<int,array<string,mixed>>|null  $details
     */
    public function formatAdditionalInsureds(?array $details): string
    {
        if (! is_array($details) || count($details) === 0) {
            return '';
        }

        $names = array_values(array_filter(array_map(function ($ai) {
            $name = trim((string) ($ai['name'] ?? ''));
            if ($name === '') {
                return null;
            }
            $relation = trim((string) ($ai['relation'] ?? ''));
            return $relation !== '' ? "{$name} ({$relation})" : $name;
        }, $details)));

        return $names ? 'Additional Insureds: ' . implode(', ', $names) . '.' : '';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — PDF filling
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fill the PDF form using PDFtk and flatten it to a final non-editable PDF.
     *
     * @throws \RuntimeException if PDFtk reports an error.
     */
    private function fillPdf(string $templatePath, array $fields, string $outputPath): void
    {
        if (! is_dir(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        $pdf = new Pdf($templatePath, [
            'command' => $this->pdftkBinary(),
            'useExec' => true,
        ]);

        $result = $pdf->fillForm($fields)
                      ->flatten()
                      ->saveAs($outputPath);

        if ($result === false) {
            $error = $pdf->getError();
            Log::error('CertificateService: PDFtk fill failed', [
                'template' => $templatePath,
                'error'    => $error,
            ]);
            throw new \RuntimeException('COI PDF generation failed: ' . $error);
        }
    }

    /** Absolute path to the COI template. */
    private function templatePath(): string
    {
        return storage_path('app/cois/template.pdf');
    }

    /** Absolute path for the filled output. */
    private function outputPath(int $leadId): string
    {
        return storage_path("app/cois/filled_claims/{$leadId}-coi.pdf");
    }

    /** Resolve the PDFtk binary path (config override → OS default). */
    private function pdftkBinary(): string
    {
        $custom = config('services.pdftk.path');
        if ($custom) {
            return $custom;
        }

        return PHP_OS_FAMILY === 'Windows'
            ? 'C:\Program Files (x86)\PDFtk\bin\pdftk.exe'
            : '/usr/bin/pdftk';
    }
}
