export const VoiceReadyTemplate = {
  subject: 'Your Voice Profile is Ready!',
  buildBody: (name: string, profileName: string, projectUrl: string) => `
    <h1>Great news, ${name}!</h1>
    <p>Your Voice Profile "<strong>${profileName}</strong>" has been fully synthesized and is ready to use.</p>
    <p>You can now start generating chapters in your unique voice.</p>
    <br/>
    <a href="${projectUrl}" style="display:inline-block;padding:10px 20px;background-color:#28a745;color:#fff;text-decoration:none;border-radius:5px;">Go to Projects</a>
  `,
};
