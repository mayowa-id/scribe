export function resetPasswordTemplate(
  fullName: string,
  resetUrl: string,
): { subject: string; body: string } {
  return {
    subject: 'Reset your Scribe password',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#1a1410;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1410;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border-radius:4px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:#1a1410;padding:32px 40px;border-bottom:3px solid #8b1a1a;">
              <h1 style="margin:0;color:#c9a84c;font-size:28px;letter-spacing:4px;font-weight:400;text-transform:uppercase;">SCRIBE</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;border-left:4px solid #8b1a1a;">
              <h2 style="color:#1a1410;font-size:22px;margin:0 0 16px;font-weight:400;">Password reset, ${fullName}.</h2>
              <p style="color:#2d3142;font-size:16px;line-height:1.7;margin:0 0 20px;">
                We received a request to reset your Scribe password. Click below to set a new one.
                This link expires in <strong>1 hour</strong>.
              </p>
              <a href="${resetUrl}" 
                 style="display:inline-block;background:#8b1a1a;color:#f5f0e8;padding:14px 32px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;font-weight:600;">
                Reset My Password →
              </a>
              <p style="color:#8b7355;font-size:13px;line-height:1.6;margin:24px 0 0;">
                Or copy and paste this link:<br/>
                <span style="color:#2d3142;word-break:break-all;">${resetUrl}</span>
              </p>
              <p style="color:#8b1a1a;font-size:13px;margin:20px 0 0;">
                If you did not request this, your account is still secure — ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#2d3142;padding:20px 40px;">
              <p style="margin:0;color:#e8e4dc;font-size:11px;">
                This link expires in 1 hour for your security.
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
