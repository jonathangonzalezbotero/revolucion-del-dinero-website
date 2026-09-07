const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { splitName, upsertContact, addTagByName } = require('./systeme');

// Módulo propio del Círculo Presencial, separado de _lib/eventoRegistration.js y de
// _lib/bootcampRegistration.js. Lo único compartido es _lib/systeme.js, el envoltorio de
// bajo nivel de la API, que no se toca.
//
// EL TAG DE ESTE PRODUCTO.
//
// `acceso-comunidad` dispara una automatización en systeme.io que manda el email de
// bienvenida con el link de acceso a Skool. Eso es correcto acá y SOLO acá: el Círculo
// Presencial ($1.000) es el único producto que incluye la comunidad. El Bootcamp ($250)
// usa `bootcamp-nov-2026` y no debe llevar este tag nunca — ver la cabecera de
// _lib/bootcampRegistration.js.
const CIRCULO_TAG = 'acceso-comunidad';

// Mismo motivo que en los otros dos módulos: el formulario es un <input type="tel"> sin
// código de país obligatorio, y systeme.io asigna su país por defecto a los números sin
// prefijo, con lo que se rompe el SMS. El producto es presencial en Australia, así que se
// asume AU cuando el número no trae código de país explícito.
function normalizePhone(raw) {
  if (!raw) return '';
  const parsed = parsePhoneNumberFromString(raw, 'AU');
  return parsed && parsed.isValid() ? parsed.format('E.164') : raw;
}

// El acompañante de la entrada para dos. Reutiliza los mismos slugs de campo
// personalizado que ya escriben el evento y el Bootcamp, así Jonathan lee un solo par de
// campos en systeme.io y no tres.
function partnerFields(amigoNombre, amigoTel) {
  const fields = [];
  if (amigoNombre) fields.push({ slug: 'partners_name', value: amigoNombre });
  if (amigoTel) fields.push({ slug: 'partners_phone', value: normalizePhone(amigoTel) });
  return fields;
}

// Se llama al enviar el formulario, ANTES de cualquier pago. Acá el ticket no son $10,
// son $1.000: un abandono de checkout sin el email capturado es la venta más cara que
// puede perder el negocio. Crea (o actualiza) el contacto y le pone `acceso-comunidad`.
//
// Idempotente: upsertContact busca por email, y volver a aplicar un tag que el contacto ya
// tiene es un no-op, así que reenviar el formulario actualiza en vez de duplicar.
async function registerCirculoLead({ nombre, email, tel, amigoNombre, amigoTel }) {
  const { firstName, surname } = splitName(nombre);

  const contact = await upsertContact({
    email,
    firstName,
    surname,
    phone: normalizePhone(tel),
    extraFields: partnerFields(amigoNombre, amigoTel),
  });

  await addTagByName(contact.id, CIRCULO_TAG);

  return { contactId: contact.id, email };
}

// Corre desde api/stripe-webhook.js cuando Stripe confirma el pago (o el primer cobro de
// las cuotas). Re-hace el upsert con el email que Stripe realmente cobró, que puede no ser
// el que se escribió en el formulario, y vuelve a aplicar el tag.
async function syncPaidCirculoSession(session) {
  // En `mode: 'subscription'` el pago del primer ciclo también deja payment_status
  // 'paid'; se acepta cualquiera de los dos por si Stripe cambia el matiz.
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { synced: false, reason: 'not paid' };
  }

  const { nombre, tel, amigoNombre, amigoTel } = session.metadata || {};
  const email = session.customer_details?.email || session.customer_email;
  if (!email || !nombre) {
    return { synced: false, reason: 'missing metadata' };
  }

  const { firstName, surname } = splitName(nombre);

  const contact = await upsertContact({
    email,
    firstName,
    surname,
    phone: normalizePhone(tel || session.customer_details?.phone || ''),
    extraFields: partnerFields(amigoNombre, amigoTel),
  });

  await addTagByName(contact.id, CIRCULO_TAG);

  return { synced: true, contactId: contact.id, email };
}

module.exports = { registerCirculoLead, syncPaidCirculoSession, CIRCULO_TAG };
