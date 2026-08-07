const { Resend } = require('resend');
const { mentorLeadConfirmationEmail, mentorNotificationEmail } = require('./_lib/emailTemplates');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { RESEND_API_KEY, RESEND_FROM_EMAIL, MENTOR_NOTIFY_EMAIL } = process.env;
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !MENTOR_NOTIFY_EMAIL) {
    console.error('Missing required env vars: RESEND_API_KEY, RESEND_FROM_EMAIL, MENTOR_NOTIFY_EMAIL');
    return res.status(500).json({ error: 'Server is not configured to send emails yet.' });
  }

  const { nombre, email, whatsapp } = req.body || {};
  if (!nombre?.trim() || !email?.trim() || !whatsapp?.trim()) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo y whatsapp son requeridos.' });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'El correo no es válido.' });
  }

  const resend = new Resend(RESEND_API_KEY);
  const cleanNombre = nombre.trim();
  const cleanEmail = email.trim();
  const cleanWhatsapp = whatsapp.trim();

  const lead = mentorLeadConfirmationEmail({ nombre: cleanNombre });
  const notification = mentorNotificationEmail({ nombre: cleanNombre, email: cleanEmail, whatsapp: cleanWhatsapp });

  const [leadResult, notifyResult] = await Promise.allSettled([
    resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: cleanEmail,
      subject: lead.subject,
      html: lead.html,
      text: lead.text,
    }),
    resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: MENTOR_NOTIFY_EMAIL,
      replyTo: cleanEmail,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
    }),
  ]);

  // The notification to Jonathan is the important one — fail loudly if that didn't send.
  if (notifyResult.status === 'rejected' || notifyResult.value?.error) {
    console.error('Failed to send mentor notification email', notifyResult.reason || notifyResult.value?.error);
    return res.status(502).json({ error: 'No se pudo enviar la solicitud. Intenta de nuevo.' });
  }

  if (leadResult.status === 'rejected' || leadResult.value?.error) {
    // Notification went through, so the lead is captured — just log it, don't fail the request.
    console.error('Failed to send lead confirmation email', leadResult.reason || leadResult.value?.error);
  }

  return res.status(200).json({ ok: true });
};
