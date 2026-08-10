import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, DEFAULT_OG_IMAGE } from '../seoData';

export { SITE_URL, DEFAULT_OG_IMAGE };

function Seo({ title, description, path = '/', image = DEFAULT_OG_IMAGE, type = 'website', jsonLd }) {
  const url = `${SITE_URL}${path}`;
  const jsonLdList = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  // scripts/prerender.js bakes these same tags into the static HTML so social
  // crawlers (which don't run JS) see correct per-page previews. Once Helmet
  // has taken over here, drop the static copies so the live DOM isn't duplicated.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.querySelectorAll('[data-prerendered]').forEach((el) => el.remove());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="es_AU" />
      <meta property="og:site_name" content="Revolución del Dinero" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdList.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export default Seo;
