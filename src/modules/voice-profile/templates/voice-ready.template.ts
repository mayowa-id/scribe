export function voiceReadyTemplate(
  fullName: string,
  voiceProfileName: string,
  dashboardUrl: string,
): { subject: string; body: string } {
  return {
    subject: `Your Scribe Voice Profile "${voiceProfileName}" is ready`,
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voice Profile Ready</title>
</head>
<body style="margin:0;padding:0;background:#1a1410;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1410;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;border-radius:4px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:#1a1410;padding:32px 40px;border-bottom:3px solid #c9a84c;">
              <h1 style="margin:0;color:#c9a84c;font-size:28px;letter-spacing:4px;font-weight:400;text-transform:uppercase;">SCRIBE</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;border-left:4px solid #c9a84c;">
              <h2 style="color:#1a1410;font-size:22px;margin:0 0 8px;font-weight:400;">Your voice is ready, ${fullName}.</h2>
              <p style="color:#c9a84c;font-size:14px;letter-spacing:1px;text-transform:uppercase;margin:0 0 24px;">${voiceProfileName}</p>
              <p style="color:#2d3142;font-size:16px;line-height:1.7;margin:0 0 20px;">
                Scribe has finished analysing your interview responses and synthesised a Voice Profile
                that captures your unique writing style. Your AI writing assistant will now generate
                content that sounds like <em>you</em>.
              </p>
              <a href="${dashboardUrl}"
                 style="display:inline-block;background:#c9a84c;color:#1a1410;padding:14px 32px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;font-weight:600;">
                Start Writing →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#2d3142;padding:20px 40px;">
              <p style="margin:0;color:#e8e4dc;font-size:11px;">Scribe — AI Writing Intelligence</p>
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
