export const ResetPasswordTemplate = {
  subject: 'Reset your Scribe password',
  buildBody: (name: string, resetUrl: string) => `
    <h1>Hi ${name},</h1>
    <p>We received a request to reset your password. Click the link below to set a new password:</p>
    <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
    <p>If you did not request a password reset, please ignore this email.</p>
  `,
};
