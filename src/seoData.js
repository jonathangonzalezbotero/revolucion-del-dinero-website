// Plain-data (CommonJS) module: the single source of truth for per-route SEO
// metadata. It's imported both by React (via webpack/Babel interop) and directly
// by `node scripts/prerender.js`, which can't parse JSX — hence no JSX here.

const SITE_URL = 'https://www.revoluciondeldinero.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/comunidad-og.jpg`;
const SKOOL_URL = 'https://www.skool.com/revolucion-del-dinero-7029';

const HOME_TITLE = 'Revolución del Dinero — Educación Financiera en Español para Latinos | Jonathan González';
const HOME_DESCRIPTION = 'Aprende a reprogramar tu mente, administrar tu dinero e invertir con confianza. Comunidad de educación financiera 100% en español para latinos en Australia y el mundo, liderada por Jonathan González.';

const HOME_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Revolución del Dinero',
    url: SITE_URL,
    inLanguage: 'es',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Jonathan González Botero',
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    jobTitle: 'Fundador, Revolución del Dinero',
    description: 'Educador financiero para la comunidad latina en Australia y el mundo.',
    sameAs: [SKOOL_URL],
  },
];

const EVENTO_TITLE = 'Taller de Finanzas Personales en Gold Coast · $10 AUD | Revolución del Dinero';
const EVENTO_DESCRIPTION = 'Evento presencial de educación financiera en español, en el Robina Events Centre, Gold Coast, Australia — 12 de septiembre de 2026. Entrada $10 AUD, 100% donado a las víctimas del terremoto en Colombia. Cupos limitados.';

// TODO (Jonathan): update startDate with the exact start time once it's confirmed.
const EVENTO_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Taller de Finanzas Personales — Revolución del Dinero',
  description: EVENTO_DESCRIPTION,
  startDate: '2026-09-12',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: 'Robina Events Centre',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Robina',
      addressRegion: 'QLD',
      addressCountry: 'AU',
    },
  },
  image: [DEFAULT_OG_IMAGE],
  organizer: {
    '@type': 'Person',
    name: 'Jonathan González Botero',
    url: SITE_URL,
  },
  offers: {
    '@type': 'Offer',
    price: '10',
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/evento`,
    validFrom: '2026-01-01',
  },
};

// Add an entry here (+ a matching rewrite in vercel.json) whenever a new route
// needs its own prerendered <head> tags for social/search crawlers.
const ROUTES = [
  {
    path: '/',
    outputFile: 'index.html',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    jsonLd: HOME_JSON_LD,
  },
  {
    path: '/evento',
    outputFile: 'evento/index.html',
    title: EVENTO_TITLE,
    description: EVENTO_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    jsonLd: EVENTO_JSON_LD,
  },
];

module.exports = {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  SKOOL_URL,
  HOME_TITLE,
  HOME_DESCRIPTION,
  HOME_JSON_LD,
  EVENTO_TITLE,
  EVENTO_DESCRIPTION,
  EVENTO_JSON_LD,
  ROUTES,
};
