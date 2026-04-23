<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to the Affiliate Program</title>
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
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Affiliate Program</p>
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding:40px;">

            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Welcome aboard, {{ $user->first_name }}!</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              Your affiliate account is now active. Start sharing your unique referral link and earn a commission for every policy purchased through it.
            </p>

            {{-- Referral Code --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:12px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Referral Code</p>
                  <p style="margin:0 0 16px;font-size:28px;font-weight:700;color:#0c4a6e;letter-spacing:4px;">{{ $user->referral_string }}</p>
                  <p style="margin:0 0 8px;font-size:12px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Referral Link</p>
                  <a href="{{ $referralLink }}" style="font-size:13px;color:#1e40af;word-break:break-all;">{{ $referralLink }}</a>
                </td>
              </tr>
            </table>

            {{-- CTA --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="{{ $referralLink }}"
                     style="display:inline-block;background-color:#1e40af;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:6px;">
                    View Your Dashboard
                  </a>
                </td>
              </tr>
            </table>

            {{-- How it works --}}
            <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">How It Works</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:8px 0;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:12px;vertical-align:top;">
                        <div style="width:24px;height:24px;background-color:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#1e40af;">1</div>
                      </td>
                      <td>
                        <p style="margin:0;font-size:14px;color:#1e293b;">Share your referral link with event planners, venues, and clients.</p>
                      </td>
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
                      <td>
                        <p style="margin:0;font-size:14px;color:#1e293b;">They purchase an event insurance policy through your link.</p>
                      </td>
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
                      <td>
                        <p style="margin:0;font-size:14px;color:#1e293b;">You earn a commission — tracked in your affiliate dashboard.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#64748b;">
              Questions? Contact us at
              <a href="mailto:affiliates@onedayevent.com" style="color:#1e40af;text-decoration:none;">affiliates@onedayevent.com</a>.
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
