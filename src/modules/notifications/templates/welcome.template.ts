export function welcomeTemplate(fullName: string): { subject: string; body: string } {
  return {
    subject: 'Welcome to Scribe — Your Writing Voice Awaits',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Scribe</title>
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
                Your Scribe account is ready. You now have access to an AI writing tool that learns 
                <em>your</em> voice — not a generic style, but the precise rhythms, references, and 
                structure that make your writing unmistakably yours.
              </p>
              <p style="color:#2d3142;font-size:16px;line-height:1.7;margin:0 0 32px;">
                Begin by completing your Voice Profile interview. It takes about 10 minutes and 
                produces a permanent AI system prompt calibrated to you.
              </p>
              <a href="\${process.env.FRONTEND_URL}/voice/new" 
                 style="display:inline-block;background:#c9a84c;color:#1a1410;padding:14px 32px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;font-weight:600;">
                Begin Your Voice Interview →
              </a>
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
