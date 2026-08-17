// Thin wrapper around the systeme.io public API (https://developer.systeme.io/reference).
// Server-side only — SYSTEME_API_KEY must never be sent to the browser.

const BASE_URL = 'https://api.systeme.io/api';

function apiKey() {
  const key = process.env.SYSTEME_API_KEY;
  if (!key) throw new Error('SYSTEME_API_KEY is not set');
  return key;
}

async function systemeFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'X-API-Key': apiKey(),
      'Content-Type': options.contentType || 'application/json',
      ...options.headers,
    },
  });
  return res;
}

// Splits "Jonathan González Botero" into { firstName: "Jonathan", surname: "González Botero" }.
// systeme.io only has first_name/surname, not a single full-name field.
function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || '';
  const surname = parts.join(' ');
  return { firstName, surname };
}

// Creates a contact, or — if the email already exists — looks it up and patches it instead.
async function upsertContact({ email, firstName, surname, phone }) {
  const standardFields = [
    { slug: 'first_name', value: firstName || null },
    { slug: 'surname', value: surname || null },
    { slug: 'phone_number', value: phone || null },
  ];

  const res = await systemeFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify({ email, locale: 'es', fields: standardFields }),
  });
  const result = res.status === 201 ? await res.json() : { error: res.status, body: await res.text().catch(() => '') };

  if (!result.error) return { id: result.id, created: true };

  // Most likely cause of a non-201 here: the email already exists. Look it up and patch it.
  const existing = await findContactByEmail(email);
  if (!existing) {
    throw new Error(`systeme.io contact upsert failed (${result.error}): ${result.body}`);
  }

  const patchRes = await systemeFetch(`/contacts/${existing.id}`, {
    method: 'PATCH',
    contentType: 'application/merge-patch+json',
    body: JSON.stringify({ locale: 'es', fields: standardFields }),
  });
  if (!patchRes.ok) {
    // Non-fatal — the contact already exists in the CRM, it just didn't get these updated fields.
    console.error('systeme.io contact patch failed', patchRes.status, await patchRes.text().catch(() => ''));
  }
  return { id: existing.id, created: false };
}

// GET /api/contacts doesn't have officially-confirmed filter docs at the time of writing —
// this is a best-effort lookup and intentionally never throws (tagging/patching is best-effort).
async function findContactByEmail(email) {
  try {
    const res = await systemeFetch(`/contacts?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.items || data['hydra:member'] || [];
    return list.find((c) => c.email?.toLowerCase() === email.toLowerCase()) || list[0] || null;
  } catch (err) {
    console.error('systeme.io findContactByEmail failed', err);
    return null;
  }
}

async function findTagByName(name) {
  try {
    const res = await systemeFetch('/tags');
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.items || data['hydra:member'] || [];
    return list.find((t) => t.name?.toLowerCase() === name.toLowerCase()) || null;
  } catch (err) {
    console.error('systeme.io findTagByName failed', err);
    return null;
  }
}

async function ensureTag(name) {
  const createRes = await systemeFetch('/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (createRes.status === 201) return createRes.json();

  const existing = await findTagByName(name);
  if (existing) return existing;

  throw new Error(`Could not create or find systeme.io tag "${name}" (${createRes.status})`);
}

async function tagContact(contactId, tagId) {
  const res = await systemeFetch(`/contacts/${contactId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tagId }),
  });
  if (res.status !== 204) {
    console.error('systeme.io tagContact failed', res.status, await res.text().catch(() => ''));
  }
}

// Best-effort: create/find the tag, then assign it. Never throws — tagging failures
// shouldn't take down a registration request.
async function addTagByName(contactId, tagName) {
  try {
    const tag = await ensureTag(tagName);
    await tagContact(contactId, tag.id);
  } catch (err) {
    console.error('systeme.io addTagByName failed', err);
  }
}

module.exports = { splitName, upsertContact, findContactByEmail, addTagByName };
