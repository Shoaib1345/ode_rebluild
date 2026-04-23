<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">

        {{-- Header --}}
        <tr>
          <td style="background-color:#1e40af;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">One Day Event</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Invoice for Insurance Services</p>
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding:40px;">

            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">You Have a New Invoice</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              Hi {{ $invoice->first_name }}, please review the invoice below and click the button to complete your payment securely online.
            </p>

            {{-- Policy Info --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
              @if($invoice->event_type)
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;width:40%;">Event Type</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $invoice->event_type }}</td>
              </tr>
              @endif
              @if($invoice->carrier)
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Carrier</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $invoice->carrier }}</td>
              </tr>
              @endif
              @if($invoice->effective_date)
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Effective Date</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $invoice->effective_date->format('F j, Y') }}</td>
              </tr>
              @endif
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#64748b;">Amount Due</td>
                <td style="padding:12px 16px;background-color:#ffffff;font-size:15px;color:#1e293b;font-weight:700;">${{ number_format($invoice->total_payable, 2) }}</td>
              </tr>
            </table>

            {{-- CTA Button --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="{{ $paymentUrl }}"
                     style="display:inline-block;background-color:#1e40af;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:6px;letter-spacing:0.3px;">
                    Pay Invoice Now
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:12px;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;">Or copy this link: <a href="{{ $paymentUrl }}" style="color:#1e40af;word-break:break-all;">{{ $paymentUrl }}</a></p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:20px;">
              This invoice was issued by One Day Event. If you have questions, contact us at
              <a href="mailto:support@onedayevent.com" style="color:#1e40af;text-decoration:none;">support@onedayevent.com</a>.
            </p>

          </td>
        </tr>

        {{-- Footer --}}
        <tr>
          <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              &copy; {{ date('Y') }} One Day Event. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
