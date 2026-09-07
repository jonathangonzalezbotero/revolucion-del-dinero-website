const Stripe = require('stripe');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Los price IDs entran SOLO por variable de entorno y se resuelven acá, en el servidor.
// El navegador manda `tier`, nunca un price ID: si el cliente pudiera elegir el precio,
// cualquiera podría pagar cinco centavos por el Bootcamp.
//
// Vercel expone todas las variables del proyecto a las funciones serverless, con prefijo
// REACT_APP_ o sin él — el prefijo solo controla qué inyecta CRA en el bundle del
// navegador. Por eso el mismo par de variables sirve para las dos partes y no hay que
// configurar el mismo valor dos veces.
//
// Sin fallback a propósito: si falta la variable, este endpoint responde con un error
// claro en español y no se cobra nada.
const TIER_PRICES = {
  'bootcamp-individual': process.env.REACT_APP_STRIPE_PRICE_BOOTCAMP_INDIVIDUAL,
  'bootcamp-pareja': process.env.REACT_APP_STRIPE_PRICE_BOOTCAMP_PAREJA,
};

// Endpoint propio del Bootcamp. Deliberadamente separado de
// api/create-checkout-session.js, que atiende el evento de septiembre en producción con
// ventas reales: ese archivo no se toca. Este calca su estructura (sesión creada en el
// servidor para que los datos del formulario viajen como metadata) y nada más.
//
// La metadata usa exactamente los mismos nombres de campo que el evento — nombre, tel,
// tier, amigoNombre, amigoTel — porque son los que Jonathan ya sabe leer en el dashboard
// de Stripe. `oferta` se añade para poder separar reportes, y es también lo que
// api/stripe-webhook.js usa para enrutar el contacto al tag correcto.
//
// Este endpoint no toca el CRM: el contacto ya se creó al enviar el formulario, en
// api/bootcamp-lead.js, con el tag `bootcamp-nov-2026`.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error('bootcamp-checkout: falta la variable STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'El pago del Bootcamp no está configurado todavía. Escríbenos y lo resolvemos.' });
  }

  const { nombre, email, tel, amigoNombre, amigoTel, tier } = req.body || {};

  if (!Object.prototype.hasOwnProperty.call(TIER_PRICES, tier)) {
    return res.status(400).json({ error: 'Elige una de las dos entradas del Bootcamp.' });
  }

  const priceId = TIER_PRICES[tier];
  if (!priceId) {
    const varName = tier === 'bootcamp-pareja'
      ? 'REACT_APP_STRIPE_PRICE_BOOTCAMP_PAREJA'
      : 'REACT_APP_STRIPE_PRICE_BOOTCAMP_INDIVIDUAL';
    console.error(`bootcamp-checkout: falta la variable de entorno ${varName}`);
    return res.status(500).json({ error: 'El pago del Bootcamp no está configurado todavía. Escríbenos y lo resolvemos.' });
  }

  if (!nombre?.trim() || !email?.trim() || !tel?.trim()) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo y teléfono son requeridos.' });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'El correo no es válido.' });
  }
  // La entrada para dos existe para que traigas a quien tú quieras, así que sus datos
  // son obligatorios: sin ellos no sabemos a nombre de quién va el segundo puesto.
  if (tier === 'bootcamp-pareja' && (!amigoNombre?.trim() || !amigoTel?.trim())) {
    return res.status(400).json({ error: 'Para la entrada de dos personas necesitamos el nombre y el teléfono de tu acompañante.' });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email.trim(),
      success_url: `${origin}/bootcamp/gracias?nombre=${encodeURIComponent(nombre.trim())}&tier=${tier}`,
      cancel_url: `${origin}/bootcamp`,
      metadata: {
        nombre: nombre.trim(),
        tel: tel.trim(),
        tier,
        amigoNombre: amigoNombre?.trim() || '',
        amigoTel: amigoTel?.trim() || '',
        oferta: 'bootcamp',
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('bootcamp-checkout: no se pudo crear la sesión de Stripe', err);
    return res.status(502).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
};
