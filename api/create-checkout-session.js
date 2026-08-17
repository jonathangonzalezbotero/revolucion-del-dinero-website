const Stripe = require('stripe');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIER_PRICES = {
  general: process.env.STRIPE_PRICE_GENERAL,
  vip: process.env.STRIPE_PRICE_VIP,
};

// Creates a Stripe Checkout Session server-side (instead of using static Payment Links)
// so the registration form data can travel with the payment as metadata. The systeme.io
// contact is only ever created later, by stripe-webhook.js, once Stripe confirms the
// payment actually succeeded — this endpoint never touches the CRM.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error('Missing required env var: STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'El pago no está configurado todavía.' });
  }

  const { nombre, email, tel, tier } = req.body || {};
  const priceId = TIER_PRICES[tier];
  if (!nombre?.trim() || !email?.trim() || !tel?.trim() || !priceId) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo, teléfono y tipo de entrada son requeridos.' });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'El correo no es válido.' });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email.trim(),
      success_url: `${origin}/evento?payment=success&tier=${tier}`,
      cancel_url: `${origin}/evento?payment=cancelled`,
      // Carried through to the checkout.session.completed webhook, which is the only
      // place the systeme.io contact actually gets created/tagged.
      metadata: {
        nombre: nombre.trim(),
        tel: tel.trim(),
        tier,
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session failed', err);
    return res.status(502).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
};
