const { parsePhoneNumberFromString } = require('libphonenumber-js');

// Layered, invisible checks for the public form endpoints. None of these adds a step for a
// real visitor — no checkbox, no puzzle, nothing to read.
//
// Context: /api/mentor-request had no protection at all and was being flooded with fake
// names and addresses. A "No soy un robot" checkbox was tried first and made no difference,
// which is the signal that the bots POST straight to the endpoint and never render the form
// — so origin validation below, not the form itself, is the load-bearing control here.

// Only the real site (plus localhost and Vercel previews) may post to these endpoints.
// A browser always sends Origin on a fetch POST, so a request carrying neither Origin nor a
// matching Referer did not come from the site.
const ALLOWED_HOST_RE = /^(?:(?:www\.)?revoluciondeldinero\.com|localhost(?::\d+)?|[a-z0-9-]+\.vercel\.app)$/i;

function isTrustedOrigin(req) {
  const candidates = [req.headers.origin, req.headers.referer].filter(Boolean);
  if (!candidates.length) return false;

  return candidates.some((value) => {
    try {
      return ALLOWED_HOST_RE.test(new URL(value).host);
    } catch {
      return false;
    }
  });
}

// Bots submit the instant they reach a form; a human needs seconds to type three fields.
// `startedAt` is the epoch ms at which the form was opened, sent by the client.
//
// A missing value is NOT treated as spam: someone on a stale cached bundle wouldn't send it,
// and silently dropping a real mentorship request costs far more than letting one bot
// through. Every other check still applies to such a request.
const MIN_FILL_MS = 3000;

function isSubmittedTooFast(startedAt) {
  const started = Number(startedAt);
  if (!Number.isFinite(started) || started <= 0) return false;

  const elapsed = Date.now() - started;
  return elapsed >= 0 && elapsed < MIN_FILL_MS;
}

// Throwaway-inbox domains. Deliberately not exhaustive — a cheap filter for the common ones.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'throwawaymail.com', 'yopmail.com', 'sharklasers.com',
  'trashmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com',
  'mailnesia.com', 'spam4.me', 'grr.la', 'mohmal.com', 'moakt.com', 'emailondeck.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlausibleEmail(email) {
  if (!EMAIL_RE.test(email)) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return Boolean(domain) && !DISPOSABLE_DOMAINS.has(domain);
}

// The strongest signal available: the form has no free-text field, so a bot's only garbage
// surface is the phone number, and real leads type something reachable.
//
// Tuned to favour letting real people through. The audience is Spanish-speaking and spread
// across countries, so a number without a country code is tested against every country the
// audience plausibly dials from rather than assuming AU — a Colombian typing "3001234567"
// must not be turned away.
const PHONE_COUNTRIES = ['AU', 'CO', 'ES', 'US', 'MX', 'AR', 'CL', 'PE', 'VE', 'EC', 'GB', 'NZ'];

function isPlausiblePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // 1111111111 and friends

  if (raw.trim().startsWith('+')) {
    const parsed = parsePhoneNumberFromString(raw);
    return Boolean(parsed && parsed.isValid());
  }

  return PHONE_COUNTRIES.some((country) => {
    const parsed = parsePhoneNumberFromString(raw, country);
    return Boolean(parsed && parsed.isValid());
  });
}

// A "name" carrying a URL or markup is a link-spam payload, not a person.
function isPlausibleName(nombre) {
  if (nombre.length < 2 || nombre.length > 80) return false;
  return !/https?:\/\/|www\.|<[a-z/]/i.test(nombre);
}

// Best-effort in-memory throttle. Vercel runs several isolated instances, so this caps abuse
// per warm instance rather than globally — it blunts a flood but a distributed attacker gets
// around it. Move to Vercel KV / Upstash if that ever becomes the real problem.
const hits = new Map();

function isRateLimited(key, { max, windowMs }) {
  if (!key) return false;

  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

  // Prune stale keys so the map can't grow without bound on a long-lived instance.
  if (hits.size > 500) {
    for (const [k, times] of hits) {
      if (!times.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }

  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
}

module.exports = {
  isTrustedOrigin,
  isSubmittedTooFast,
  isPlausibleEmail,
  isPlausiblePhone,
  isPlausibleName,
  isRateLimited,
  clientIp,
  MIN_FILL_MS,
};
