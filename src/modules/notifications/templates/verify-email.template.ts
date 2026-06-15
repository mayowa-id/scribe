export const VerifyEmailTemplate = {
  subject: 'Verify your Scribe account',
  buildBody: (name: string, verifyUrl: string) => `
    <h1>Hi ${name},</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
    <p>If you did not request this, please ignore this email.</p>
  `,
};
