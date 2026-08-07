const { findContactByEmail, addTagByName } = require('./_lib/systeme');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIER_TAGS = {
  general: 'Entrada General $10 AUD',
  vip: 'Entrada VIP $20 AUD',
};

// Fired when someone clicks a Stripe checkout link, so contacts get segmented by which
// ticket tier they went for. Best-effort: it doesn't confirm payment actually happened,
// only that they clicked through to pay.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SYSTEME_API_KEY) {
    console.error('Missing required env var: SYSTEME_API_KEY');
    return res.status(500).json({ error: 'Server is not configured to sync contacts yet.' });
  }

  const { email, tier } = req.body || {};
  const tagName = TIER_TAGS[tier];
  if (!email?.trim() || !EMAIL_RE.test(email.trim()) || !tagName) {
    return res.status(400).json({ error: 'Datos inválidos.' });
  }

  try {
    const contact = await findContactByEmail(email.trim());
    if (!contact) {
      return res.status(404).json({ ok: false, error: 'Contacto no encontrado.' });
    }
    await addTagByName(contact.id, tagName);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('systeme-tag failed', err);
    return res.status(502).json({ ok: false, error: 'No se pudo etiquetar el contacto.' });
  }
};
