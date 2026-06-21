export function verificationTemplate(fullName: string, code: string): { subject: string; body: string } {
  return {
    subject: 'Scribe — Your Verification Code',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Scribe Account</title>
</head>
<body style="margin:0;padding:0;background:#1a1410;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1410;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border-radius:4px;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:#1a1410;padding:32px 40px;border-bottom:3px solid #c9a84c;">
              <h1 style="margin:0;color:#c9a84c;font-size:28px;letter-spacing:4px;font-weight:400;text-transform:uppercase;">SCRIBE</h1>
              <p style="margin:4px 0 0;color:#e8e4dc;font-size:11px;letter-spacing:2px;text-transform:uppercase;">AI Writing Intelligence</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;border-left:4px solid #c9a84c;">
              <h2 style="color:#1a1410;font-size:22px;margin:0 0 16px;font-weight:400;">Welcome, ${fullName}.</h2>
              <p style="color:#2d3142;font-size:16px;line-height:1.7;margin:0 0 20px;">
                Please use the following 6-digit code to verify your email address and activate your Scribe account.
              </p>
              <div style="background:#e8e4dc;padding:20px;text-align:center;border-radius:4px;margin:30px 0;">
                <span style="font-family:monospace;font-size:32px;letter-spacing:8px;color:#1a1410;font-weight:bold;">${code}</span>
              </div>
              <p style="color:#2d3142;font-size:16px;line-height:1.7;margin:0 0 32px;">
                This code will expire in 24 hours.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#2d3142;padding:20px 40px;">
              <p style="margin:0;color:#e8e4dc;font-size:11px;line-height:1.6;">
                You are receiving this because you created a Scribe account.<br/>
                If this was not you, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
