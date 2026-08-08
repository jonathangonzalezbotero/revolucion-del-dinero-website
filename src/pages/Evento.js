import { useEffect, useRef, useState } from 'react';
import './Evento.css';
import Comunidad from '../assets/images/Comunidad.webp';
import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import Seo, { SITE_URL, DEFAULT_OG_IMAGE } from '../components/Seo';

const LOGO_URL = 'https://d1yei2z3i6k35z.cloudfront.net/17411220/69f4103eaf1164.06093873_REVOLUCIONDELDINERO-TRANSPARENT.png';

const STRIPE_GENERAL_URL = 'https://buy.stripe.com/3cI5kD4Dg6I2cxS6VIf7i02';
const STRIPE_VIP_URL = 'https://buy.stripe.com/8x214n0n01nI69u5REf7i03';

const EVENTO_TITLE = 'Taller de Finanzas Personales en Gold Coast · $10 AUD | Revolución del Dinero';
const EVENTO_DESCRIPTION = 'Evento presencial de educación financiera en español, en Gold Coast, Australia — 12 de septiembre de 2026. Entrada $10 AUD, incluye a tu pareja o acompañante. Cupos limitados.';

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
    name: 'Gold Coast',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gold Coast',
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

function Evento() {
  const [showVip, setShowVip] = useState(false);

  const formRef = useRef(null);
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const telRef = useRef(null);
  const amigoNombreRef = useRef(null);
  const amigoTelRef = useRef(null);
  const regWrapRef = useRef(null);

  useRevealOnScroll();

  useEffect(() => {
    document.body.style.overflow = showVip ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showVip]);

  useEffect(() => {
    window.fbq?.('track', 'ViewContent', { value: 10, currency: 'AUD', content_name: 'Evento Gold Coast' });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const nombre = nombreRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const tel = telRef.current.value.trim();
    if (!nombre || !email || !tel) {
      formRef.current.reportValidity();
      return;
    }
    const amigoNombre = amigoNombreRef.current.value.trim();
    const amigoTel = amigoTelRef.current.value.trim();

    // Fire-and-forget: sync to the systeme.io CRM without blocking the upsell modal.
    fetch('/api/systeme-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, tel, amigoNombre, amigoTel }),
    }).catch((err) => console.error('systeme-contact request failed', err));

    window.fbq?.('track', 'Lead');
    setShowVip(true);
  };

  const trackCheckoutTier = (tier, value) => {
    window.fbq?.('track', 'InitiateCheckout', { value, currency: 'AUD', content_name: tier === 'vip' ? 'Entrada VIP' : 'Entrada General' });
    const email = emailRef.current?.value.trim();
    if (!email) return;
    // keepalive lets this request survive the page navigating away to Stripe right after.
    fetch('/api/systeme-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tier }),
      keepalive: true,
    }).catch((err) => console.error('systeme-tag request failed', err));
  };

  const handleGeneralCheckoutClick = () => trackCheckoutTier('general', 10);
  const handleVipCheckoutClick = () => trackCheckoutTier('vip', 20);

  const handleScrollToForm = (e) => {
    e.preventDefault();
    regWrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nombreRef.current.focus({ preventScroll: true });
  };

  return (
    <div className="page-evento">
      <Seo title={EVENTO_TITLE} description={EVENTO_DESCRIPTION} path="/evento" jsonLd={EVENTO_JSON_LD} />

      <div className="ann">🎟️ Evento presencial · <b>$10 AUD</b> · Gold Coast · 12 de septiembre 2026 — cupos limitados</div>

      {/* HERO + FORM */}
      <section className="evt-hero">
        <div className="evt-hero-bg">
          <video src="/videos/hero-bg.mp4" poster="/videos/hero-bg-poster.webp" autoPlay muted loop playsInline />
        </div>
        <div className="wrap evt-hero-grid">
          <div className="hero-copy">
            <span className="badge-price">✦ Entrada $10 AUD · En español</span>
            <h1>Tu primer paso hacia la <span className="ital">libertad financiera.</span></h1>
            <p className="lead">Un evento presencial de finanzas personales donde aprenderás a reprogramar tu mente, administrar tu dinero y dar tus primeros pasos para invertir.</p>
            <div className="meta-row">
              <div className="meta-chip"><div className="meta-chip-head"><span className="ic">📅</span><small>Fecha</small></div><b>Sáb 12 de sept.</b></div>
              <div className="meta-chip"><div className="meta-chip-head"><span className="ic">📍</span><small>Lugar</small></div><b>Gold Coast, AU</b></div>
              <div className="meta-chip meta-chip-price"><div className="meta-chip-head"><span className="ic">🎟️</span><small>Entrada</small></div><b>$10 AUD</b></div>
            </div>
            <div className="plus-one"><b>$10 AUD</b> incluye a tu pareja o un acompañante — sin costo extra.</div>
            <div className="hero-img">
              <img src={Comunidad} alt="Asistentes en un evento de Revolución del Dinero" />
              <div className="ov">+50 asistentes en los eventos</div>
            </div>
            <div className="scarce"><span className="dot"></span> Cupos limitados — asegura el tuyo antes de que se llenen.</div>
          </div>

          <div className="formcard-sticky" id="regWrap" ref={regWrapRef}>
            <div className="formcard">
              <div className="fhead">
                <h3>Asegura tu cupo por $10 AUD</h3>
                <p className="fsub">Completa tus datos y reserva tu lugar en segundos. Tu entrada incluye a tu pareja o un amigo, sin pagar de más.</p>
              </div>
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <div className="field"><label htmlFor="nombre">Nombre completo</label><input id="nombre" name="nombre" type="text" placeholder="Tu nombre y apellido" ref={nombreRef} required /></div>
                <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" ref={emailRef} required /></div>
                <div className="field"><label htmlFor="tel">Teléfono</label><input id="tel" name="tel" type="tel" placeholder="+61 ..." ref={telRef} required /></div>

                <div className="field-divider">✦ Invita a tu pareja o un amigo (incluido en tu entrada)</div>
                <div className="field"><label htmlFor="amigoNombre">Nombre de tu amigo/pareja</label><input id="amigoNombre" name="amigoNombre" type="text" placeholder="Nombre y apellido" ref={amigoNombreRef} /></div>
                <div className="field"><label htmlFor="amigoTel">Teléfono de tu amigo/pareja</label><input id="amigoTel" name="amigoTel" type="tel" placeholder="+61 ..." ref={amigoTelRef} /></div>

                <button type="submit" className="btn btn-gold btn-block">Asegurar mi cupo · $10 AUD →</button>
                <p className="fine">Te enviaremos los detalles del evento por correo y SMS.</p>
                <div className="trust-mini"><span>✓ Pago seguro</span><span>✓ Incluye a tu +1</span><span>✓ Cupos limitados</span></div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* IS THIS FOR YOU */}
      <section className="evt-sec" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Este evento es para ti si...</span>
            <h2>Te identificas con <span className="accent ital">al menos una</span> de estas frases.</h2>
          </div>
          <div className="list2">
            <div className="li"><span className="ck">✓</span><p>Quieres un camino <b>fácil de entender</b> para ahorrar e invertir.</p></div>
            <div className="li"><span className="ck">✓</span><p>Sueñas con <b>una casa propia</b> en Australia o en tu país.</p></div>
            <div className="li"><span className="ck">✓</span><p>Deseas <b>ayudar económicamente</b> a tu familia en tu país.</p></div>
            <div className="li"><span className="ck">✓</span><p>Trabajas <b>50–60 horas</b> y aún sientes que no te alcanza.</p></div>
            <div className="li"><span className="ck">✓</span><p>Quieres invertir pero <b>te da miedo</b> perderlo todo.</p></div>
            <div className="li"><span className="ck">✓</span><p>Sientes que <b>no eres bueno con los números</b>.</p></div>
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section className="evt-sec" id="aprenderas">
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Lo que cambiará en tus finanzas</span>
            <h2>Saldrás con un plan claro, no con más teoría.</h2>
          </div>
          <div className="learn">
            <div className="lcard"><div className="ic">🧠</div><h3>Reprograma tu mente</h3><p>Identificarás exactamente qué creencias te están costando dinero hoy — y cómo cambiarlas.</p></div>
            <div className="lcard"><div className="ic">📊</div><h3>Administra tu dinero</h3><p>Saldrás con un plan claro de cómo administrar lo que ganas, sin importar cuánto sea.</p></div>
            <div className="lcard"><div className="ic">🚀</div><h3>Tu primer paso real</h3><p>Entenderás qué es la libertad financiera y cuál es tu primer paso concreto para lograrla.</p></div>
          </div>
          <div className="learn-cta">
            <a href="#regWrap" className="btn btn-gold btn-lg" onClick={handleScrollToForm}>Asegurar mi cupo · $10 AUD →</a>
          </div>
        </div>
      </section>

      <AboutSection id="anfitrion" />

      <TestimonialsSection id="testimonios" />

      {/* FAQ */}
      <section className="evt-sec" id="faq" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Preguntas frecuentes</span>
            <h2>Todo lo que necesitas saber.</h2>
          </div>
          <div className="evt-faq">
            <details className="evt-qa"><summary>¿Cuánto cuesta asistir? <span className="pl">+</span></summary><div className="ans">La entrada tiene un valor de <b>$10 AUD</b> e <b>incluye a tu pareja o un acompañante</b> — no pagan por separado. Solo agrega sus datos al registrarte para que también quede en la lista.</div></details>
            <details className="evt-qa"><summary>¿Qué voy a aprender allí? <span className="pl">+</span></summary><div className="ans">Aprenderás a reprogramar tu mente para mejorar tu relación con el dinero, a administrarlo de manera óptima y a aplicar los primeros pasos para lograr tranquilidad financiera.</div></details>
            <details className="evt-qa"><summary>No soy bueno con el dinero, ¿vale la pena? <span className="pl">+</span></summary><div className="ans">Justamente saldrás con las herramientas y la información necesarias para que eso deje de ser un problema en tu vida. Te guiaré paso a paso.</div></details>
            <details className="evt-qa"><summary>¿Puedo asistir con mi pareja o un amigo? <span className="pl">+</span></summary><div className="ans">¡Claro! Tu entrada de $10 AUD ya incluye a un acompañante — agrega su nombre y WhatsApp en el formulario de registro y listo, no necesita pagar ni registrarse por separado.</div></details>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap inner">
          <span className="eyebrow" style={{ justifyContent: 'center', color: '#f4c56a' }}>Cupos limitados</span>
          <h2 style={{ marginTop: 16 }}>Tu lugar en Gold Coast <span style={{ color: '#f4c56a', fontStyle: 'italic' }}>te está esperando.</span></h2>
          <p>Regístrate hoy por $10 AUD — incluye a tu pareja o acompañante — y da el primer paso hacia la libertad financiera que viniste a buscar.</p>
          <a href="#regWrap" className="btn btn-gold btn-lg" onClick={handleScrollToForm}>Asegurar mi cupo · $10 AUD →</a>
        </div>
      </section>

      <footer className="evt-footer">
        <div className="wrap">
          <img src={LOGO_URL} alt="Revolución del Dinero" />
          <div className="cr">© 2026 Revolución del Dinero · Jonathan González Botero · Evento presencial en Gold Coast, Australia</div>
        </div>
      </footer>

      {/* VIP UPSELL */}
      <div className={`vip-overlay${showVip ? ' show' : ''}`}>
        <div className="vip-modal">
          <div className="vip-confirm">
            <div className="tick">✓</div>
            <div><b>¡Ya casi listo!</b><small>Elige tu entrada y completa el pago para confirmar tu cupo.</small></div>
          </div>
          <div className="vip-body">
            <span className="eyebrow">Oferta única · solo en esta página</span>
            <h2>Vive el evento como <span className="accent ital">VIP</span></h2>
            <p className="vsub">Antes de irte: lleva tu experiencia al siguiente nivel por una sola vez.</p>
            <ul className="vip-feats">
              <li><span className="ic">🪑</span><div><b>Asiento en primera fila</b><small>La mejor ubicación de la sala, reservada para ti.</small></div></li>
              <li><span className="ic">🙋</span><div><b>Sesión de Q&A al final</b><small>Haz tus preguntas directamente a Jonathan.</small></div></li>
              <li><span className="ic">📒</span><div><b>Workbook del evento</b><small>Tu guía para aplicar todo lo aprendido paso a paso.</small></div></li>
              <li><span className="ic">🎁</span><div><b>Plan financiero de regalo</b><small>Una planificación financiera personalizada después del evento.</small></div></li>
            </ul>
            <div className="vip-price">
              <div className="amt"><sup>$</sup>20 <span style={{ fontSize: '1.1rem', color: 'var(--ink-soft)', fontWeight: 500 }}>AUD</span></div>
              <small>Pago único · upgrade a VIP</small>
            </div>
            <div className="vip-actions">
              <a href={STRIPE_VIP_URL} className="btn btn-emerald btn-block" onClick={handleVipCheckoutClick}>Sí, quiero ser VIP por $20 AUD →</a>
              <a href={STRIPE_GENERAL_URL} className="vip-skip" onClick={handleGeneralCheckoutClick}>No gracias, asistiré con mi entrada estándar ($10 AUD)</a>
            </div>
            <p className="vip-guar">Pago seguro con Stripe · Confirmación inmediata por correo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Evento;
