// Runs after `react-scripts build` (as the npm "postbuild" hook). This is a plain
// CRA/client-rendered app: react-helmet-async only sets <title>/og:*/twitter:*/
// canonical/JSON-LD once JS runs in the browser, which social/link-preview
// crawlers (WhatsApp, Facebook, Twitter) never execute. So those crawlers only
// ever see build/index.html as shipped by webpack — the same file for every
// route — and it has no per-page meta tags at all.
//
// This script writes a real static HTML file per route (build/index.html,
// build/evento/index.html, ...) with the correct <head> baked in, using
// src/seoData.js as the single source of truth. vercel.json routes each path to
// its matching file. Every injected tag is marked data-prerendered so Seo.js can
// strip it once Helmet takes over client-side, avoiding duplicates.

const fs = require('fs');
const path = require('path');
const seoData = require('../src/seoData');

const buildDir = path.join(__dirname, '..', 'build');
const templatePath = path.join(buildDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error(`prerender: ${templatePath} not found — run "react-scripts build" first.`);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');

function escapeHtmlAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHead(route) {
  const url = `${seoData.SITE_URL}${route.path}`;
  const title = escapeHtmlAttr(route.title);
  const description = escapeHtmlAttr(route.description);
  const jsonLdList = Array.isArray(route.jsonLd) ? route.jsonLd : [route.jsonLd];
  const jsonLdTags = jsonLdList
    .map((schema) => `<script type="application/ld+json" data-prerendered="true">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`)
    .join('');

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" data-prerendered="true" />`,
    `<link rel="canonical" href="${url}" data-prerendered="true" />`,
    `<meta property="og:type" content="website" data-prerendered="true" />`,
    `<meta property="og:url" content="${url}" data-prerendered="true" />`,
    `<meta property="og:title" content="${title}" data-prerendered="true" />`,
    `<meta property="og:description" content="${description}" data-prerendered="true" />`,
    `<meta property="og:image" content="${route.image}" data-prerendered="true" />`,
    `<meta property="og:locale" content="es_AU" data-prerendered="true" />`,
    `<meta property="og:site_name" content="Revolución del Dinero" data-prerendered="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-prerendered="true" />`,
    `<meta name="twitter:title" content="${title}" data-prerendered="true" />`,
    `<meta name="twitter:description" content="${description}" data-prerendered="true" />`,
    `<meta name="twitter:image" content="${route.image}" data-prerendered="true" />`,
    jsonLdTags,
  ].join('');
}

let count = 0;
for (const route of seoData.ROUTES) {
  let html = template.replace(/<meta name="description"[^>]*>/, '');
  html = html.replace(/<title>[^<]*<\/title>/, buildHead(route));

  const outPath = path.join(buildDir, route.outputFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`prerender: ${route.path} -> build/${route.outputFile}`);
  count += 1;
}

console.log(`prerender: done (${count} route${count === 1 ? '' : 's'}).`);
