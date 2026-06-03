<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your One Day Event account is ready</title>
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
            <p style="margin:8px 0 0;color:#d7eefb;font-size:14px;">Account Access</p>
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding:40px;">

            <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Welcome, {{ $user->first_name }}!</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
              An administrator has created a <strong>{{ $roleName }}</strong> account for you on the One Day Event platform.
              Use the temporary password below to sign in, then change it from your account settings.
            </p>

            {{-- Credentials box --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Email</p>
                  <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#0c4a6e;word-break:break-all;">{{ $user->email }}</p>

                  <p style="margin:0 0 4px;font-size:12px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Temporary Password</p>
                  <p style="margin:0;font-size:24px;font-weight:700;color:#0c4a6e;letter-spacing:2px;font-family:'Courier New',Courier,monospace;">{{ $temporaryPassword }}</p>
                </td>
              </tr>
            </table>

            {{-- CTA --}}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="{{ $loginUrl }}"
                     style="display:inline-block;background-color:#1CA0DF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:6px;">
                    Log In to Your Account
                  </a>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#92400e;">
                    <strong>Security tip:</strong> For your protection, please log in and change this temporary password as soon as possible. Never share it with anyone.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#64748b;">
              If you weren't expecting this account, please contact us at
              <a href="mailto:support@onedayevent.com" style="color:#1CA0DF;text-decoration:none;">support@onedayevent.com</a>.
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
