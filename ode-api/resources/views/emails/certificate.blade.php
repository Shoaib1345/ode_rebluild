<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificate of Insurance</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">

        {{-- Header --}}
        <tr>
          <td style="background-color:#3CB371;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">One Day Event</h1>
            <p style="margin:8px 0 0;color:#d1fae5;font-size:14px;">Event Insurance Specialists</p>
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding:40px;">

            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Your Certificate of Insurance Is Ready!</h2>

            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              Hi {{ $firstName }},<br><br>
              Your Certificate of Insurance for
              <strong>{{ $eventType }}</strong>
              @if($eventDate)
                on <strong>{{ $eventDate }}</strong>
              @endif
              is attached to this email.
            </p>

            @if($eventName)
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background-color:#f8fafc;border-radius:6px;padding:20px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Event</p>
                  <p style="margin:0;font-size:15px;color:#1e293b;font-weight:600;">{{ $eventName }}</p>
                </td>
              </tr>
            </table>
            @endif

            <p style="margin:0 0 8px;color:#475569;font-size:14px;">
              Please find your Certificate of Insurance (COI) attached as a PDF. You can also access and download it anytime from your customer portal.
            </p>

            <p style="margin:0 0 24px;color:#475569;font-size:14px;">
              If you need to forward the certificate to your venue, simply attach this PDF to an email or download it from your portal.
            </p>

            {{-- CTA --}}
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background-color:#3CB371;border-radius:6px;">
                  <a href="{{ rtrim(config('app.frontend_url', config('app.url')), '/') }}/customer/events"
                     style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                    View My Portal
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#94a3b8;font-size:13px;">
              Questions? Email us at
              <a href="mailto:support@onedayevent.com" style="color:#3CB371;">support@onedayevent.com</a>
              or call <strong>408-217-6787</strong>.
            </p>

          </td>
        </tr>

        {{-- Footer --}}
        <tr>
          <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              &copy; {{ date('Y') }} One Day Event &mdash; Jeewanjee Insurance Agency<br>
              1494 Hamilton Ave Suite 103, San Jose, CA 95125
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
