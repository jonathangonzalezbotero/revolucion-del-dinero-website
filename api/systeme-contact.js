const { splitName, upsertContact, addTagByName } = require('./_lib/systeme');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_TAG = 'evento-septiembre-2026';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SYSTEME_API_KEY) {
    console.error('Missing required env var: SYSTEME_API_KEY');
    return res.status(500).json({ error: 'Server is not configured to sync contacts yet.' });
  }

  const { nombre, email, tel, amigoNombre, amigoTel } = req.body || {};
  if (!nombre?.trim() || !email?.trim() || !tel?.trim()) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo y teléfono son requeridos.' });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'El correo no es válido.' });
  }

  const { firstName, surname } = splitName(nombre.trim());
  const extraFields = [];
  if (amigoNombre?.trim()) extraFields.push({ slug: 'partners_name', value: amigoNombre.trim() });
  if (amigoTel?.trim()) extraFields.push({ slug: 'partners_phone', value: amigoTel.trim() });

  try {
    const contact = await upsertContact({
      email: email.trim(),
      firstName,
      surname,
      phone: tel.trim(),
      extraFields,
    });
    await addTagByName(contact.id, EVENT_TAG);
    return res.status(200).json({ ok: true, contactId: contact.id });
  } catch (err) {
    console.error('systeme-contact failed', err);
    // Best-effort sync — don't block the registration flow over a CRM hiccup.
    return res.status(502).json({ ok: false, error: 'No se pudo sincronizar con el CRM.' });
  }
};
