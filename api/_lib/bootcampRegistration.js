const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { splitName, upsertContact, addTagByName } = require('./systeme');

// Deliberately a separate module from _lib/eventoRegistration.js. The September event is
// in production with real sales, so nothing here reaches into that path — the only shared
// code is _lib/systeme.js, the low-level API wrapper, which is untouched.
//
// THE ONLY TAG THIS PRODUCT EVER APPLIES.
//
// It is NOT "acceso-comunidad": that tag belongs to the Círculo Presencial ($1.000) and
// triggers a systeme.io automation that emails the Skool access link. A Bootcamp buyer
// pays $250 for a single day — no community, no Skool. Tagging a Bootcamp buyer with
// acceso-comunidad hands them a $1.000 product for free.
const BOOTCAMP_TAG = 'bootcamp-nov-2026';

// Same reasoning as eventoRegistration.normalizePhone: the form is a bare <input type="tel">
// with no country-code enforcement, and systeme.io defaults untagged numbers to its own
// fallback country, breaking SMS. The Bootcamp is in Gold Coast, so assume AU when the
// number carries no explicit country code.
function normalizePhone(raw) {
  if (!raw) return '';
  const parsed = parsePhoneNumberFromString(raw, 'AU');
  return parsed && parsed.isValid() ? parsed.format('E.164') : raw;
}

// The "entrada para dos" companion. Reuses the same custom-field slugs the event form
// already writes to, so Jonathan reads one pair of fields in systeme.io, not two.
function partnerFields(amigoNombre, amigoTel) {
  const fields = [];
  if (amigoNombre) fields.push({ slug: 'partners_name', value: amigoNombre });
  if (amigoTel) fields.push({ slug: 'partners_phone', value: normalizePhone(amigoTel) });
  return fields;
}

// Called on form submit, BEFORE any payment — the non-negotiable requirement for this page.
// Creates (or updates) the contact and applies BOOTCAMP_TAG, so someone who fills the form
// and never reaches Stripe is still reachable in the CRM.
//
// Idempotent: upsertContact looks up by email, and re-applying a tag the contact already
// carries is a no-op, so a resubmit updates rather than duplicates.
async function registerBootcampLead({ nombre, email, tel, amigoNombre, amigoTel }) {
  const { firstName, surname } = splitName(nombre);

  const contact = await upsertContact({
    email,
    firstName,
    surname,
    phone: normalizePhone(tel),
    extraFields: partnerFields(amigoNombre, amigoTel),
  });

  await addTagByName(contact.id, BOOTCAMP_TAG);

  return { contactId: contact.id, email };
}

// Runs from api/stripe-webhook.js once Stripe confirms a Bootcamp payment. Re-upserts the
// contact using the email Stripe actually charged (which can differ from the one typed into
// the form) and re-applies BOOTCAMP_TAG — no other tag, by decision on record.
async function syncPaidBootcampSession(session) {
  if (session.payment_status !== 'paid') {
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

  await addTagByName(contact.id, BOOTCAMP_TAG);

  return { synced: true, contactId: contact.id, email };
}

module.exports = { registerBootcampLead, syncPaidBootcampSession, BOOTCAMP_TAG };
