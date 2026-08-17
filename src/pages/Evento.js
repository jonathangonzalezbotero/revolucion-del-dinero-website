import { useEffect, useRef, useState } from 'react';
import './Evento.css';
import Comunidad from '../assets/images/Comunidad.webp';
import Logo from '../assets/images/logo.webp';
import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import Seo from '../components/Seo';
import { EVENTO_TITLE, EVENTO_DESCRIPTION, EVENTO_JSON_LD } from '../seoData';

const LOGO_URL = Logo;

const EXIT_POPUP_SESSION_KEY = 'rdd_evento_exit_popup_shown';

// Mobile has no mouseleave, so we approximate exit-intent with a deliberate "swipe back
// to the top" gesture — the kind of fast, sustained flick someone does to reach the
// address bar / close the tab, not the short back-and-forth of re-reading content.
const MOBILE_EXIT_MIN_START_Y = 500; // must start well down the page
const MOBILE_EXIT_MIN_DISTANCE = 400; // must cover a large distance...
const MOBILE_EXIT_MIN_DURATION_MS = 150; // ...but not too slowly...
const MOBILE_EXIT_MAX_DURATION_MS = 900; // ...(fast flick, not a slow scroll)
const MOBILE_EXIT_TOP_THRESHOLD = 120; // ...and land back near the very top

