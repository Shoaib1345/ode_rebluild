<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payment Receipt — Lead #{{ $lead->id }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; background: #fff; }
  .page { padding: 48px 60px; max-width: 600px; margin: 0 auto; }

  .header { text-align: center; border-bottom: 2px solid #105778; padding-bottom: 16px; margin-bottom: 24px; }
  .company-name { font-size: 20px; font-weight: bold; color: #105778; }
  .doc-title { font-size: 14px; color: #333; margin-top: 4px; }
  .receipt-number { font-size: 10px; color: #777; margin-top: 4px; }

  .from-to { display: table; width: 100%; margin-bottom: 24px; }
  .from-box, .to-box { display: table-cell; width: 50%; vertical-align: top; }
  .box-label { font-size: 9px; text-transform: uppercase; color: #999; font-weight: bold; margin-bottom: 6px; letter-spacing: 0.5px; }
  .box-name { font-size: 12px; font-weight: bold; color: #333; }
  .box-detail { font-size: 10px; color: #666; margin-top: 2px; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  table.items th { background: #105778; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; }
  table.items th:last-child { text-align: right; }
  table.items td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  table.items td:last-child { text-align: right; }
  table.items tr.total td { font-weight: bold; background: #EEF6FB; border-top: 2px solid #105778; font-size: 12px; }

  .payment-info { margin-top: 20px; background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 4px; padding: 12px; }
  .payment-info table { width: 100%; }
  .payment-info td { padding: 3px 0; font-size: 10px; }
  .payment-info td.label { color: #888; width: 40%; }

  .thank-you { text-align: center; margin-top: 28px; padding: 14px; background: #EEF6FB; border-radius: 4px; }
  .thank-you p { font-size: 13px; font-weight: bold; color: #105778; }
  .thank-you small { font-size: 9px; color: #777; display: block; margin-top: 4px; }

  .footer { margin-top: 28px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 8px; color: #bbb; text-align: center; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="company-name">One Day Event</div>
    <div class="doc-title">Payment Receipt</div>
    <div class="receipt-number">Receipt #{{ str_pad($lead->id, 6, '0', STR_PAD_LEFT) }} · {{ now()->format('F j, Y') }}</div>
  </div>

  <div class="from-to">
    <div class="from-box">
      <div class="box-label">From</div>
      <div class="box-name">One Day Event</div>
      <div class="box-detail">Special Event Insurance</div>
      <div class="box-detail">www.onedayevent.com</div>
    </div>
    <div class="to-box" style="text-align:right;">
      <div class="box-label">Bill To</div>
      <div class="box-name">{{ trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? '')) ?: 'Customer' }}</div>
      <div class="box-detail">{{ $lead->email ?? '' }}</div>
      <div class="box-detail">{{ $lead->phone ?? '' }}</div>
    </div>
  </div>

  @php $plan = $lead->lead_offered_plans; @endphp

  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      @if($plan)
      <tr>
        <td>
          Event Insurance Premium
          @if($lead->carrier) <br><small style="color:#888;">Carrier: {{ $lead->carrier }}</small> @endif
          @if($lead->event_type_label) <br><small style="color:#888;">Event: {{ $lead->event_type_label }}</small> @endif
          @if($lead->event_date) <br><small style="color:#888;">Date: {{ $lead->event_date->format('M j, Y') }}</small> @endif
        </td>
        <td>${{ number_format($plan['premium'] ?? 0, 2) }}</td>
      </tr>
      @if(($plan['broker_fee'] ?? 0) > 0)
      <tr>
        <td>Broker Fee</td>
        <td>${{ number_format($plan['broker_fee'], 2) }}</td>
      </tr>
      @endif
      @if(($plan['processing_fee'] ?? 0) > 0)
      <tr>
        <td>Processing &amp; Administration Fee</td>
        <td>${{ number_format($plan['processing_fee'], 2) }}</td>
      </tr>
      @endif
      @if(($plan['extra_charge'] ?? 0) > 0)
      <tr>
        <td>Additional Charges</td>
        <td>${{ number_format($plan['extra_charge'], 2) }}</td>
      </tr>
      @endif
      <tr class="total">
        <td>Total Paid</td>
        <td>${{ number_format($plan['total'] ?? 0, 2) }}</td>
      </tr>
      @else
      <tr>
        <td>Event Insurance Premium</td>
        <td>—</td>
      </tr>
      <tr class="total">
        <td>Total</td>
        <td>—</td>
      </tr>
      @endif
    </tbody>
  </table>

  <div class="payment-info">
    <table>
      @if($lead->payment_id)
      <tr>
        <td class="label">Transaction ID</td>
        <td style="font-family:monospace; font-size:9px;">{{ $lead->payment_id }}</td>
      </tr>
      @endif
      <tr>
        <td class="label">Payment Date</td>
        <td>{{ now()->format('F j, Y') }}</td>
      </tr>
      <tr>
        <td class="label">Payment Method</td>
        <td>Credit Card</td>
      </tr>
      <tr>
        <td class="label">Status</td>
        <td style="color:#2d7a4f; font-weight:bold;">Paid in Full</td>
      </tr>
    </table>
  </div>

  <div class="thank-you">
    <p>Thank you for your purchase!</p>
    <small>Your event is covered. Keep this receipt for your records.</small>
  </div>

  <div class="footer">
    One Day Event · Special Event Insurance · www.onedayevent.com<br>
    Receipt #{{ str_pad($lead->id, 6, '0', STR_PAD_LEFT) }} · Generated {{ now()->format('Y-m-d H:i') }} UTC
  </div>

</div>
</body>
</html>
