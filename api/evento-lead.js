const { registerEventoLead } = require('./_lib/eventoRegistration');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Captures an event registration into systeme.io the moment the form is submitted, before
// any payment — tagged as "hasn't paid yet" (see NO_PAGO_TAG). Meta was reporting roughly
// twice as many leads as the CRM held, because until now a contact was only ever created
// by stripe-webhook.js once payment succeeded: everyone who filled the form and dropped off
// at checkout existed nowhere but an abandoned Stripe session.
//
// This endpoint is called fire-and-forget from the browser and is never awaited, so it
// cannot delay the Stripe redirect. It always answers 200: the caller has nothing useful
// to do with a failure, and any CRM problem is logged here for a manual backfill instead.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nombre, email, tel, amigoNombre, amigoTel } = req.body || {};
  if (!nombre?.trim() || !email?.trim() || !tel?.trim() || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo y teléfono son requeridos.' });
  }

  try {
    await registerEventoLead({
      nombre: nombre.trim(),
      email: email.trim(),
      tel: tel.trim(),
      amigoNombre: amigoNombre?.trim() || '',
      amigoTel: amigoTel?.trim() || '',
    });
  } catch (err) {
    // Deliberately swallowed: a CRM outage must never surface to someone on their way to
    // pay. Logged so the registration can be recovered by hand from these logs.
    console.error('evento-lead: systeme.io registration failed for', email, err);
  }

  return res.status(200).json({ ok: true });
};
