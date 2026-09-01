const { Resend } = require('resend');
const { mentorLeadConfirmationEmail, mentorNotificationEmail } = require('./_lib/emailTemplates');
const {
  isTrustedOrigin,
  isSubmittedTooFast,
  isPlausibleEmail,
  isPlausiblePhone,
  isPlausibleName,
  isRateLimited,
  clientIp,
} = require('./_lib/antiSpam');

// Bots that clear every check still shouldn't be able to sit on the endpoint all day.
// Generous enough that a real person retrying a failed send never notices.
const IP_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 };
const EMAIL_LIMIT = { max: 2, windowMs: 24 * 60 * 60 * 1000 };

// Spam that trips the honeypot or the timing check gets a normal-looking 200 with no email
// sent, so the bot has no failure signal to adapt to.
const SILENT_OK = { ok: true };

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

  // Load-bearing check: a real submission always comes from the site in a browser, which
  // always sends Origin on a fetch POST. A script hitting the endpoint directly does not.
  if (!isTrustedOrigin(req)) {
    console.warn('mentor-request rejected: untrusted origin', req.headers.origin, req.headers.referer);
    return res.status(403).json({ error: 'Solicitud no permitida.' });
  }

  const { nombre, email, whatsapp, empresa, startedAt } = req.body || {};

  // Honeypot: `empresa` is invisible and unreachable for a person, so anything in it is a bot
  // filling every field it finds.
  if (empresa) {
    console.warn('mentor-request rejected: honeypot filled');
    return res.status(200).json(SILENT_OK);
  }

  if (isSubmittedTooFast(startedAt)) {
    console.warn('mentor-request rejected: submitted too fast');
    return res.status(200).json(SILENT_OK);
  }

  if (!nombre?.trim() || !email?.trim() || !whatsapp?.trim()) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo y whatsapp son requeridos.' });
  }

  const cleanNombre = nombre.trim();
  const cleanEmail = email.trim();
  const cleanWhatsapp = whatsapp.trim();

  // These three answer a real person with a fixable message — they're validation, not traps.
  if (!isPlausibleName(cleanNombre)) {
    return res.status(400).json({ error: 'Escribe tu nombre y apellido.' });
  }
  if (!isPlausibleEmail(cleanEmail)) {
    return res.status(400).json({ error: 'El correo no es válido.' });
  }
  if (!isPlausiblePhone(cleanWhatsapp)) {
    return res.status(400).json({ error: 'El teléfono no es válido. Incluye el código de país, por ejemplo +61 412 345 678.' });
  }

  if (isRateLimited(`ip:${clientIp(req)}`, IP_LIMIT) || isRateLimited(`email:${cleanEmail.toLowerCase()}`, EMAIL_LIMIT)) {
    console.warn('mentor-request rejected: rate limited', cleanEmail);
    return res.status(429).json({ error: 'Ya recibimos tu solicitud. Te contactaremos pronto.' });
  }

  const resend = new Resend(RESEND_API_KEY);

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
