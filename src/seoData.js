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
const EVENTO_DESCRIPTION = 'Taller presencial de finanzas personales en español, en el Robina Events Centre, Gold Coast, Australia. Sábado 12 de septiembre de 2026, de 3:00 a 6:30 pm. Entrada $10 AUD e incluye a tu pareja o acompañante. Lo recaudado en entradas se dona a las familias afectadas por el terremoto en Colombia.';

const EVENTO_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Taller de Finanzas Personales — Revolución del Dinero',
  description: EVENTO_DESCRIPTION,
  startDate: '2026-09-12T15:00:00+10:00',
  endDate: '2026-09-12T18:30:00+10:00',
  doorTime: '2026-09-12T14:30:00+10:00',
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

const BOOTCAMP_TITLE = 'Bootcamp Financiero en Gold Coast · Sábado 28 de noviembre de 2026 | Revolución del Dinero';
const BOOTCAMP_DESCRIPTION = 'Un día presencial en español para ordenar tu plata: tus números, tus deudas, tus hábitos y tu proyección del año. Sábado 28 de noviembre de 2026, de 10:00 a 19:00, en Gold Coast, Australia. $250 AUD por persona o $400 AUD para dos, con el curso completo «Proyección anual financiera» incluido.';

// Educación y formación — deliberadamente sin temario publicado. Ver la cabecera de
// src/pages/Bootcamp.js.
const BOOTCAMP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Bootcamp Financiero — Revolución del Dinero',
  description: BOOTCAMP_DESCRIPTION,
  startDate: '2026-11-28T10:00:00+10:00',
  endDate: '2026-11-28T19:00:00+10:00',
  doorTime: '2026-11-28T09:30:00+10:00',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: 'Gold Coast, Australia',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gold Coast',
      addressRegion: 'QLD',
      addressCountry: 'AU',
    },
  },
  image: [DEFAULT_OG_IMAGE],
  inLanguage: 'es',
  organizer: {
    '@type': 'Person',
    name: 'Jonathan González Botero',
    url: SITE_URL,
  },
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
};

const BOOTCAMP_GRACIAS_TITLE = 'Tu lugar en el Bootcamp está confirmado | Revolución del Dinero';
const BOOTCAMP_GRACIAS_DESCRIPTION = 'Confirmación de compra del Bootcamp Financiero del sábado 28 de noviembre de 2026 en Gold Coast, con el curso «Proyección anual financiera» incluido.';

// Disclaimer legal obligatorio. Va en el pie de /circulo y /circulo/gracias, y en
// /terminos. Jonathan no tiene licencia AFSL en Australia y opera bajo su ABN personal:
// esta línea es la que separa educación financiera general de asesoría sobre productos
// financieros. Se declara una sola vez acá para que no pueda divergir entre páginas, y se
// pinta legible (ver .cir-disclaimer), no gris sobre gris.
const DISCLAIMER_AFSL = 'Revolución del Dinero ofrece educación financiera general. No damos asesoría sobre productos financieros específicos. Para decisiones sobre inversiones, seguros, superannuation, préstamos o impuestos, consulta a un profesional licenciado en Australia.';

const CIRCULO_TITLE = 'Círculo Presencial — Un año de acompañamiento financiero en español, en Australia | Revolución del Dinero';
const CIRCULO_DESCRIPTION = 'Un año con Jonathan González y un grupo pequeño de latinos en Australia para ordenar tu plata: grupo privado de WhatsApp, sesiones mensuales en grupo, 4 sesiones uno a uno, el Bootcamp Financiero de noviembre y el evento «Libera tu potencial» de marzo, presenciales e incluidos. $1.000 AUD o 6 cuotas de $180. Todo en español.';

// Se declara como Service y no como Event: es un programa de un año, no una fecha. Sin
// conteo de contenido y sin lenguaje de asesoría sobre productos financieros — ver la
// cabecera de src/pages/Circulo.js.
const CIRCULO_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Círculo Presencial — Revolución del Dinero',
  description: CIRCULO_DESCRIPTION,
  serviceType: 'Programa de educación financiera y acompañamiento en grupo',
  inLanguage: 'es',
  areaServed: {
    '@type': 'Place',
    name: 'Gold Coast, Queensland, Australia',
  },
  provider: {
    '@type': 'Person',
    name: 'Jonathan González Botero',
    url: SITE_URL,
  },
  image: [DEFAULT_OG_IMAGE],
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
  disclaimer: DISCLAIMER_AFSL,
};

const CIRCULO_GRACIAS_TITLE = 'Ya estás en el Círculo Presencial | Revolución del Dinero';
const CIRCULO_GRACIAS_DESCRIPTION = 'Confirmación de tu entrada al Círculo Presencial de Revolución del Dinero, con tu plan de pago, el enlace para agendar tu primera sesión uno a uno y la fecha del Bootcamp Financiero incluido.';

const TERMINOS_TITLE = 'Términos y política de reembolso | Revolución del Dinero';
const TERMINOS_DESCRIPTION = 'Términos de compra y política de reembolso de los programas y eventos presenciales de Revolución del Dinero, en lenguaje llano.';

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
  {
    path: '/bootcamp',
    outputFile: 'bootcamp/index.html',
    title: BOOTCAMP_TITLE,
    description: BOOTCAMP_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    jsonLd: BOOTCAMP_JSON_LD,
  },
  {
    path: '/circulo',
    outputFile: 'circulo/index.html',
    title: CIRCULO_TITLE,
    description: CIRCULO_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    jsonLd: CIRCULO_JSON_LD,
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
  BOOTCAMP_TITLE,
  BOOTCAMP_DESCRIPTION,
  BOOTCAMP_JSON_LD,
  BOOTCAMP_GRACIAS_TITLE,
  BOOTCAMP_GRACIAS_DESCRIPTION,
  CIRCULO_TITLE,
  CIRCULO_DESCRIPTION,
  CIRCULO_JSON_LD,
  CIRCULO_GRACIAS_TITLE,
  CIRCULO_GRACIAS_DESCRIPTION,
  DISCLAIMER_AFSL,
  TERMINOS_TITLE,
  TERMINOS_DESCRIPTION,
  ROUTES,
};
