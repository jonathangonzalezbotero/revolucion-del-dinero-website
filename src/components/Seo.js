import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://www.revoluciondeldinero.com';
export const DEFAULT_OG_IMAGE = 'https://d1yei2z3i6k35z.cloudfront.net/17411220/69f40e697ce5b6.59615049_Jonathan.png';

function Seo({ title, description, path = '/', image = DEFAULT_OG_IMAGE, type = 'website', jsonLd }) {
  const url = `${SITE_URL}${path}`;
  const jsonLdList = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

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
