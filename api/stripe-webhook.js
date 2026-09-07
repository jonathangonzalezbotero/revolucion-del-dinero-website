const Stripe = require('stripe');
const { syncPaidCheckoutSession } = require('./_lib/eventoRegistration');
const { syncPaidBootcampSession } = require('./_lib/bootcampRegistration');
const { syncPaidCirculoSession } = require('./_lib/circuloRegistration');
const { cancelAtTrasCuotas } = require('./_lib/planCuotas');

// Cuántas mensualidades se cobran en el plan en cuotas del Círculo. Tiene que coincidir
// con NUMERO_CUOTAS de src/config/circulo.js, que es lo que anuncia la página.
const NUMERO_CUOTAS = 6;

// Source of truth for "this person paid." Stripe calls this once a Checkout Session
// actually completes, and only then does the contact get the buyer tags in systeme.io and
// lose the "hasn't paid yet" tag that api/evento-lead.js applied at form submit. The
// EVENT_TAG a systeme.io automation hangs off is assigned here and nowhere else.
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

  // One Stripe account, one webhook, three products — so the session has to be routed by
  // what it was sold as, or a Bootcamp or Círculo buyer would be tagged into the September
  // event's systeme.io automation. Only the newer pages set metadata.oferta; an event
  // session has no such key, so it falls through to exactly the path it has always taken.
  const oferta = session.metadata?.oferta;

  // Best-effort CRM sync: always ack 200 to Stripe (no retries) so a systeme.io hiccup
  // never holds up or duplicates a registration. Anything not synced is logged so it can
  // be added to systeme.io manually.
  try {
    let result;
    if (oferta === 'bootcamp') result = await syncPaidBootcampSession(session);
    else if (oferta === 'circulo-presencial') result = await syncPaidCirculoSession(session);
    else result = await syncPaidCheckoutSession(session);

    if (!result.synced) {
      console.error('checkout.session.completed not synced:', result.reason, session.id);
    }
  } catch (err) {
    console.error('stripe-webhook: systeme.io sync failed for session', session.id, err);
  }

  // El plan en cuotas del Círculo es una suscripción mensual que TIENE que apagarse sola
  // al sexto cobro. Stripe Checkout no acepta `cancel_at` al crear la sesión, así que se
  // fija acá, en cuanto la suscripción existe.
  //
  // Esto no se puede dejar para después: una suscripción sin `cancel_at` cobra el séptimo
  // mes, el octavo y el noveno. Es un cargo no autorizado a alguien que pagó $1.000 —
  // disputa y reputación. Va después del sync del CRM y en su propio try, para que un
  // fallo del CRM no impida programar la cancelación ni al revés.
  if (oferta === 'circulo-presencial' && session.mode === 'subscription' && session.subscription) {
    try {
      await programarFinDeCuotas(stripe, session.subscription);
    } catch (err) {
      // Se registra con prefijo identificable y con el ID de la suscripción, porque esto
      // hay que arreglarlo a mano en el dashboard si falla. No se le devuelve error a
      // Stripe: el pago ya entró y un reintento no cambiaría nada.
      console.error(
        'stripe-webhook: NO SE PUDO PROGRAMAR EL FIN DE LAS CUOTAS — fíjalo a mano en Stripe para la suscripción',
        session.subscription,
        err,
      );
    }
  }

  return res.status(200).json({ received: true });
};

// Fija `cancel_at` para que se cobren exactamente NUMERO_CUOTAS mensualidades y la
// suscripción se apague sola. El ancla es `billing_cycle_anchor` (la fecha real sobre la
// que Stripe calcula los cobros), no `created`, que puede diferir.
//
// Idempotente: si la suscripción ya trae un `cancel_at`, no se toca. Stripe puede reenviar
// el mismo evento, y reescribirlo no aportaría nada.
async function programarFinDeCuotas(stripe, subscriptionId) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  if (sub.cancel_at) {
    console.log('stripe-webhook: la suscripción ya tenía cancel_at, no se toca', subscriptionId, sub.cancel_at);
    return;
  }

  const anchor = sub.billing_cycle_anchor || sub.start_date || sub.created;
  const cancelAt = cancelAtTrasCuotas(anchor, NUMERO_CUOTAS);

  await stripe.subscriptions.update(subscriptionId, { cancel_at: cancelAt });

  console.log(
    `stripe-webhook: cuotas del Círculo programadas — ${NUMERO_CUOTAS} cobros, suscripción ${subscriptionId}`,
    `se apaga el ${new Date(cancelAt * 1000).toISOString()}`,
  );
}

module.exports.config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