function Evento() {
  const [showVip, setShowVip] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // 'general' | 'vip' | null
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const formRef = useRef(null);
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const telRef = useRef(null);
  const regWrapRef = useRef(null);

  const exitFormRef = useRef(null);
  const exitNombreRef = useRef(null);
  const exitEmailRef = useRef(null);
  const exitTelRef = useRef(null);

  const hasRegisteredRef = useRef(false);
  const scrolledPastFormRef = useRef(false);
  const exitPopupTriggeredRef = useRef(false);

  useRevealOnScroll();

  useEffect(() => {
    document.body.style.overflow = (showVip || showExitPopup) ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showVip, showExitPopup]);

  useEffect(() => {
    window.fbq?.('track', 'ViewContent', { value: 10, currency: 'AUD', content_name: 'Evento Gold Coast' });
  }, []);

  // Returning here from a completed Stripe Checkout Session. The systeme.io contact was
  // already created by the stripe-webhook — this just confirms the purchase to the visitor
  // and fires the ads Purchase event (only the CRM sync is payment-gated, not this pixel).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;
    const tier = params.get('tier') === 'vip' ? 'vip' : 'general';
    window.fbq?.('track', 'Purchase', {
      value: tier === 'vip' ? 20 : 10,
      currency: 'AUD',
      content_name: tier === 'vip' ? 'Entrada VIP' : 'Entrada General',
    });
    setPaymentConfirmed(true);
    window.history.replaceState({}, '', '/evento');
  }, []);

  // Track whether the visitor already scrolled past the hero form, so the exit
  // popup never interrupts someone who hasn't even seen the offer yet.
  useEffect(() => {
    const handleScroll = () => {
      if (scrolledPastFormRef.current || !regWrapRef.current) return;
      const rect = regWrapRef.current.getBoundingClientRect();
      if (rect.bottom < 0) scrolledPastFormRef.current = true;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerExitPopup = () => {
    if (hasRegisteredRef.current || exitPopupTriggeredRef.current) return;
    if (!scrolledPastFormRef.current) return;
    if (sessionStorage.getItem(EXIT_POPUP_SESSION_KEY)) return;
    exitPopupTriggeredRef.current = true;
    sessionStorage.setItem(EXIT_POPUP_SESSION_KEY, '1');
    setShowExitPopup(true);
  };

  // Desktop: fires when the cursor leaves through the top of the viewport
  // (heading for the tab bar / address bar / close button).
  useEffect(() => {
    const handleMouseOut = (e) => {
      if (e.relatedTarget || e.toElement) return;
      if (e.clientY > 0) return;
      triggerExitPopup();
    };
    document.addEventListener('mouseout', handleMouseOut);
    return () => document.removeEventListener('mouseout', handleMouseOut);
  }, []);

  // Mobile fallback: mouseleave doesn't exist there, so treat a deliberate fast
  // swipe back to the top of the page (not casual re-reading) as the equivalent signal.
  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = performance.now();
    let raf = null;
    let streakActive = false;
    let streakStartY = 0;
    let streakStartT = 0;

    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY;
        const t = performance.now();
        const dy = lastY - y; // positive = scrolling up

        if (dy > 2) {
          if (!streakActive) {
            streakActive = true;
            streakStartY = lastY;
            streakStartT = lastT;
          }
          const distance = streakStartY - y;
          const duration = t - streakStartT;
          if (
            streakStartY >= MOBILE_EXIT_MIN_START_Y &&
            distance >= MOBILE_EXIT_MIN_DISTANCE &&
            duration >= MOBILE_EXIT_MIN_DURATION_MS &&
            duration <= MOBILE_EXIT_MAX_DURATION_MS &&
            y <= MOBILE_EXIT_TOP_THRESHOLD
          ) {
            triggerExitPopup();
          }
        } else if (dy < -2) {
          streakActive = false;
        }

        lastY = y;
        lastT = t;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (raf) cancelAnimationFrame(raf);
    };
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
    // No CRM write here — the systeme.io contact is only created once Stripe confirms
    // payment (see api/stripe-webhook.js). This just captures ad-attribution intent.
    window.fbq?.('track', 'Lead');
    hasRegisteredRef.current = true;
    setCheckoutError('');
    setShowVip(true);
  };

  const handleExitSubmit = (e) => {
    e.preventDefault();
    const nombre = exitNombreRef.current.value.trim();
    const email = exitEmailRef.current.value.trim();
    const tel = exitTelRef.current.value.trim();
    if (!nombre || !email || !tel) {
      exitFormRef.current.reportValidity();
      return;
    }

    // Mirror into the main form's refs so the VIP upsell and Stripe checkout
    // (which read from these refs) work exactly as if this were the main form.
    nombreRef.current.value = nombre;
    emailRef.current.value = email;
    telRef.current.value = tel;

    window.fbq?.('track', 'Lead');
    hasRegisteredRef.current = true;
    setCheckoutError('');
    setShowExitPopup(false);
    setShowVip(true);
  };

  const startCheckout = async (tier, value) => {
    const nombre = nombreRef.current?.value.trim();
    const email = emailRef.current?.value.trim();
    const tel = telRef.current?.value.trim();
    if (!nombre || !email || !tel) return;

    window.fbq?.('track', 'InitiateCheckout', { value, currency: 'AUD', content_name: tier === 'vip' ? 'Entrada VIP' : 'Entrada General' });

    setCheckoutError('');
    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, tel, tier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago.');
      window.location.href = data.url;
    } catch (err) {
      console.error('create-checkout-session failed', err);
      setCheckoutError('No se pudo iniciar el pago. Intenta de nuevo.');
      setCheckoutLoading(null);
    }
  };

  const handleGeneralCheckoutClick = (e) => {
    e.preventDefault();
    startCheckout('general', 10);
  };
  const handleVipCheckoutClick = (e) => {
    e.preventDefault();
    startCheckout('vip', 20);
  };

  const handleScrollToForm = (e) => {
    e.preventDefault();
    regWrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nombreRef.current.focus({ preventScroll: true });
  };

  return (
    <div className="page-evento">
      <Seo title={EVENTO_TITLE} description={EVENTO_DESCRIPTION} path="/evento" jsonLd={EVENTO_JSON_LD} />

      {paymentConfirmed ? (
        <div className="ann" style={{ background: '#1f8a4c', color: '#fff' }}>✅ ¡Pago confirmado! Gracias por ayudar a Colombia. Revisa tu correo para los detalles del evento.</div>
      ) : (
        <div className="ann">❤️ 100% de tu entrada se dona al terremoto en Colombia · <b>$10 AUD</b> · 12 de septiembre 2026 · cupos limitados</div>
      )}

      {/* HERO + FORM */}
      <section className="evt-hero">
        <div className="evt-hero-bg">
          <video src="/videos/hero-bg.mp4" poster="/videos/hero-bg-poster.webp" autoPlay muted loop playsInline />
        </div>
        <div className="wrap evt-hero-grid">
          <div className="hero-copy">
            <span className="badge-price">❤️ 100% de tu entrada donado a Colombia</span>
            <h1>Tu primer paso hacia la <span className="ital">libertad financiera.</span></h1>
            <p className="lead">Un evento presencial de finanzas personales donde aprenderás a reprogramar tu mente, administrar tu dinero y dar tus primeros pasos para invertir. Y esta vez, tu entrada hace algo más: el 100% de lo recaudado se dona a las familias afectadas por el terremoto que sacudió a Colombia el 10 de agosto de 2026.</p>
            <div className="meta-row">
              <div className="meta-chip"><div className="meta-chip-head"><span className="ic">📅</span><small>Fecha</small></div><b>Sáb 12 de sept.</b></div>
              <div className="meta-chip"><div className="meta-chip-head"><span className="ic">📍</span><small>Lugar</small></div><b>Gold Coast, AU</b></div>
              <div className="meta-chip meta-chip-price"><div className="meta-chip-head"><span className="ic">🎟️</span><small>Entrada</small></div><b>$10 AUD</b></div>
            </div>
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
                <p className="fsub">Completa tus datos y reserva tu lugar en segundos. El 100% de tu entrada se dona a las víctimas del terremoto en Colombia.</p>
              </div>
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <div className="field"><label htmlFor="nombre">Nombre completo</label><input id="nombre" name="nombre" type="text" placeholder="Tu nombre y apellido" ref={nombreRef} required /></div>
                <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" ref={emailRef} required /></div>
                <div className="field"><label htmlFor="tel">Teléfono</label><input id="tel" name="tel" type="tel" placeholder="+61 ..." ref={telRef} required /></div>

                <button type="submit" className="btn btn-gold btn-block">Asegurar mi cupo · $10 AUD →</button>
                <p className="fine">Te enviaremos los detalles del evento por correo y SMS.</p>
                <div className="trust-mini"><span>✓ Pago seguro</span><span>✓ 100% donado a Colombia</span><span>✓ Cupos limitados</span></div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CAUSE / DONATION */}
      <section className="evt-sec" id="causa">
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Por qué este evento es diferente</span>
            <h2>Tu entrada se convierte en <span className="accent ital">ayuda real</span> para Colombia.</h2>
          </div>
          <p style={{ maxWidth: 700, margin: '0 auto 18px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.65 }}>
            El 10 de agosto de 2026, un terremoto de magnitud 7.4 sacudió el Chocó y se sintió en gran parte del país. Dejó más de <b>294 personas fallecidas</b>, casi <b>4,000 heridos</b> y a miles de familias sin hogar en 12 departamentos.
          </p>
          <p style={{ maxWidth: 700, margin: '0 auto 28px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.65 }}>
            Por eso decidimos donar el <b>100% de lo recaudado en este evento</b> — cada entrada, sin descontar ningún gasto — a los esfuerzos de ayuda para las familias afectadas. Al registrarte no solo das tu primer paso hacia la libertad financiera: le das una mano real a alguien que hoy lo perdió todo.
          </p>
          <div className="learn">
            <div className="lcard"><div className="ic">💔</div><h3>294+ vidas perdidas</h3><p>El sismo más mortal que ha sufrido Colombia en más de dos décadas.</p></div>
            <div className="lcard"><div className="ic">🏥</div><h3>3,937+ heridos</h3><p>Miles de personas atendidas en hospitales y centros de salud dañados.</p></div>
            <div className="lcard"><div className="ic">🏚️</div><h3>12 departamentos afectados</h3><p>Más de 81,500 viviendas dañadas y 14,000 destruidas por completo.</p></div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '.85rem', color: 'var(--ink-soft)', marginTop: 24 }}>Compartiremos el comprobante de la donación después del evento, con total transparencia.</p>
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
            <div className="lcard"><div className="ic">🧠</div><h3>Reprograma tu mente</h3><p>Identificarás exactamente qué creencias te están costando dinero hoy y cómo cambiarlas.</p></div>
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
            <details className="evt-qa"><summary>¿Cuánto cuesta asistir? <span className="pl">+</span></summary><div className="ans">La entrada tiene un valor de <b>$10 AUD</b> por persona, y el 100% se dona a las víctimas del terremoto en Colombia.</div></details>
            <details className="evt-qa"><summary>¿A dónde va el dinero de mi entrada? <span className="pl">+</span></summary><div className="ans">El <b>100% de lo recaudado</b> en este evento, sin descontar ningún gasto, se destina a apoyar a las familias afectadas por el terremoto que sacudió a Colombia el 10 de agosto de 2026. Compartiremos el comprobante de la donación después del evento.</div></details>
            <details className="evt-qa"><summary>¿Qué voy a aprender allí? <span className="pl">+</span></summary><div className="ans">Aprenderás a reprogramar tu mente para mejorar tu relación con el dinero, a administrarlo de manera óptima y a aplicar los primeros pasos para lograr tranquilidad financiera.</div></details>
            <details className="evt-qa"><summary>No soy bueno con el dinero, ¿vale la pena? <span className="pl">+</span></summary><div className="ans">Justamente saldrás con las herramientas y la información necesarias para que eso deje de ser un problema en tu vida. Te guiaré paso a paso.</div></details>
            <details className="evt-qa"><summary>¿Puedo asistir con mi pareja o un amigo? <span className="pl">+</span></summary><div className="ans">¡Claro! Cada persona que asista debe registrarse y adquirir su propia entrada de $10 AUD.</div></details>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap inner">
          <span className="eyebrow" style={{ justifyContent: 'center', color: '#f4c56a' }}>Cupos limitados</span>
          <h2 style={{ marginTop: 16 }}>Tu lugar en Gold Coast <span style={{ color: '#f4c56a', fontStyle: 'italic' }}>te está esperando.</span></h2>
          <p>Regístrate hoy por $10 AUD — el 100% se dona a las víctimas del terremoto en Colombia — y da el primer paso hacia la libertad financiera que viniste a buscar.</p>
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
              <small>Pago único · upgrade a VIP · 100% donado a Colombia</small>
            </div>
            {checkoutError && <p className="fine" style={{ color: '#e5484d' }}>{checkoutError}</p>}
            <div className="vip-actions">
              <button type="button" className="btn btn-emerald btn-block" onClick={handleVipCheckoutClick} disabled={checkoutLoading !== null}>
                {checkoutLoading === 'vip' ? 'Redirigiendo a pago…' : 'Sí, quiero ser VIP por $20 AUD →'}
              </button>
              <button type="button" className="vip-skip" onClick={handleGeneralCheckoutClick} disabled={checkoutLoading !== null}>
                {checkoutLoading === 'general' ? 'Redirigiendo a pago…' : 'No gracias, asistiré con mi entrada estándar ($10 AUD)'}
              </button>
            </div>
            <p className="vip-guar">Pago seguro con Stripe · Confirmación inmediata por correo</p>
          </div>
        </div>
      </div>

      {/* EXIT-INTENT RESCUE POPUP */}
      <div className={`exit-overlay${showExitPopup ? ' show' : ''}`}>
        <div className="exit-modal">
          <button type="button" className="exit-close" aria-label="Cerrar" onClick={() => setShowExitPopup(false)}>✕</button>
          <span className="badge-price exit-badge">✦ Espera un momento</span>
          <h2>¿Ya aseguraste tu cupo?</h2>
          <p className="vsub">Los cupos son limitados y el 100% de tu entrada se dona a las víctimas del terremoto en Colombia. Regístrate en segundos antes de irte.</p>
          <form ref={exitFormRef} onSubmit={handleExitSubmit} noValidate>
            <div className="field"><label htmlFor="exitNombre">Nombre completo</label><input id="exitNombre" name="exitNombre" type="text" placeholder="Tu nombre y apellido" ref={exitNombreRef} required /></div>
            <div className="field"><label htmlFor="exitEmail">Correo electrónico</label><input id="exitEmail" name="exitEmail" type="email" placeholder="tucorreo@ejemplo.com" ref={exitEmailRef} required /></div>
            <div className="field"><label htmlFor="exitTel">Teléfono</label><input id="exitTel" name="exitTel" type="tel" placeholder="+61 ..." ref={exitTelRef} required /></div>
            <button type="submit" className="btn btn-gold btn-block">Asegurar mi cupo · $10 AUD →</button>
          </form>
          <button type="button" className="exit-later" onClick={() => setShowExitPopup(false)}>No gracias, seguiré navegando</button>
        </div>
      </div>
    </div>
  );
}

export default Evento;
