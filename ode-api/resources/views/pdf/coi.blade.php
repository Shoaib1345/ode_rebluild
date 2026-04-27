<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate of Insurance — Lead #{{ $lead->id }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #222; }
  .page { padding: 24px 32px; }

  .header { background: #105778; color: #fff; padding: 12px 16px; margin-bottom: 0; }
  .header-title { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
  .header-sub { font-size: 9px; opacity: 0.85; margin-top: 2px; }

  .acord-notice { background: #f5f5f5; border: 1px solid #ddd; border-top: none; padding: 6px 10px; font-size: 8px; color: #777; margin-bottom: 12px; line-height: 1.4; }

  .grid { display: table; width: 100%; border-collapse: collapse; }
  .grid-row { display: table-row; }
  .grid-cell { display: table-cell; border: 1px solid #ccc; padding: 6px 8px; vertical-align: top; }
  .grid-cell.half { width: 50%; }
  .grid-cell.full { width: 100%; }

  .cell-label { font-size: 7.5px; text-transform: uppercase; color: #888; font-weight: bold; letter-spacing: 0.3px; margin-bottom: 3px; }
  .cell-value { font-size: 10px; font-weight: bold; color: #111; }
  .cell-value.small { font-size: 9px; }

  h3 { font-size: 9px; text-transform: uppercase; background: #dde8f0; color: #105778; padding: 4px 8px; font-weight: bold; letter-spacing: 0.4px; border: 1px solid #b8cfe0; margin-top: 0; }

  table.coverage { width: 100%; border-collapse: collapse; }
  table.coverage th { font-size: 8px; text-transform: uppercase; color: #777; padding: 3px 6px; border: 1px solid #ccc; background: #f5f5f5; }
  table.coverage td { padding: 4px 6px; border: 1px solid #ddd; font-size: 9px; }

  .signature-row { display: table; width: 100%; margin-top: 12px; }
  .sig-cell { display: table-cell; border: 1px solid #ccc; padding: 8px; width: 60%; }
  .auth-cell { display: table-cell; border: 1px solid #ccc; padding: 8px; width: 40%; text-align: center; }

  .important { background: #fffbe6; border: 1px solid #f0d060; padding: 6px 8px; font-size: 8px; margin-top: 8px; color: #7a5e00; line-height: 1.5; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-title">CERTIFICATE OF LIABILITY INSURANCE</div>
    <div class="header-sub">DATE ISSUED: {{ now()->format('m/d/Y') }} &nbsp;|&nbsp; THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY</div>
  </div>

  <div class="acord-notice">
    This certificate is issued as a matter of information only and confers no rights upon the certificate holder. This certificate does not affirmatively or negatively amend,
    extend or alter the coverage afforded by the policies below. This certificate of insurance does not constitute a contract between the issuing insurer(s), authorized
    representative or producer, and the certificate holder.
  </div>

  {{-- Producer / Insurer --}}
  <div class="grid" style="margin-bottom:0;">
    <div class="grid-row">
      <div class="grid-cell half">
        <div class="cell-label">Producer / Agent</div>
        <div class="cell-value">One Day Event</div>
        <div class="cell-value small">Special Event Insurance</div>
        <div class="cell-value small">www.onedayevent.com</div>
      </div>
      <div class="grid-cell half">
        <div class="cell-label">Insurer(s) Affording Coverage</div>
        <div class="cell-value">{{ $lead->carrier ?? 'See Policy' }}</div>
      </div>
    </div>
    <div class="grid-row">
      <div class="grid-cell full">
        <div class="cell-label">Insured</div>
        <div class="cell-value">{{ trim(($lead->ins_first_name ?? $lead->first_name ?? '') . ' ' . ($lead->ins_last_name ?? $lead->last_name ?? '')) ?: '—' }}</div>
        <div class="cell-value small">{{ implode(', ', array_filter([$lead->ins_street ?? $lead->street, $lead->ins_city, $lead->ins_state, $lead->ins_zip])) }}</div>
        <div class="cell-value small">{{ $lead->email ?? '' }}</div>
      </div>
    </div>
  </div>

  {{-- Coverages --}}
  <h3 style="margin-top:10px;">Coverages / Certificate Number: {{ str_pad($lead->id, 6, '0', STR_PAD_LEFT) }}</h3>
  <table class="coverage">
    <thead>
      <tr>
        <th>Type of Insurance</th>
        <th>Policy Number</th>
        <th>Policy Eff.</th>
        <th>Policy Exp.</th>
        <th>Limits</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Special Event Liability</strong></td>
        <td>ODE-{{ str_pad($lead->id, 8, '0', STR_PAD_LEFT) }}</td>
        <td>{{ $lead->event_date ? $lead->event_date->format('m/d/Y') : '—' }}</td>
        <td>{{ $lead->event_date ? $lead->event_date->format('m/d/Y') : '—' }}</td>
        <td>{{ $lead->coverage_limit ?? 'See Policy' }}</td>
      </tr>
      @if($lead->waiver_sub_status)
      <tr>
        <td>Waiver of Subrogation</td>
        <td colspan="3">Included</td>
        <td>—</td>
      </tr>
      @endif
      @if($lead->hired_status)
      <tr>
        <td>Hired / Non-Owned Auto</td>
        <td colspan="3">Included</td>
        <td>—</td>
      </tr>
      @endif
      @if($lead->additional_insured)
      <tr>
        <td>Additional Insured</td>
        <td colspan="3">{{ $lead->additional_insured }}</td>
        <td>—</td>
      </tr>
      @endif
    </tbody>
  </table>

  {{-- Event Description --}}
  <h3 style="margin-top:10px;">Description of Operations / Locations / Special Conditions</h3>
  <div class="grid" style="margin-bottom:0;">
    <div class="grid-row">
      <div class="grid-cell half">
        <div class="cell-label">Event Name</div>
        <div class="cell-value small">{{ $lead->event_name ?? '—' }}</div>
      </div>
      <div class="grid-cell half">
        <div class="cell-label">Event Type</div>
        <div class="cell-value small">{{ $lead->event_type_label ?? '—' }}</div>
      </div>
    </div>
    <div class="grid-row">
      <div class="grid-cell half">
        <div class="cell-label">Event Date</div>
        <div class="cell-value small">{{ $lead->event_date ? $lead->event_date->format('F j, Y') : '—' }}</div>
      </div>
      <div class="grid-cell half">
        <div class="cell-label">Estimated Attendance</div>
        <div class="cell-value small">{{ $lead->no_of_people ?? '—' }}</div>
      </div>
    </div>
    @if($lead->venue_name)
    <div class="grid-row">
      <div class="grid-cell full">
        <div class="cell-label">Venue / Location</div>
        <div class="cell-value small">{{ $lead->venue_name }} &mdash; {{ implode(', ', array_filter([$lead->venue_address, $lead->venue_state, $lead->venue_zip])) }}</div>
      </div>
    </div>
    @endif
  </div>

  {{-- Certificate Holder --}}
  <h3 style="margin-top:10px;">Certificate Holder</h3>
  <div class="grid" style="margin-bottom:0;">
    <div class="grid-row">
      <div class="grid-cell half">
        @if($lead->venue_name)
          <div class="cell-value">{{ $lead->venue_name }}</div>
          <div class="cell-value small">{{ implode(', ', array_filter([$lead->venue_address, $lead->venue_state, $lead->venue_zip])) }}</div>
          @if($lead->venue_contact_email)
          <div class="cell-value small">{{ $lead->venue_contact_email }}</div>
          @endif
        @else
          <div class="cell-value">See Policy for Certificate Holder</div>
        @endif
      </div>
      <div class="grid-cell half">
        <div class="cell-label">Authorized Representative</div>
        <div style="margin-top: 20px; border-bottom: 1px solid #666; height: 1px;"></div>
        <div class="cell-value small" style="margin-top:4px;">One Day Event — Special Event Insurance</div>
      </div>
    </div>
  </div>

  <div class="important">
    <strong>IMPORTANT:</strong> If the certificate holder is an ADDITIONAL INSURED, the policy(ies) must have ADDITIONAL INSURED provisions or be endorsed.
    If SUBROGATION IS WAIVED, subject to the terms and conditions of the policy, certain policies may require an endorsement.
    A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s).
  </div>

</div>
</body>
</html>
