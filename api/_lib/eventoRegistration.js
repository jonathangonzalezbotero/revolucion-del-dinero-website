const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { splitName, upsertContact, addTagByName } = require('./systeme');

const EVENT_TAG = 'evento-septiembre-2026';
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

// Syncs a paid Stripe Checkout Session into systeme.io: upserts the contact and applies
// the event + tier tags. Idempotent — safe to re-run for the same session (e.g. a Stripe
// retry, or a manual backfill) without creating duplicates or duplicate tags.
async function syncPaidCheckoutSession(session) {
  if (session.payment_status !== 'paid') {
    return { synced: false, reason: 'not paid' };
  }

  const { nombre, tel, tier } = session.metadata || {};
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
  });

  await addTagByName(contact.id, EVENT_TAG);
  const tierTag = TIER_TAGS[tier];
  if (tierTag) await addTagByName(contact.id, tierTag);

  return { synced: true, contactId: contact.id, email };
}

module.exports = { syncPaidCheckoutSession, EVENT_TAG, TIER_TAGS };
