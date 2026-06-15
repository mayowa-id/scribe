export const WelcomeEmailTemplate = {
  subject: 'Welcome to Scribe!',
  buildBody: (name: string) => `
    <h1>Welcome to Scribe, ${name}!</h1>
    <p>We're thrilled to have you on board. Scribe is your AI-powered writing assistant designed to capture your unique voice.</p>
    <p>Get started by setting up your voice profile.</p>
  `,
};
