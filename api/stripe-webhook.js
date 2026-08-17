const Stripe = require('stripe');
const { syncPaidCheckoutSession } = require('./_lib/eventoRegistration');

// Source of truth for "this person paid." Stripe calls this once a Checkout Session
// actually completes, and only then do we create/tag the contact in systeme.io — so the
// CRM only ever holds people who confirmed a payment, not everyone who filled the form.
//
// Vercel auto-parses JSON bodies by default, but Stripe signature verification requires
// the exact raw bytes that were sent, so body parsing is disabled below and the raw
// buffer is read manually.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    console.error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Stripe webhook not configured.' });
  }

  const stripe = new Stripe(stripeSecret);

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  // Best-effort CRM sync: always ack 200 to Stripe (no retries) so a systeme.io hiccup
  // never holds up or duplicates a registration. Anything not synced is logged so it can
  // be added to systeme.io manually.
  try {
    const result = await syncPaidCheckoutSession(session);
    if (!result.synced) {
      console.error('checkout.session.completed not synced:', result.reason, session.id);
    }
  } catch (err) {
    console.error('stripe-webhook: systeme.io sync failed for session', session.id, err);
  }

  return res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
