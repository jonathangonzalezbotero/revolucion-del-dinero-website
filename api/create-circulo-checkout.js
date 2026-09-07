const Stripe = require('stripe');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Los price IDs entran SOLO por variable de entorno y se resuelven acá, en el servidor.
// El navegador manda `tier` y `plan`, nunca un price ID: si el cliente pudiera elegir el
// precio, cualquiera entraría al Círculo por cinco centavos.
//
// Vercel expone todas las variables del proyecto a las funciones serverless, con prefijo
// REACT_APP_ o sin él — el prefijo solo controla qué inyecta CRA en el bundle del
// navegador. Por eso el mismo juego de variables sirve para las dos partes y no hay que
// configurar el mismo valor dos veces.
//
// Sin fallback a propósito: si falta una variable, este endpoint responde con un error
// claro en español y no se cobra nada.
const PRICES = {
  'circulo-individual': {
    unico: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL,
    cuotas: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL_CUOTAS,
  },
  'circulo-pareja': {
    unico: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA,
    cuotas: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA_CUOTAS,
  },
};

const NOMBRE_VARIABLE = {
  'circulo-individual': {
    unico: 'REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL',
    cuotas: 'REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL_CUOTAS',
  },
  'circulo-pareja': {
    unico: 'REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA',
    cuotas: 'REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA_CUOTAS',
  },
};

// Endpoint propio del Círculo. Deliberadamente separado de
// api/create-checkout-session.js (el evento de septiembre, en producción con ventas
// reales) y de api/create-bootcamp-checkout.js. Calca su estructura y nada más.
//
// La metadata usa exactamente los mismos nombres de campo que el evento — nombre, tel,
// tier, amigoNombre, amigoTel — porque son los que Jonathan ya sabe leer en el dashboard
// de Stripe. Se añaden `plan` y `oferta`: `oferta` es además lo que
// api/stripe-webhook.js usa para enrutar el contacto al tag correcto y para saber que
// tiene que apagar la suscripción de cuotas.
//
// Este endpoint no toca el CRM: el contacto ya se creó al enviar el formulario, en
// api/circulo-lead.js, con el tag `acceso-comunidad`.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error('circulo-checkout: falta la variable STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'El pago del Círculo no está configurado todavía. Escríbenos y lo resolvemos contigo.' });
  }

  const { nombre, email, tel, amigoNombre, amigoTel, tier, plan } = req.body || {};

  if (!Object.prototype.hasOwnProperty.call(PRICES, tier)) {
    return res.status(400).json({ error: 'Elige una de las dos entradas del Círculo.' });
  }
  if (plan !== 'unico' && plan !== 'cuotas') {
    return res.status(400).json({ error: 'Elige si pagas de una vez o en cuotas.' });
  }

  const priceId = PRICES[tier][plan];
  if (!priceId) {
    console.error(`circulo-checkout: falta la variable de entorno ${NOMBRE_VARIABLE[tier][plan]}`);
    return res.status(500).json({ error: 'Esa forma de pago no está disponible en este momento. Escríbenos y lo resolvemos contigo.' });
  }

  if (!nombre?.trim() || !email?.trim() || !tel?.trim()) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo y teléfono son requeridos.' });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'El correo no es válido.' });
  }
  // La entrada para dos existe para que traigas a quien tú quieras, así que sus datos son
  // obligatorios: sin ellos no sabemos a nombre de quién va el segundo puesto.
  if (tier === 'circulo-pareja' && (!amigoNombre?.trim() || !amigoTel?.trim())) {
    return res.status(400).json({ error: 'Para la entrada de dos personas necesitamos el nombre y el teléfono de tu acompañante.' });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  const metadata = {
    nombre: nombre.trim(),
    tel: tel.trim(),
    tier,
    plan,
    amigoNombre: amigoNombre?.trim() || '',
    amigoTel: amigoTel?.trim() || '',
    oferta: 'circulo-presencial',
  };

  try {
    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.create({
      mode: plan === 'cuotas' ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email.trim(),
      // Deja el mecanismo listo para entregar un código de descuento sin tocar el código.
      // El código en sí lo crea Jonathan en Stripe cuando lo vaya a usar — ver el TODO en
      // CIRCULO.md. Nada de esto se menciona en el copy de la página.
      allow_promotion_codes: true,
      success_url: `${origin}/circulo/gracias?nombre=${encodeURIComponent(nombre.trim())}&tier=${tier}&plan=${plan}`,
      cancel_url: `${origin}/circulo`,
      metadata,
      // En modo suscripción la metadata de la sesión NO se copia a la suscripción, y la
      // suscripción es el objeto que Jonathan va a mirar dentro de seis meses. Se copia
      // explícitamente para que el dashboard tenga los mismos campos en los dos sitios.
      ...(plan === 'cuotas' ? { subscription_data: { metadata } } : {}),
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('circulo-checkout: no se pudo crear la sesión de Stripe', err);
    return res.status(502).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
};
