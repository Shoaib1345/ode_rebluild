<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Policy Confirmation</title>
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
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Event Insurance Specialists</p>
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding:40px;">

            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Your Policy Is Confirmed!</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              Hi {{ $lead->first_name }}, thank you for your purchase. Your event insurance policy is being processed and you will receive your certificate shortly.
            </p>

            {{-- Policy Reference --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Policy Reference Number</p>
                  <p style="margin:0;font-size:28px;font-weight:700;color:#0c4a6e;letter-spacing:2px;">#{{ str_pad($lead->id, 6, '0', STR_PAD_LEFT) }}</p>
                </td>
              </tr>
            </table>

            {{-- Event Details --}}
            <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Event Details</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;width:40%;">Event Name</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;font-weight:600;">{{ $lead->event_name }}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Event Type</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $lead->event_type_label }}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Event Date</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $lead->event_date ? \Carbon\Carbon::parse($lead->event_date)->format('F j, Y') : 'N/A' }}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Venue</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $lead->venue_name }}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Carrier</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $lead->carrier }}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#64748b;">Coverage Limit</td>
                <td style="padding:12px 16px;background-color:#ffffff;font-size:13px;color:#1e293b;">{{ $lead->coverage_limit }}</td>
              </tr>
            </table>

            {{-- What Happens Next --}}
            <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">What Happens Next</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
                        <div style="width:24px;height:24px;background-color:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#1e40af;">1</div>
                      </td>
                      <td>
                        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">Our team reviews your policy</p>
                        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">We verify all details and assign your certificate number.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
                        <div style="width:24px;height:24px;background-color:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#1e40af;">2</div>
                      </td>
                      <td>
                        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">Certificate of Insurance issued</p>
                        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Your COI will be emailed to you within 1–2 business days.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
                        <div style="width:24px;height:24px;background-color:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#1e40af;">3</div>
                      </td>
                      <td>
                        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">You're covered!</p>
                        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Your event is protected. Keep your policy reference number on file.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#64748b;">
              Questions? Reply to this email or contact us at
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
