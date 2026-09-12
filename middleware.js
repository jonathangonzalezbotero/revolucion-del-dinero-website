// Vercel Edge Middleware: serves a fully pre-rendered HTML snapshot (correct
// <title>/description/canonical/OG/Twitter/JSON-LD baked in) to search and
// social-link-preview crawlers, since this is a client-side-only React SPA —
// crawlers that don't execute JavaScript (WhatsApp, Facebook, Twitter/X,
// LinkedIn, Slack, Discord, ...) would otherwise only ever see the generic
// fallback tags from public/index.html, no matter which route was requested.
//
// Real users and JS-executing bots (Googlebot renders JS) are untouched —
// this only intercepts requests whose User-Agent matches a known crawler.
//
// Keep HOME_HTML / EVENTO_HTML's title/description/JSON-LD in sync with
// src/pages/Home.js and src/pages/Evento.js (via src/components/Seo.js) if
// that copy changes — this file can't share code with the React bundle since
// it runs in a separate Edge runtime.

export const config = {
  matcher: ['/', '/evento', '/bootcamp', '/circulo'],
};

const SITE_URL = 'https://www.revoluciondeldinero.com';
// 1200x630 JPG crop of src/assets/images/Jonathan_01.webp, served from
// public/ so the URL is stable (bundled src/assets get hashed filenames) and
// in JPG because WhatsApp/LinkedIn previews don't reliably render WebP.
const OG_IMAGE = `${SITE_URL}/assets/jonathan-og.jpg`;

const BOT_UA_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|SkypeUriPreview|Pinterest|redditbot|Applebot|vkShare|Googlebot|Google-InspectionTool|bingbot|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|ia_archiver|W3C_Validator/i;

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function page({ title, description, path, image = OG_IMAGE, type = 'website', jsonLd, heading, body }) {
  const url = `${SITE_URL}${path}`;
  const jsonLdList = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="${type}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Revolución del Dinero" />
<meta property="og:locale" content="es_AU" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
${jsonLdList.map((schema) => `<script type="application/ld+json">${safeJsonLd(schema)}</script>`).join('\n')}
</head>
<body>
<h1>${heading}</h1>
<p>${body}</p>
<p><a href="${url}">${url}</a></p>
</body>
</html>`;
}

const HOME_HTML = page({
  title: 'Revolución del Dinero — Educación Financiera en Español para Latinos | Jonathan González',
  description:
    'Aprende a reprogramar tu mente, administrar tu dinero e invertir con confianza. Comunidad de educación financiera 100% en español para latinos en Australia y el mundo, liderada por Jonathan González.',
  path: '/',
  heading: 'Revolución del Dinero — Educación Financiera en Español para Latinos',
  body: 'Aprende a reprogramar tu mente, administrar tu dinero e invertir con confianza. Comunidad de educación financiera 100% en español para latinos en Australia y el mundo, liderada por Jonathan González.',
  jsonLd: [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Revolución del Dinero', url: SITE_URL, inLanguage: 'es' },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Jonathan González Botero',
      url: SITE_URL,
      image: OG_IMAGE,
      jobTitle: 'Fundador, Revolución del Dinero',
      description: 'Educador financiero para la comunidad latina en Australia y el mundo.',
      sameAs: ['https://www.skool.com/revolucion-del-dinero-7029'],
    },
  ],
});

const EVENTO_HTML = page({
  title: 'Taller de Finanzas Personales en Gold Coast · $10 AUD | Revolución del Dinero',
  description:
    'Evento presencial de educación financiera en español, en el Robina Events Centre, Gold Coast, Australia — 12 de septiembre de 2026. Entrada $10 AUD, incluye a tu pareja o acompañante. Cupos limitados.',
  path: '/evento',
  heading: 'Taller de Finanzas Personales en Gold Coast — $10 AUD',
  body: 'Evento presencial de educación financiera en español, en el Robina Events Centre, Gold Coast, Australia, el 12 de septiembre de 2026. Entrada $10 AUD, incluye a tu pareja o acompañante. Cupos limitados.',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Taller de Finanzas Personales — Revolución del Dinero',
    description:
      'Evento presencial de educación financiera en español, en el Robina Events Centre, Gold Coast, Australia — 12 de septiembre de 2026. Entrada $10 AUD, incluye a tu pareja o acompañante. Cupos limitados.',
    startDate: '2026-09-12',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: 'Robina Events Centre',
      address: { '@type': 'PostalAddress', addressLocality: 'Robina', addressRegion: 'QLD', addressCountry: 'AU' },
    },
    image: [OG_IMAGE],
    organizer: { '@type': 'Person', name: 'Jonathan González Botero', url: SITE_URL },
    offers: {
      '@type': 'Offer',
      price: '10',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/evento`,
      validFrom: '2026-01-01',
    },
  },
});

