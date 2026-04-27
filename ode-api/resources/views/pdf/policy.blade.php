<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Event Insurance Policy — Lead #{{ $lead->id }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; background: #fff; }
  .page { padding: 36px 48px; }

  /* Header */
  .header { border-bottom: 3px solid #105778; padding-bottom: 14px; margin-bottom: 20px; }
  .header-top { display: table; width: 100%; }
  .header-left { display: table-cell; vertical-align: middle; }
  .header-right { display: table-cell; text-align: right; vertical-align: middle; }
  .company-name { font-size: 22px; font-weight: bold; color: #105778; letter-spacing: -0.5px; }
  .company-tagline { font-size: 9px; color: #777; margin-top: 2px; }
  .doc-title { font-size: 15px; font-weight: bold; color: #105778; margin-top: 6px; }
  .lead-number { font-size: 10px; color: #555; }

  /* Section headings */
  h2 { font-size: 11px; font-weight: bold; color: #105778; background: #EEF6FB; padding: 5px 8px; margin: 18px 0 8px; border-left: 3px solid #105778; }

  /* Data table */
  table.data { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  table.data td { padding: 4px 8px; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
  table.data td.label { width: 38%; color: #666; font-size: 10px; }
  table.data td.value { font-weight: bold; }

  /* Coverage table */
  table.coverage { width: 100%; border-collapse: collapse; margin: 8px 0; }
  table.coverage th { background: #105778; color: #fff; padding: 5px 8px; text-align: left; font-size: 10px; }
  table.coverage td { padding: 5px 8px; border-bottom: 1px solid #e8e8e8; }
  table.coverage tr:nth-child(even) td { background: #f8f8f8; }

  /* Signature */
  .signature-block { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 18px; }
  .sig-line { border-bottom: 1px solid #333; width: 60%; margin: 20px 0 4px; height: 36px; }
  .sig-label { font-size: 9px; color: #666; }
  .sig-image { max-height: 36px; }

  /* Footer */
  .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 8px; color: #999; line-height: 1.5; }

  /* Badge */
  .badge { display: inline-block; background: #e6f4ea; color: #2d7a4f; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: bold; }
</style>
</head>
<body>
<div class="page">

  {{-- Header --}}
  <div class="header">
    <div class="header-top">
      <div class="header-left">
        <div class="company-name">One Day Event</div>
        <div class="company-tagline">Special Event Insurance</div>
      </div>
      <div class="header-right">
        <div class="doc-title">Event Insurance Policy</div>
        <div class="lead-number">Policy #{{ str_pad($lead->id, 6, '0', STR_PAD_LEFT) }}</div>
        <div class="lead-number">{{ now()->format('F j, Y') }}</div>
      </div>
    </div>
  </div>

  {{-- Carrier --}}
  @if($lead->carrier)
  <div style="margin-bottom:12px;">
    <table class="data">
      <tr>
        <td class="label">Underwritten by</td>
        <td class="value">{{ $lead->carrier }}</td>
        <td class="label">Coverage Limit</td>
        <td class="value">{{ $lead->coverage_limit ?? '—' }}</td>
      </tr>
    </table>
  </div>
  @endif

  {{-- Named Insured --}}
  <h2>Named Insured</h2>
  <table class="data">
    <tr>
      <td class="label">Name</td>
      <td class="value">{{ trim(($lead->ins_first_name ?? $lead->first_name ?? '') . ' ' . ($lead->ins_last_name ?? $lead->last_name ?? '')) ?: '—' }}</td>
      <td class="label">Email</td>
      <td class="value">{{ $lead->email ?? '—' }}</td>
    </tr>
    <tr>
      <td class="label">Address</td>
      <td class="value">{{ $lead->ins_street ?? $lead->street ?? '—' }}</td>
      <td class="label">Phone</td>
      <td class="value">{{ $lead->phone ?? '—' }}</td>
    </tr>
    <tr>
      <td class="label">City / State / Zip</td>
      <td class="value">{{ implode(', ', array_filter([$lead->ins_city, $lead->ins_state, $lead->ins_zip])) ?: '—' }}</td>
      <td class="label"></td>
      <td class="value"></td>
    </tr>
  </table>

  {{-- Event Details --}}
  <h2>Event Details</h2>
  <table class="data">
    <tr>
      <td class="label">Event Name</td>
      <td class="value">{{ $lead->event_name ?? '—' }}</td>
      <td class="label">Event Type</td>
      <td class="value">{{ $lead->event_type_label ?? '—' }}</td>
    </tr>
    <tr>
      <td class="label">Event Date</td>
      <td class="value">{{ $lead->event_date ? $lead->event_date->format('F j, Y') : '—' }}</td>
      <td class="label">State</td>
      <td class="value">{{ $lead->event_state ?? '—' }}</td>
    </tr>
    <tr>
      <td class="label">Estimated Guests</td>
      <td class="value">{{ $lead->no_of_people ?? '—' }}</td>
      <td class="label">Alcohol Served</td>
      <td class="value">{{ $lead->alcohol_served ?? '—' }}</td>
    </tr>
  </table>

  {{-- Venue --}}
  @if($lead->venue_name)
  <h2>Venue</h2>
  <table class="data">
    <tr>
      <td class="label">Venue Name</td>
      <td class="value">{{ $lead->venue_name }}</td>
      <td class="label">Contact</td>
      <td class="value">{{ $lead->contact_at_venue ?? '—' }}</td>
    </tr>
    <tr>
      <td class="label">Address</td>
      <td class="value">{{ implode(', ', array_filter([$lead->venue_address, $lead->venue_state, $lead->venue_zip])) ?: '—' }}</td>
      <td class="label">Phone</td>
      <td class="value">{{ $lead->venue_contact_number ?? '—' }}</td>
    </tr>
  </table>
  @endif

  {{-- Coverage --}}
  @if($plan = $lead->lead_offered_plans)
  <h2>Coverage &amp; Premium</h2>
  <table class="coverage">
    <tr>
      <th>Item</th>
      <th style="text-align:right;">Amount</th>
    </tr>
    <tr>
      <td>Base Premium</td>
      <td style="text-align:right;">${{ number_format($plan['premium'] ?? 0, 2) }}</td>
    </tr>
    @if(($plan['broker_fee'] ?? 0) > 0)
    <tr>
      <td>Broker Fee</td>
      <td style="text-align:right;">${{ number_format($plan['broker_fee'], 2) }}</td>
    </tr>
    @endif
    @if(($plan['processing_fee'] ?? 0) > 0)
    <tr>
      <td>Processing Fee</td>
      <td style="text-align:right;">${{ number_format($plan['processing_fee'], 2) }}</td>
    </tr>
    @endif
    @if(($plan['extra_charge'] ?? 0) > 0)
    <tr>
      <td>Additional Charges</td>
      <td style="text-align:right;">${{ number_format($plan['extra_charge'], 2) }}</td>
    </tr>
    @endif
    <tr style="font-weight:bold; background:#EEF6FB;">
      <td>Total</td>
      <td style="text-align:right;">${{ number_format($plan['total'] ?? 0, 2) }}</td>
    </tr>
  </table>
  @endif

  {{-- Additional Coverages --}}
  <h2>Coverage Options</h2>
  <table class="data">
    <tr>
      <td class="label">Waiver of Subrogation</td>
      <td class="value">{{ $lead->waiver_sub_status ? 'Yes' : 'No' }}</td>
      <td class="label">Hired / NOHA</td>
      <td class="value">{{ $lead->hired_status ? 'Yes' : 'No' }}</td>
    </tr>
    <tr>
      <td class="label">Primary &amp; Non-Contrib.</td>
      <td class="value">{{ $lead->primary_basis ? 'Yes' : 'No' }}</td>
      <td class="label">Additional Insured</td>
      <td class="value">{{ $lead->additional_insured ?? 'None' }}</td>
    </tr>
  </table>

  {{-- Signature --}}
  <div class="signature-block">
    <p style="font-size:10px; margin-bottom:12px; color:#444;">
      By signing below, the Named Insured acknowledges that all information provided is accurate and complete,
      and agrees to the terms and conditions of this event insurance policy.
    </p>
    <div style="display:table; width:100%;">
      <div style="display:table-cell; width:60%;">
        <p class="sig-label">Signature of Applicant</p>
        @if($lead->e_signature)
          <div style="margin: 6px 0 4px;">
            <img src="{{ $lead->e_signature }}" class="sig-image" alt="Signature" />
          </div>
        @else
          <div class="sig-line"></div>
        @endif
        <p class="sig-label">{{ trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? '')) ?: 'Applicant Name' }}</p>
      </div>
      <div style="display:table-cell; width:40%; text-align:right; vertical-align:bottom;">
        <p class="sig-label">Date</p>
        <div style="border-bottom:1px solid #333; width:80%; margin: 0 0 4px auto; height:36px;"></div>
        <p class="sig-label">{{ now()->format('F j, Y') }}</p>
      </div>
    </div>
  </div>

  {{-- Footer --}}
  <div class="footer">
    <p><strong>One Day Event</strong> · Special Event Insurance · www.onedayevent.com</p>
    <p>This policy document is issued subject to all terms, conditions, and exclusions contained herein.
    For questions regarding this policy, please contact our support team.</p>
    <p>Policy #{{ str_pad($lead->id, 6, '0', STR_PAD_LEFT) }} · Generated {{ now()->format('Y-m-d H:i') }} UTC</p>
  </div>

</div>
</body>
</html>
