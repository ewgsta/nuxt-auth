export const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
  const EMAILTHING_TOKEN = process.env.EMAILTHING_TOKEN;
  const EMAILTHING_FROM = process.env.EMAILTHING_FROM;

  if (!EMAILTHING_TOKEN) {
    console.warn('EMAILTHING_TOKEN is not defined in environment variables. Email will not be sent.');
    return false;
  }

  try {
    const response = await $fetch('https://api.emailthing.app/api/v0/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAILTHING_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: {
        to: [to],
        from: EMAILTHING_FROM,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ''), // Basit html to text fallback
      }
    });

    return response;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