// Sin temario publicado y sin lenguaje de asesoría sobre productos financieros, igual que
// la página real: esto es lo que WhatsApp, Meta y Google leen del enlace /bootcamp, así
// que es texto publicado con el mismo peso que el de src/pages/Bootcamp.js.
const BOOTCAMP_DESCRIPTION =
  'Un día presencial en español para ordenar tu plata: tus números, tus deudas, tus hábitos y tu proyección del año. Sábado 28 de noviembre de 2026, de 10:00 a 19:00, en Gold Coast, Australia. $250 AUD por persona o $400 AUD para dos, e incluye una sesión de 30 minutos con Jonathan. El almuerzo no está incluido.';

const BOOTCAMP_HTML = page({
  title: 'Bootcamp Financiero en Gold Coast · Sábado 28 de noviembre de 2026 | Revolución del Dinero',
  description: BOOTCAMP_DESCRIPTION,
  path: '/bootcamp',
  heading: 'Bootcamp Financiero en Gold Coast — Sábado 28 de noviembre de 2026',
  body: BOOTCAMP_DESCRIPTION,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Bootcamp Financiero — Revolución del Dinero',
    description: BOOTCAMP_DESCRIPTION,
    startDate: '2026-11-14T10:00:00+10:00',
    endDate: '2026-11-14T19:00:00+10:00',
    doorTime: '2026-11-14T09:30:00+10:00',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: 'Gold Coast, Australia',
      address: { '@type': 'PostalAddress', addressLocality: 'Gold Coast', addressRegion: 'QLD', addressCountry: 'AU' },
    },
    image: [OG_IMAGE],
    inLanguage: 'es',
    organizer: { '@type': 'Person', name: 'Jonathan González Botero', url: SITE_URL },
    offers: [
      {
        '@type': 'Offer',
        name: 'Entrada individual',
        price: '250',
        priceCurrency: 'AUD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/bootcamp`,
        validFrom: '2026-09-12',
      },
      {
        '@type': 'Offer',
        name: 'Entrada para dos personas',
        price: '400',
        priceCurrency: 'AUD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/bootcamp`,
        validFrom: '2026-09-12',
      },
    ],
  },
});

// Sin conteo de contenido y sin lenguaje de asesoría sobre productos financieros, igual
// que la página real: esto es lo que WhatsApp, Meta y Google leen del enlace /circulo.
const CIRCULO_DESCRIPTION =
  'Un año con Jonathan González y un grupo pequeño de latinos en Australia para ordenar tu plata: comunidad privada, sesiones mensuales en grupo, sesiones uno a uno y el Bootcamp Financiero presencial incluido. $1.000 AUD o 6 cuotas de $180. Todo en español.';

const CIRCULO_HTML = page({
  title: 'Círculo Presencial — Un año de acompañamiento financiero en español, en Australia | Revolución del Dinero',
  description: CIRCULO_DESCRIPTION,
  path: '/circulo',
  heading: 'Círculo Presencial — Un año de acompañamiento financiero en español, en Australia',
  body: CIRCULO_DESCRIPTION,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Círculo Presencial — Revolución del Dinero',
    description: CIRCULO_DESCRIPTION,
    serviceType: 'Programa de educación financiera y acompañamiento en grupo',
    inLanguage: 'es',
    areaServed: { '@type': 'Place', name: 'Gold Coast, Queensland, Australia' },
    provider: { '@type': 'Person', name: 'Jonathan González Botero', url: SITE_URL },
    image: [OG_IMAGE],
    offers: [
      {
        '@type': 'Offer',
        name: 'Círculo Presencial — Individual',
        price: '1000',
        priceCurrency: 'AUD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/circulo`,
      },
      {
        '@type': 'Offer',
        name: 'Círculo Presencial — Para dos personas',
        price: '1500',
        priceCurrency: 'AUD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/circulo`,
      },
    ],
    termsOfService: `${SITE_URL}/terminos`,
    disclaimer:
      'Revolución del Dinero ofrece educación financiera general. No damos asesoría sobre productos financieros específicos. Para decisiones sobre inversiones, seguros, superannuation, préstamos o impuestos, consulta a un profesional licenciado en Australia.',
  },
});

const CRAWLER_PAGES = {
  '/evento': EVENTO_HTML,
  '/bootcamp': BOOTCAMP_HTML,
  '/circulo': CIRCULO_HTML,
};

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA_RE.test(ua)) return;

  const { pathname } = new URL(request.url);
  const html = CRAWLER_PAGES[pathname] || HOME_HTML;

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
