const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { splitName, upsertContact, addTagByName, removeTagByName } = require('./systeme');

const EVENT_TAG = 'evento-septiembre-2026';
// Applied the moment the form is submitted and removed once payment lands, so anyone who
// registers but never pays stays reachable in the CRM. Before this existed, a non-paying
// registration survived nowhere except an abandoned Stripe Checkout Session.
const NO_PAGO_TAG = 'evento-sept-2026-no-pago';
const TIER_TAGS = {
  general: 'Entrada General $10 AUD',
  vip: 'Entrada VIP $20 AUD',
};

// The registration form is a bare <input type="tel"> with no country-code enforcement, so
// users often type a local AU number without the +61 prefix (e.g. "0412 345 678"). systeme.io
// then defaults untagged numbers to its own fallback country, breaking SMS. The event is
// AU-based, so we assume AU when the number has no explicit country code.
function normalizePhone(raw) {
  if (!raw) return '';
  const parsed = parsePhoneNumberFromString(raw, 'AU');
  return parsed && parsed.isValid() ? parsed.format('E.164') : raw;
}

function partnerFields(amigoNombre, amigoTel) {
  const fields = [];
  if (amigoNombre) fields.push({ slug: 'partners_name', value: amigoNombre });
  if (amigoTel) fields.push({ slug: 'partners_phone', value: normalizePhone(amigoTel) });
  return fields;
}

// Called on form submit, before any payment. Creates (or updates) the contact and marks it
// as "hasn't paid yet".
//
// EVENT_TAG is deliberately NOT applied here: a systeme.io automation hangs off that tag,
// so it must only ever reach someone Stripe has confirmed as paid. See
// syncPaidCheckoutSession, which is still the only place it gets assigned.
//
// Idempotent — resubmitting the same email updates the existing contact instead of
// creating a second one (upsertContact looks up by email), and re-applying a tag the
// contact already carries is a no-op.
async function registerEventoLead({ nombre, email, tel, amigoNombre, amigoTel }) {
  const { firstName, surname } = splitName(nombre);

  const contact = await upsertContact({
    email,
    firstName,
    surname,
    phone: normalizePhone(tel),
    extraFields: partnerFields(amigoNombre, amigoTel),
  });

  await addTagByName(contact.id, NO_PAGO_TAG);

  return { contactId: contact.id, email };
}

// Syncs a paid Stripe Checkout Session into systeme.io: upserts the contact and applies
// the event + tier tags. Idempotent — safe to re-run for the same session (e.g. a Stripe
// retry, or a manual backfill) without creating duplicates or duplicate tags.
async function syncPaidCheckoutSession(session) {
  if (session.payment_status !== 'paid') {
    return { synced: false, reason: 'not paid' };
  }

  const { nombre, tel, amigoNombre, amigoTel, tier } = session.metadata || {};
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

  const eventTagged = await addTagByName(contact.id, EVENT_TAG);
  const tierTag = TIER_TAGS[tier];
  if (tierTag) await addTagByName(contact.id, tierTag);

  // Order matters: only drop the "hasn't paid" tag once EVENT_TAG has actually landed.
  // If tagging failed, keeping NO_PAGO_TAG leaves the buyer in a segment someone can work
  // by hand — better than a paid contact silently belonging to neither segment.
  if (eventTagged) {
    await removeTagByName(contact.id, NO_PAGO_TAG);
  } else {
    console.error('evento: EVENT_TAG not applied, keeping NO_PAGO_TAG for contact', contact.id);
  }

  return { synced: true, contactId: contact.id, email };
}

module.exports = { registerEventoLead, syncPaidCheckoutSession, normalizePhone, EVENT_TAG, NO_PAGO_TAG, TIER_TAGS };
