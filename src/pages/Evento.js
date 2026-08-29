import { useEffect, useRef, useState } from 'react';
import './Evento.css';
import Logo from '../assets/images/logo.webp';
import FotoWorkbook from '../assets/images/_MG_0188.webp';
import FotoPareja from '../assets/images/IMG_0297.webp';
import FotoSala from '../assets/images/IMG_0293.webp';
import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import Seo from '../components/Seo';
import { EVENTO_TITLE, EVENTO_DESCRIPTION, EVENTO_JSON_LD } from '../seoData';

const LOGO_URL = Logo;

const EXIT_POPUP_SESSION_KEY = 'rdd_evento_exit_popup_shown';

// Doors open 14:30, the room starts 15:00 AEST. Urgency on this page is driven by the
// date, never by a seat count: the venue holds 120 and the decision on record is not to
// cap the room in the copy — we need volume, not artificial scarcity.
const EVENT_START = new Date('2026-09-12T15:00:00+10:00');

function daysUntilEvent() {
  const ms = EVENT_START.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

// Mobile has no mouseleave, so we approximate exit-intent with a deliberate "swipe back
// to the top" gesture — the kind of fast, sustained flick someone does to reach the
// address bar / close the tab, not the short back-and-forth of re-reading content.
const MOBILE_EXIT_MIN_START_Y = 500; // must start well down the page
const MOBILE_EXIT_MIN_DISTANCE = 400; // must cover a large distance...
const MOBILE_EXIT_MIN_DURATION_MS = 150; // ...but not too slowly...
const MOBILE_EXIT_MAX_DURATION_MS = 900; // ...(fast flick, not a slow scroll)
const MOBILE_EXIT_TOP_THRESHOLD = 120; // ...and land back near the very top

// Pushes the registration into systeme.io (tagged as "hasn't paid yet") the moment the form
// is submitted, so people who register and never reach checkout are still reachable in the
// CRM. Deliberately not awaited and never surfaced to the user: the CRM write must not delay
// the VIP modal or the Stripe redirect, and a CRM outage must not stop anyone from paying.
// `keepalive` lets the request finish even if the visitor navigates to Stripe right away.
function sendLeadToCrm(payload) {
  fetch('/api/evento-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err) => {
    console.error('evento-lead failed', err);
  });
}

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
  const amigoNombreRef = useRef(null);
  const amigoTelRef = useRef(null);
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
    window.fbq?.('track', 'ViewContent', { content_name: 'Evento Gold Coast' });
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
    sendLeadToCrm({
      nombre,
      email,
      tel,
      amigoNombre: amigoNombreRef.current?.value.trim() || '',
      amigoTel: amigoTelRef.current?.value.trim() || '',
    });

    if (!hasRegisteredRef.current) window.fbq?.('track', 'Lead');
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
    amigoNombreRef.current.value = '';
    amigoTelRef.current.value = '';

    sendLeadToCrm({ nombre, email, tel, amigoNombre: '', amigoTel: '' });

    if (!hasRegisteredRef.current) window.fbq?.('track', 'Lead');
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
      const amigoNombre = amigoNombreRef.current?.value.trim() || '';
      const amigoTel = amigoTelRef.current?.value.trim() || '';
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, tel, amigoNombre, amigoTel, tier }),
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

  const diasRestantes = daysUntilEvent();
  const cuentaRegresiva = diasRestantes === 0
    ? 'Es hoy'
    : diasRestantes === 1
      ? 'Falta 1 día'
      : `Faltan ${diasRestantes} días`;

  return (
    <div className="page-evento">
      <Seo title={EVENTO_TITLE} description={EVENTO_DESCRIPTION} path="/evento" jsonLd={EVENTO_JSON_LD} />

      {paymentConfirmed ? (
        <div className="ann" style={{ background: '#1f8a4c', color: '#fff' }}>✅ ¡Pago confirmado! Gracias por ayudar a Colombia. Revisa tu correo para los detalles del evento.</div>
      ) : (
        <div className="ann">Sábado 12 de septiembre · Robina, Gold Coast · <b>$10 AUD</b> y todo se va para Colombia · {cuentaRegresiva}</div>
      )}

      {/* HERO + FORM */}
      <section className="evt-hero">
        <div className="evt-hero-bg">
          <video src="/videos/hero-bg.mp4" poster="/videos/hero-bg-poster.webp" autoPlay muted loop playsInline />
        </div>
        <div className="wrap evt-hero-grid">
          <div className="hero-copy">
            <span className="badge-price">❤️ Lo que se recaude se va completo para Colombia</span>
            <h1>Tu primer paso hacia la <span className="ital">libertad financiera.</span></h1>
            <p className="lead">Una tarde en Gold Coast para sentarte a mirar tu plata de frente: de dónde viene, en qué se te va, y qué vas a hacer distinto a partir del lunes. La entrada cuesta $10 y esa plata no se queda conmigo. Se va para las familias que perdieron todo en el terremoto de Colombia.</p>
            <div className="meta-row">
              <div className="meta-chip"><div className="meta-chip-head"><span className="ic">📅</span><small>Fecha</small></div><b>Sáb 12 de sept.</b></div>
              <div className="meta-chip"><div className="meta-chip-head"><span className="ic">🕒</span><small>Hora</small></div><b>3:00 a 6:30 pm</b></div>
              <div className="meta-chip meta-chip-wide"><div className="meta-chip-head"><span className="ic">📍</span><small>Lugar</small></div><b>Robina Events Centre, Gold Coast</b></div>
              <div className="meta-chip meta-chip-price"><div className="meta-chip-head"><span className="ic">🎟️</span><small>Entrada</small></div><b>$10 AUD</b></div>
            </div>
            <div className="plus-one"><span className="ic">👥</span><b>Tu entrada incluye a alguien más.</b> Tu pareja, un amigo, tu hermano. No paga extra.</div>
            <div className="hero-img">
              <img src="/assets/comunidad-og.jpg" alt="Grupo de asistentes al primer evento de Revolución del Dinero en Gold Coast" />
              <div className="ov">+50 personas en el primer evento</div>
            </div>
            <div className="scarce"><span className="dot"></span> {cuentaRegresiva} para el sábado 12. Una sola tarde, y no la repetimos este año.</div>
          </div>

          <div className="formcard-sticky" id="regWrap" ref={regWrapRef}>
            <div className="formcard">
              <div className="fhead">
                <h3>Aparta tu cupo por $10 AUD</h3>
                <p className="fsub">Llena tus datos y listo. Te llegan al correo la dirección exacta y cómo llegar.</p>
              </div>
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <div className="field"><label htmlFor="nombre">Nombre completo</label><input id="nombre" name="nombre" type="text" placeholder="Tu nombre y apellido" ref={nombreRef} required /></div>
                <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" ref={emailRef} required /></div>
                <div className="field"><label htmlFor="tel">Teléfono</label><input id="tel" name="tel" type="tel" placeholder="+61 ..." ref={telRef} required /></div>

                <div className="field-divider">✦ ¿Vienes con alguien? <span>Va incluido, no paga extra</span></div>
                <div className="field"><label htmlFor="amigoNombre">Nombre de tu pareja/amigo/familiar</label><input id="amigoNombre" name="amigoNombre" type="text" placeholder="Nombre y apellido (opcional)" ref={amigoNombreRef} /></div>
                <div className="field"><label htmlFor="amigoTel">Teléfono de tu pareja/amigo/familiar</label><input id="amigoTel" name="amigoTel" type="tel" placeholder="+61 ... (opcional)" ref={amigoTelRef} /></div>

                <button type="submit" className="btn btn-gold btn-block">Apartar mi cupo · $10 AUD →</button>
                <p className="fine">Te mandamos los detalles del evento por correo y SMS.</p>
                <div className="trust-mini"><span>✓ Pago seguro</span><span>✓ Incluye a tu +1</span><span>✓ Todo va para Colombia</span></div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN / QUALIFICATION */}
      <section className="evt-sec" id="para-ti">
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Hablemos claro</span>
            <h2>Si algo de esto te suena, ven.</h2>
          </div>
          <div className="list2">
            <div className="li"><span className="ck">✓</span><p>Trabajas <b>50 o 60 horas</b> a la semana y al final del mes no sabes bien en qué se fue la plata.</p></div>
            <div className="li"><span className="ck">✓</span><p>Le mandas plata a tu familia todos los meses y <b>sientes culpa</b> el mes que no puedes.</p></div>
            <div className="li"><span className="ck">✓</span><p>Quieres invertir, pero cada vez que te pones a leer del tema <b>te da miedo o te da pereza</b>.</p></div>
            <div className="li"><span className="ck">✓</span><p>Creciste oyendo que <b>no eres bueno con los números</b> y te lo terminaste creyendo.</p></div>
            <div className="li"><span className="ck">✓</span><p>Te dijeron que acá <b>todo está tan caro</b> que ahorrar es imposible, y ya ni lo intentas.</p></div>
            <div className="li"><span className="ck">✓</span><p>Quieres <b>casa propia</b>, acá o en tu país, pero no tienes idea por dónde se empieza.</p></div>
          </div>
          <p className="pain-close">
            Ninguna de esas frases nació contigo. Te las pasaron. Y mientras sigan ahí adentro
            sin que las mires de frente, van a seguir decidiendo por ti.
          </p>
        </div>
      </section>

      {/* AGENDA */}
      <section className="evt-sec" id="agenda" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>El sábado, hora por hora</span>
            <h2>Qué pasa entre las 3:00 y las 6:30.</h2>
            <p>No es una charla motivacional. Es un taller. Vas a escribir, vas a sacar cuentas con tus propios números, y te vas de ahí con eso ya hecho.</p>
          </div>

          <div className="agenda-grid">
            <div className="agenda">
              <div className="ag-row">
                <div className="ag-time">2:30 pm</div>
                <div className="ag-body">
                  <h3>Puertas abiertas y registro</h3>
                  <p>Llegas, te registras, saludas a la gente. A las 3:00 arrancamos puntual.</p>
                </div>
              </div>

              <div className="ag-row">
                <div className="ag-time"><span className="ag-pill">Pilar 1</span></div>
                <div className="ag-body">
                  <h3>Creencias limitantes</h3>
                  <p>Vas a calificar de 1 a 10 las frases sobre el dinero con las que creciste. Identidad, escasez, miedo y resignación. Ahí se ve, escrito, qué te está frenando.</p>
                </div>
              </div>

              <div className="ag-row">
                <div className="ag-time"><span className="ag-pill">Pilar 2</span></div>
                <div className="ag-body">
                  <h3>Qué es libertad financiera (de verdad)</h3>
                  <p>La fórmula. Ingresos lineales, residuales y pasivos, y por qué el número al que le tienes que apuntar no es el mismo que el mío.</p>
                </div>
              </div>

              <div className="ag-row">
                <div className="ag-time"><span className="ag-pill">Pilar 3</span></div>
                <div className="ag-body">
                  <h3>Administrar mi dinero</h3>
                  <p>Armas tu plan de gastos mensuales ahí mismo: necesidades, ahorro, inversión, fondo de emergencia, educación, donación. Y el porcentaje que puedes gastarte libre de culpa, que también va en el plan.</p>
                </div>
              </div>

              <div className="ag-row">
                <div className="ag-time"><span className="ag-pill">Pilar 4</span></div>
                <div className="ag-body">
                  <h3>Tranquilidad financiera</h3>
                  <p>Los pasos concretos para empezar a ahorrar sin sufrirlo, y cómo se construye un fondo de emergencia desde cero.</p>
                </div>
              </div>

              <div className="ag-row">
                <div className="ag-time">6:30 pm</div>
                <div className="ag-body">
                  <h3>Cierre</h3>
                  <p>Te vas con tu plan escrito de tu puño y letra.</p>
                </div>
              </div>

              <div className="ag-row">
                <div className="ag-time"><span className="ag-pill">Q&A</span></div>
                <div className="ag-body">
                  <h3>Preguntas y respuestas</h3>
                  <p>Espacio reservado para los VIPs.</p>
                </div>
              </div>
            </div>

            <aside className="agenda-side">
              <figure className="ag-photo">
                <img src={FotoWorkbook} alt="Asistente trabajando en el workbook durante el evento" loading="lazy" />
                <figcaption>El workbook con el que vas a trabajar toda la tarde.</figcaption>
              </figure>
              <div className="ag-note">
                <b>Dos cosas prácticas</b>
                <p>No hay comida incluida, así que come algo antes o trae tu snack. Y el workbook impreso va con la entrada VIP.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="ctaband">
        <div className="wrap ctaband-inner">
          <div>
            <h3>Son $10 y ya sabes exactamente qué vas a hacer con esas tres horas y media.</h3>
            <p>Incluye a tu acompañante. {cuentaRegresiva}.</p>
          </div>
          <a href="#regWrap" className="btn btn-gold btn-lg" onClick={handleScrollToForm}>Apartar mi cupo · $10 AUD →</a>
        </div>
      </section>

      {/* RESULTS */}
      <section className="evt-sec" id="resultados">
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Con qué te vas</span>
            <h2>Cuatro cosas que el dia siguiente ya vas a tener.</h2>
          </div>
          <div className="results">
            <div className="res-item">
              <span className="res-num">01</span>
              <div>
                <h3>Vas a entender por qué haces lo que haces con la plata</h3>
                <p>Todos cargamos un manual que nadie escribió: lo que viste en tu casa, lo que oíste de chiquito, lo que te dijeron cuando llegaste acá. El primer bloque es sentarte a leerlo.</p>
              </div>
            </div>
            <div className="res-item">
              <span className="res-num">02</span>
              <div>
                <h3>Vas a tener un número, no una sensación</h3>
                <p>Libertad financiera no es «ser rico». Es una cuenta: cuánto necesitas al mes para que tus gastos estén cubiertos sin que tengas que trabajar. Sales con ese número calculado, el tuyo.</p>
              </div>
            </div>
            <div className="res-item">
              <span className="res-num">03</span>
              <div>
                <h3>Vas a salir con tu plata ya repartida</h3>
                <p>Qué porcentaje va a necesidades, cuánto a ahorro, cuánto a inversión, cuánto al fondo de emergencia. Y cuánto puedes gastarte sin sentir culpa, que eso también entra en el plan.</p>
              </div>
            </div>
            <div className="res-item">
              <span className="res-num">04</span>
              <div>
                <h3>Vas a saber cuál es tu siguiente paso</h3>
                <p>Uno. Concreto. Para hacerlo esta semana. No una lista de veinte cosas que nunca vas a empezar.</p>
              </div>
            </div>
          </div>
          <figure className="res-photo reveal">
            <img src={FotoSala} alt="Asistentes de pie celebrando al final del primer evento" loading="lazy" />
          </figure>
        </div>
      </section>

      {/* CAUSE / DONATION */}
      <section className="evt-sec" id="causa" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Por qué cobramos $10</span>
            <h2>Esos $10 <span className="accent ital">no son míos.</span></h2>
          </div>
          <div className="causa-copy">
            <p>
              El 10 de agosto de 2026 un terremoto de magnitud 7.4 sacudió el Chocó y se sintió en medio país.
              Murieron más de 294 personas, casi 4.000 quedaron heridas y miles de familias se quedaron sin casa.
            </p>
            <p>
              Casi todos los que vamos a estar en esa sala tenemos gente allá. Por eso todo lo que entre por
              las entradas se va para las familias afectadas, sin descontar nada. Yo pongo el salón, el material
              y la tarde.
            </p>
            <p>
              A qué organización va exactamente lo definimos ese mismo día, con la gente que esté ahí. Prefiero
              decidirlo con la sala y no prometerte hoy un nombre que todavía no tengo.
            </p>
          </div>
          <div className="learn">
            <div className="lcard"><div className="ic">💔</div><h3>294+ vidas perdidas</h3><p>El sismo más mortal que ha sufrido Colombia en más de dos décadas.</p></div>
            <div className="lcard"><div className="ic">🏥</div><h3>3.937+ heridos</h3><p>Miles de personas atendidas en hospitales y centros de salud que también quedaron dañados.</p></div>
            <div className="lcard"><div className="ic">🏚️</div><h3>12 departamentos afectados</h3><p>Más de 81.500 viviendas dañadas y 14.000 destruidas por completo.</p></div>
          </div>
        </div>
      </section>

      <AboutSection id="anfitrion" />

      <TestimonialsSection id="testimonios" />

      {/* CTA BAND */}
      <section className="ctaband ctaband-alt">
        <div className="wrap ctaband-inner">
          <div>
            <h3>El sábado 12 a las 3:00 de la tarde, en Robina.</h3>
            <p>$10, incluye a tu acompañante, y todo se va para Colombia.</p>
          </div>
          <a href="#regWrap" className="btn btn-gold btn-lg" onClick={handleScrollToForm}>Apartar mi cupo · $10 AUD →</a>
        </div>
      </section>

      {/* PLUS ONE */}
      <section className="evt-sec" id="acompanante">
        <div className="wrap plusone-grid">
          <figure className="plusone-photo reveal">
            <img src={FotoPareja} alt="Una pareja llenando juntos el plan de gastos mensuales en el evento" loading="lazy" />
          </figure>
          <div className="plusone-body reveal">
            <span className="eyebrow">Trae a alguien</span>
            <h2>Esto se sostiene mejor de a dos.</h2>
            <p>
              La conversación de la plata en pareja es de las más incómodas que hay. En familia, peor.
              Uno quiere ahorrar, el otro quiere disfrutar, y nadie se sienta a hablarlo con números al frente.
            </p>
            <p>
              Por eso tu entrada incluye a una persona más sin costo. Tu pareja, un amigo, tu hermano, tu mamá.
              Se sientan los dos, hacen el ejercicio los dos, y salen con el mismo plan. Eso vale más que
              cualquier cosa que yo diga desde el escenario.
            </p>
            <p className="plusone-fine">Para incluirlo solo agregas su nombre y teléfono en el formulario de registro.</p>
          </div>
        </div>
      </section>

      {/* TICKETS */}
      <section className="evt-sec" id="entradas" style={{ background: 'var(--sand)' }}>
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Las dos entradas</span>
            <h2>Cuál te sirve más.</h2>
            <p>Las dos admiten dos personas. Eliges cuál quieres justo después de dejar tus datos.</p>
          </div>
          <div className="tickets">
            <div className="tk">
              <div className="tk-head">
                <span className="tk-name">General</span>
                <div className="tk-price"><sup>$</sup>10 <em>AUD</em></div>
              </div>
              <ul className="tk-list">
                <li>Entrada para <b>dos personas</b></li>
                <li>Las tres horas y media completas del taller</li>
                <li>Los cuatro pilares y todos los ejercicios</li>
              </ul>
              <a href="#regWrap" className="btn btn-outline btn-block" onClick={handleScrollToForm}>Ir al registro</a>
            </div>

            <div className="tk tk-vip">
              <span className="tk-flag">La que más se lleva la gente</span>
              <div className="tk-head">
                <span className="tk-name">VIP</span>
                <div className="tk-price"><sup>$</sup>20 <em>AUD</em></div>
              </div>
              <ul className="tk-list">
                <li>Todo lo de la general, para <b>dos personas</b></li>
                <li><b>El workbook impreso</b> para llevártelo a casa</li>
                <li><b>Asiento preferencial</b> al frente</li>
                <li><b>Sesión de preguntas</b> conmigo al terminar</li>
              </ul>
              <a href="#regWrap" className="btn btn-emerald btn-block" onClick={handleScrollToForm}>Ir al registro</a>
              <p className="tk-fine">De las últimas 12 entradas, 7 fueron VIP.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="evt-sec" id="faq" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="evt-sec-head">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Lo que más me preguntan</span>
            <h2>Antes de que escribas para preguntar.</h2>
          </div>
          <div className="evt-faq">
            <details className="evt-qa"><summary>¿A qué hora es y cuánto dura? <span className="pl">+</span></summary><div className="ans">Las puertas abren a las <b>2:30 pm</b> para el registro y arrancamos <b>puntual a las 3:00</b>. Terminamos a las <b>6:30 pm</b>. Son tres horas y media con dos descansos de 10 a 15 minutos.</div></details>
            <details className="evt-qa"><summary>¿Dónde queda exactamente? <span className="pl">+</span></summary><div className="ans">En el <b>Robina Events Centre</b>, que queda dentro del edificio del <b>TAFE de Robina</b>, en Gold Coast. Apenas te registras te llega al correo la dirección exacta y las instrucciones para llegar.</div></details>
            <details className="evt-qa"><summary>¿Hay parqueadero? <span className="pl">+</span></summary><div className="ans">Sí. El lugar tiene parqueadero y va incluido, no tienes que pagar aparte.</div></details>
            <details className="evt-qa"><summary>¿Qué incluye la entrada de $10? <span className="pl">+</span></summary><div className="ans">Tu entrada, la de <b>un acompañante</b> sin costo extra, y las tres horas y media completas del taller. Si quieres el <b>workbook impreso</b>, asiento en primera fila, sesión de preguntas al final y una planeación financiera personalizada después del evento, eso va en la entrada VIP de $20.</div></details>
            <details className="evt-qa"><summary>¿A dónde va mi plata? <span className="pl">+</span></summary><div className="ans">Todo lo que se recaude en <b>entradas</b>, general y VIP, se va para las familias afectadas por el terremoto del 10 de agosto en Colombia, sin descontar gastos. La organización específica la definimos el día del evento con la gente que esté en la sala. Para que quede claro: lo que se dona son las entradas. Si ese día decides comprar alguno de los programas que presento al final, esa plata sí es del negocio y con ella financio los siguientes eventos.</div></details>
            <details className="evt-qa"><summary>¿Me van a vender algo? <span className="pl">+</span></summary><div className="ans">Sí, y prefiero decírtelo acá y no que te enteres en la silla. Al final de la tarde te presento dos programas para quien quiera seguir trabajando esto conmigo con más profundidad. Son quince minutos al cierre. <b>Si no te interesa, te vas con el taller completo igual</b>: la tarde entera no depende de que compres nada, y los cuatro pilares se dan antes de que yo mencione una sola oferta.</div></details>
            <details className="evt-qa"><summary>¿Hay comida o bebida? <span className="pl">+</span></summary><div className="ans">No hay comida incluida. Hay dos descansos, así que come algo antes de venir o trae tu snack.</div></details>
            <details className="evt-qa"><summary>Compré y al final no puedo ir, ¿me devuelven? <span className="pl">+</span></summary><div className="ans">No devolvemos el dinero, porque esa plata ya está destinada a la donación. Lo que sí puedes hacer es mandar a alguien en tu lugar. Escríbeme y lo cambiamos sin problema.</div></details>
            <details className="evt-qa"><summary>No soy bueno con los números, ¿me va a servir? <span className="pl">+</span></summary><div className="ans">Esa frase está literalmente escrita en el workbook, en la lista de creencias que vamos a revisar en el primer bloque. La mayoría de la gente que llega piensa lo mismo. No hay matemáticas complicadas: sumar, restar y sacar porcentajes.</div></details>
            <details className="evt-qa"><summary>¿Es en español? <span className="pl">+</span></summary><div className="ans">Todo en español, de principio a fin.</div></details>
            <details className="evt-qa"><summary>¿Qué me llevo del evento? <span className="pl">+</span></summary><div className="ans">Tu plan de gastos mensuales armado con tus propios números, tu número de libertad financiera calculado, y el siguiente paso concreto para esta semana. Todo escrito por ti durante la tarde.</div></details>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="trustband">
        <div className="wrap trustband-inner">
          <div className="tb-item"><span className="tb-ic">🔒</span><div><b>Pago seguro con Stripe</b><small>No guardamos datos de tu tarjeta.</small></div></div>
          <div className="tb-item"><span className="tb-ic">✉️</span><div><b>Confirmación inmediata</b><small>Dirección e instrucciones al correo.</small></div></div>
          <div className="tb-item"><span className="tb-ic">👥</span><div><b>Tu entrada admite 2 personas</b><small>General y VIP, las dos incluyen acompañante.</small></div></div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap inner">
          <span className="eyebrow" style={{ justifyContent: 'center', color: '#f4c56a' }}>Sábado 12 de septiembre</span>
          <h2 style={{ marginTop: 16 }}>Nos vemos en Robina <span style={{ color: '#f4c56a', fontStyle: 'italic' }}>a las 3 de la tarde.</span></h2>
          <p>Diez dólares, tu acompañante incluido, y todo lo que se recaude en entradas se va para Colombia. {cuentaRegresiva}.</p>
          <a href="#regWrap" className="btn btn-gold btn-lg" onClick={handleScrollToForm}>Apartar mi cupo · $10 AUD →</a>
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
            <span className="eyebrow">Solo aparece en esta página</span>
            <h2>Vive el evento como <span className="accent ital">VIP</span></h2>
            <p className="vsub">Antes de irte, mira lo que cambia por diez dólares más.</p>
            <ul className="vip-feats">
              <li><span className="ic">🪑</span><div><b>Primera fila</b><small>La mejor ubicación de la sala, reservada a tu nombre.</small></div></li>
              <li><span className="ic">📒</span><div><b>El workbook impreso</b><small>Los cuatro pilares y todos los ejercicios, para llevártelo a casa.</small></div></li>
              <li><span className="ic">🙋</span><div><b>Preguntas al final</b><small>Te quedas conmigo cuando termine y preguntas lo que quieras.</small></div></li>
              <li><span className="ic">🎁</span><div><b>Tu plan financiero personalizado</b><small>Después del evento nos sentamos con tus números.</small></div></li>
            </ul>
            <div className="vip-price">
              <div className="amt"><sup>$</sup>20 <span style={{ fontSize: '1.1rem', color: 'var(--ink-soft)', fontWeight: 500 }}>AUD</span></div>
              <small>Pago único · también se va completo para Colombia</small>
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
            <p className="vip-guar">Pago seguro con Stripe · Confirmación inmediata por correo · Incluye a tu +1</p>
          </div>
        </div>
      </div>

      {/* EXIT-INTENT RESCUE POPUP */}
      <div className={`exit-overlay${showExitPopup ? ' show' : ''}`}>
        <div className="exit-modal">
          <button type="button" className="exit-close" aria-label="Cerrar" onClick={() => setShowExitPopup(false)}>✕</button>
          <span className="badge-price exit-badge">✦ Espera un momento</span>
          <h2>¿Ya apartaste tu cupo?</h2>
          <p className="vsub">{cuentaRegresiva} para el sábado 12. Tu entrada incluye a un acompañante sin costo y todo lo que se recaude en entradas se va para las familias del terremoto en Colombia. Déjame tus datos y quedas adentro.</p>
          <form ref={exitFormRef} onSubmit={handleExitSubmit} noValidate>
            <div className="field"><label htmlFor="exitNombre">Nombre completo</label><input id="exitNombre" name="exitNombre" type="text" placeholder="Tu nombre y apellido" ref={exitNombreRef} required /></div>
            <div className="field"><label htmlFor="exitEmail">Correo electrónico</label><input id="exitEmail" name="exitEmail" type="email" placeholder="tucorreo@ejemplo.com" ref={exitEmailRef} required /></div>
            <div className="field"><label htmlFor="exitTel">Teléfono</label><input id="exitTel" name="exitTel" type="tel" placeholder="+61 ..." ref={exitTelRef} required /></div>
            <button type="submit" className="btn btn-gold btn-block">Apartar mi cupo · $10 AUD →</button>
          </form>
          <button type="button" className="exit-later" onClick={() => setShowExitPopup(false)}>No gracias, seguiré navegando</button>
        </div>
      </div>
    </div>
  );
}

export default Evento;
