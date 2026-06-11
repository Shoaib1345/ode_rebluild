<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset your One Day Event password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">

        {{-- Header --}}
        <tr>
          <td style="background-color:#1CA0DF;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">One Day Event</h1>
            <p style="margin:8px 0 0;color:#d7eefb;font-size:14px;">Password Reset</p>
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding:40px;">

            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Hi {{ $user->first_name }},</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              We received a request to reset the password for your One Day Event account
              (<strong>{{ $user->email }}</strong>). Click the button below to choose a new password.
            </p>

            {{-- CTA --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="{{ $resetUrl }}"
                     style="display:inline-block;background-color:#1CA0DF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 44px;border-radius:6px;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
              <a href="{{ $resetUrl }}" style="color:#1CA0DF;">{{ $resetUrl }}</a>
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:6px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#92400e;">
                    This link expires in 60 minutes. If you didn&rsquo;t request a password reset, you can safely
                    ignore this email — your password won&rsquo;t change.
                  </p>
                </td>
              </tr>
            </table>

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
