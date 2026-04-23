<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome – Partner Account</title>
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
            @if($partnerType === 'agent')
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Agent Partner Program</p>
            @else
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Venue &amp; Planner Partner Program</p>
            @endif
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding:40px;">

            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Welcome, {{ $user->first_name }}!</h2>

            @if($partnerType === 'agent')
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              Your agent partner account has been created successfully. Our team will review your information and reach out shortly to discuss how we can work together to provide event insurance to your clients.
            </p>
            @else
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              Your venue/planner partner account has been created successfully. We're excited to partner with you and help your clients get the coverage they need for their events.
            </p>
            @endif

            {{-- Account Info --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;width:40%;">Account Type</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;font-weight:600;">
                  {{ $partnerType === 'agent' ? 'Insurance Agent' : 'Event Planner / Venue' }}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Name</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $user->first_name }} {{ $user->last_name }}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Email</td>
                <td style="padding:12px 16px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">{{ $user->email }}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#64748b;">Partner Code</td>
                <td style="padding:12px 16px;background-color:#ffffff;font-size:13px;color:#1e293b;font-weight:600;letter-spacing:2px;">{{ $user->referral_string }}</td>
              </tr>
            </table>

            {{-- Next Steps --}}
            <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">What Happens Next</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:8px 0;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
                        <div style="width:24px;height:24px;background-color:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#1e40af;">1</div>
                      </td>
                      <td><p style="margin:0;font-size:14px;color:#1e293b;">Our team reviews your account details.</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
                        <div style="width:24px;height:24px;background-color:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#1e40af;">2</div>
                      </td>
                      <td><p style="margin:0;font-size:14px;color:#1e293b;">A team member will reach out within 1–2 business days.</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
                        <div style="width:24px;height:24px;background-color:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#1e40af;">3</div>
                      </td>
                      <td><p style="margin:0;font-size:14px;color:#1e293b;">You'll receive access to partner resources and start referring clients.</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#64748b;">
              Questions? Contact our partner team at
              <a href="mailto:partners@onedayevent.com" style="color:#1e40af;text-decoration:none;">partners@onedayevent.com</a>.
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
