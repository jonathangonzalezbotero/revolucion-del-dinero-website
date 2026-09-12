/**
 * BOOTCAMP FINANCIERO — página de venta (/bootcamp)
 * ==================================================
 *
 * Ruta canónica: https://www.revoluciondeldinero.com/bootcamp
 * Página de gracias: /bootcamp/gracias · Términos: /terminos
 *
 * CONTEXTO
 * El código QR impreso que se reparte en el evento del 12 de septiembre lleva acá. La
 * gente la abre en el teléfono, sentada, en menos de dos minutos, mientras Jonathan sigue
 * hablando. Por eso: móvil primero y botón principal visible sin hacer scroll.
 *
 * DISEÑO
 * Calca la composición de /evento: hero de dos columnas con video de fondo y la tarjeta
 * de compra oscura pegada a la derecha, meta-chips, banda dorada con el bono, foto con
 * marco blanco, bandas CTA a sangre entre secciones, "qué te llevas" con numerales
 * dorados, entradas en claro/oscuro, trustband y cierre esmeralda. En móvil el hero se
 * colapsa a una columna y aparece el botón que baja a la tarjeta de compra.
 *
 * La tarjeta de compra es UNA sola en toda la página (en el hero, sticky en escritorio).
 * La sección de entradas de más abajo no duplica el formulario: sus botones eligen la
 * entrada y suben a la tarjeta, así hay un único formulario y un único juego de refs.
 *
 * FLUJO DE COMPRA (el orden no es negociable)
 *   1. POST /api/bootcamp-lead   → crea/actualiza el contacto en systeme.io con el tag
 *                                  `bootcamp-nov-2026`. Fire-and-forget con `keepalive`:
 *                                  si el CRM falla, se registra en consola con el prefijo
 *                                  "bootcamp-lead" y el checkout se abre igual. Nunca se
 *                                  bloquea una venta por el CRM.
 *   2. Píxel de Meta             → evento `Lead`, con email y teléfono en los parámetros.
 *   3. POST /api/create-bootcamp-checkout → crea la Stripe Checkout Session. La metadata
 *                                  usa los mismos nombres de campo que /evento (nombre,
 *                                  tel, tier, amigoNombre, amigoTel) más `oferta`.
 *   4. Píxel de Meta             → evento `InitiateCheckout`.
 *   5. Redirección a Stripe. success_url → /bootcamp/gracias · cancel_url → /bootcamp
 *
 * VARIABLES DE ENTORNO (Vercel → Project → Settings → Environment Variables)
 *   REACT_APP_STRIPE_PRICE_BOOTCAMP_INDIVIDUAL   price ID de AUD 255,00 (anunciado $250)
 *   REACT_APP_STRIPE_PRICE_BOOTCAMP_PAREJA       price ID de AUD 408,00 (anunciado $400)
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SYSTEME_API_KEY  (ya configuradas)
 * Ningún price ID está hardcodeado y no hay fallback: si falta una variable, la página
 * muestra un error en español y no intenta cobrar. El prefijo REACT_APP_ solo controla
 * qué inyecta CRA en el bundle del navegador — Vercel expone la misma variable a la
 * función serverless, que es la autoridad sobre el precio (el navegador manda `tier`,
 * nunca un price ID).
 *
 * DECISIONES DE NEGOCIO QUE ESTE ARCHIVO RESPETA
 *   · No se menciona ningún número de cupos, ni aforo, ni "quedan X plazas".
 *   · No se publica temario: el día se cuenta en tres partes (mañana, mediodía, tarde),
 *     sin horas, sin títulos de módulos y sin duraciones. La especificidad va en "Qué te
 *     llevas".
 *   · La garantía de reembolso NO es argumento de esta página — Jonathan la anuncia desde
 *     el escenario. Vive en /terminos, enlazada solo desde el pie.
 *   · El bono incluido es el curso "Proyección anual financiera" (CURSO_NOMBRE). La
 *     sesión 1:1 de 30 minutos que existía antes se retiró y NO vuelve: ni Calendly, ni
 *     "media hora conmigo", ni fecha límite para agendar.
 *   · Nada de licencias, ASFL/AFSL ni "esto no es asesoría" en esta página. Jonathan lo
 *     aclara en persona. La página vende; los descargos legales viven en /terminos.
 *   · El almuerzo no se menciona. Eso va en los correos.
 *   · El crédito al Círculo no se menciona ni se insinúa.
 */

import { useEffect, useRef, useState } from 'react';
import './Bootcamp.css';
import Logo from '../assets/images/logo.webp';
import FotoSala from '../assets/images/_MG_0156.webp';
import FotoDeclaraciones from '../assets/images/_MG_0234.webp';
import FotoCierre from '../assets/images/IMG_0305.webp';
import FotoJonathan from '../assets/images/Jonathan_03.webp';
import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import Seo from '../components/Seo';
import { BOOTCAMP_TITLE, BOOTCAMP_DESCRIPTION, BOOTCAMP_JSON_LD } from '../seoData';
import {
  FECHA_LARGA,
  FECHA_CORTA,
  HORARIO,
  REGISTRO,
  LUGAR,
  PRECIO_INDIVIDUAL,
  PRECIO_PAREJA,
  COBRO_INDIVIDUAL,
  COBRO_PAREJA,
  PRICE_IDS,
  TIERS,
  CURSO_NOMBRE,
  EFECTIVO_DIA,
} from '../config/bootcamp';

const INDIVIDUAL = 'bootcamp-individual';
const PAREJA = 'bootcamp-pareja';

// Un contacto en systeme.io antes del pago, siempre. Deliberadamente sin `await` y sin
// superficie en la interfaz: la escritura en el CRM no puede retrasar la redirección a
// Stripe, y una caída del CRM no puede impedirle a nadie pagar. `keepalive` deja que la
// petición termine aunque el navegador ya se haya ido a Stripe.
function enviarContactoAlCrm(payload) {
  fetch('/api/bootcamp-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err) => {
    console.error('bootcamp-lead failed', err);
  });
}

function Bootcamp() {
  const [tier, setTier] = useState(INDIVIDUAL);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const formRef = useRef(null);
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const telRef = useRef(null);
  const amigoNombreRef = useRef(null);
  const amigoTelRef = useRef(null);
  const empresaRef = useRef(null);
  const compraRef = useRef(null);
  const abiertoEnRef = useRef(Date.now());
  const leadEnviadoRef = useRef(false);

  // Los testimonios en video y las fotos vienen con la clase .reveal (opacity 0 hasta que
  // entran en pantalla), así que sin este hook quedarían invisibles.
  useRevealOnScroll();

  const seleccionado = TIERS[tier];

  // Si falta el price ID de la entrada elegida no se intenta cobrar con ningún fallback:
  // se muestra un mensaje claro y el botón queda deshabilitado.
  const faltaConfiguracion = !PRICE_IDS[tier];

  useEffect(() => {
    window.fbq?.('track', 'ViewContent', {
      content_name: 'Bootcamp Financiero Noviembre 2026',
      content_category: 'bootcamp',
      currency: 'AUD',
      value: PRECIO_INDIVIDUAL,
    });
  }, []);

  // Sube (o baja) a la tarjeta de compra y deja el cursor en el primer campo. En
  // escritorio la tarjeta ya está a la vista, así que esto es sobre todo para móvil y
  // para los botones de la sección de entradas.
  const irAComprar = (e) => {
    e.preventDefault();
    compraRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nombreRef.current?.focus({ preventScroll: true });
  };

  const elegirTier = (nuevo) => {
    setTier(nuevo);
    setError('');
  };

  // Desde la sección de entradas: elige la entrada y sube a la tarjeta de compra.
  const elegirYComprar = (nuevo) => (e) => {
    elegirTier(nuevo);
    irAComprar(e);
  };

  const comprar = async (e) => {
    e.preventDefault();

    const nombre = nombreRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const tel = telRef.current.value.trim();
    const amigoNombre = amigoNombreRef.current?.value.trim() || '';
    const amigoTel = amigoTelRef.current?.value.trim() || '';

    if (!nombre || !email || !tel) {
      formRef.current.reportValidity();
      return;
    }
    if (tier === PAREJA && (!amigoNombre || !amigoTel)) {
      setError('Para la entrada de dos personas necesitamos el nombre y el teléfono de quien viene contigo.');
      formRef.current.reportValidity();
      return;
    }
    if (faltaConfiguracion) {
      setError('El pago del Bootcamp no está disponible en este momento. Escríbenos y lo resolvemos contigo.');
      return;
    }

    setError('');

    // 1. El contacto se guarda ANTES del pago. Siempre.
    enviarContactoAlCrm({
      nombre,
      email,
      tel,
      amigoNombre,
      amigoTel,
      empresa: empresaRef.current?.value || '',
      startedAt: abiertoEnRef.current,
    });

    // 2. Píxel: Lead, con email y teléfono en los parámetros.
    if (!leadEnviadoRef.current) {
      window.fbq?.('track', 'Lead', {
        em: email.toLowerCase(),
        ph: tel,
        content_name: 'Bootcamp Financiero Noviembre 2026',
        content_category: 'bootcamp',
        currency: 'AUD',
        value: seleccionado.precio,
      });
      leadEnviadoRef.current = true;
    }

    // 3. Stripe Checkout Session.
    setCargando(true);
    try {
      const res = await fetch('/api/create-bootcamp-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, tel, amigoNombre, amigoTel, tier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago.');

      // 4. Píxel: InitiateCheckout, ya con la sesión creada.
      window.fbq?.('track', 'InitiateCheckout', {
        em: email.toLowerCase(),
        ph: tel,
        content_name: seleccionado.nombre,
        content_category: 'bootcamp',
        currency: 'AUD',
        value: seleccionado.cobro,
      });

      // 5. A Stripe.
      window.location.href = data.url;
    } catch (err) {
      console.error('create-bootcamp-checkout failed', err);
      setError(err.message === 'No se pudo iniciar el pago.'
        ? 'No se pudo iniciar el pago. Intenta de nuevo.'
        : err.message);
      setCargando(false);
    }
  };

  return (
    <div className="page-bootcamp">
      <Seo title={BOOTCAMP_TITLE} description={BOOTCAMP_DESCRIPTION} path="/bootcamp" jsonLd={BOOTCAMP_JSON_LD} />

      <div className="bc-ann">
        {FECHA_CORTA} · {LUGAR} <b>de {HORARIO}</b>
      </div>

      {/* ---------- HERO + TARJETA DE COMPRA ---------- */}
      <section className="bc-hero">
        <div className="bc-hero-bg">
          <video src="/videos/hero-bg.mp4" poster="/videos/hero-bg-poster.webp" autoPlay muted loop playsInline />
        </div>

        <div className="wrap bc-hero-grid">
          <div className="bc-hero-copy">
            <span className="bc-badge">Un día de inmersión completa</span>
            <h1>Haces de todo. <span className="bc-ital">Y sigues sin llegar a fin de mes.</span></h1>
            <p className="bc-lead">
              Un sábado entero, sentados con tus números de frente. Sales sabiendo exactamente
              en qué se te va la plata, qué creencias te están frenando, y con un plan claro
              para administrar e invertir tu dinero de aquí a un año.
            </p>

            <div className="bc-hero-cta">
              <button type="button" className="btn btn-gold btn-block btn-lg" onClick={irAComprar}>
                Sí, reservar mi entrada
              </button>
            </div>

            <div className="bc-meta-row">
              <div className="bc-chip">
                <div className="bc-chip-head"><small>Fecha</small></div>
                <b>{FECHA_CORTA}</b>
              </div>
              <div className="bc-chip">
                <div className="bc-chip-head"><small>Horario</small></div>
                <b>{HORARIO}</b>
              </div>
              <div className="bc-chip bc-chip-wide">
                <div className="bc-chip-head"><small>Dónde</small></div>
                <b>{LUGAR}</b>
              </div>
              <div className="bc-chip bc-chip-price">
                <div className="bc-chip-head"><small>Qué cuesta</small></div>
                <b>${PRECIO_INDIVIDUAL} solo · ${PRECIO_PAREJA} con alguien</b>
              </div>
            </div>

            <div className="bc-band">
              <span><b>Incluye el curso completo «{CURSO_NOMBRE}»</b> para que lo que armes ese día lo repitas cada año.</span>
            </div>

            <figure className="bc-hero-img">
              <img src={FotoSala} alt="Asistentes con las manos levantadas durante el primer día presencial de Revolución del Dinero en Gold Coast" />
              <div className="bc-ov">El primer día, en Gold Coast</div>
            </figure>

            <div className="bc-urgency">
              <span className="bc-dot"></span>
              <span>
                Es un solo sábado: el {FECHA_LARGA.toLowerCase()}. Hasta la próxima edición
                no hay otro.
              </span>
            </div>
          </div>

          {/* ---------- LA TARJETA DE COMPRA (única en la página) ---------- */}
          <div className="bc-formcard-sticky" id="comprar" ref={compraRef}>
            <div className="bc-formcard">
              <h3>Aparta tu puesto</h3>
              <p className="bc-fsub">
                Eliges si vienes solo o con alguien, dejas tus datos y pasas al pago.
              </p>

              <div className="bc-choice">
                <button
                  type="button"
                  className={`bc-opt${tier === INDIVIDUAL ? ' bc-on' : ''}`}
                  onClick={() => elegirTier(INDIVIDUAL)}
                  aria-pressed={tier === INDIVIDUAL}
                >
                  <span className="bc-radio"></span>
                  <span className="bc-opt-body">
                    <b>Voy solo</b>
                    <small>Un puesto</small>
                  </span>
                  <span className="bc-opt-price">${PRECIO_INDIVIDUAL}</span>
                </button>

                <button
                  type="button"
                  className={`bc-opt${tier === PAREJA ? ' bc-on' : ''}`}
                  onClick={() => elegirTier(PAREJA)}
                  aria-pressed={tier === PAREJA}
                >
                  <span className="bc-radio"></span>
                  <span className="bc-opt-body">
                    <b>Vengo con alguien</b>
                    <small>Dos puestos, ${PRECIO_PAREJA / 2} cada uno</small>
                  </span>
                  <span className="bc-opt-price">${PRECIO_PAREJA}</span>
                </button>
              </div>

              {error && <div className="bc-error">{error}</div>}
              {faltaConfiguracion && !error && (
                <div className="bc-error">
                  El pago no está abierto en este momento. Escríbeme y lo resolvemos.
                </div>
              )}

              <form ref={formRef} onSubmit={comprar} noValidate>
                <div className="bc-field">
                  <label htmlFor="bcNombre">Nombre completo</label>
                  <input id="bcNombre" name="nombre" type="text" autoComplete="name" placeholder="Tu nombre y apellido" ref={nombreRef} required />
                </div>
                <div className="bc-field">
                  <label htmlFor="bcEmail">Correo electrónico</label>
                  <input id="bcEmail" name="email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" ref={emailRef} required />
                </div>
                <div className="bc-field">
                  <label htmlFor="bcTel">Teléfono</label>
                  <input id="bcTel" name="tel" type="tel" autoComplete="tel" placeholder="+61 ..." ref={telRef} required />
                </div>

                {/* Honeypot: invisible para una persona, irresistible para un bot. */}
                <div className="bc-hp" aria-hidden="true">
                  <label htmlFor="bcEmpresa">Empresa</label>
                  <input id="bcEmpresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" ref={empresaRef} />
                </div>

                {tier === PAREJA && (
                  <>
                    <div className="bc-divider">
                      Los datos de quien viene contigo <span>Para que su puesto quede a su nombre</span>
                    </div>
                    <div className="bc-field">
                      <label htmlFor="bcAmigoNombre">Su nombre completo</label>
                      <input id="bcAmigoNombre" name="amigoNombre" type="text" placeholder="Nombre y apellido" ref={amigoNombreRef} required />
                    </div>
                    <div className="bc-field">
                      <label htmlFor="bcAmigoTel">Su teléfono</label>
                      <input id="bcAmigoTel" name="amigoTel" type="tel" placeholder="+61 ..." ref={amigoTelRef} required />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={cargando || faltaConfiguracion}>
                  {cargando ? 'Abriendo el pago…' : 'Sí, reservar mi entrada'}
                </button>

                <p className="bc-fee">
                  Son ${seleccionado.precio}. En la pantalla de pago te va a aparecer $
                  {seleccionado.cobro}: esa diferencia es la comisión de la pasarela y no se
                  queda acá.
                </p>

                <div className="bc-trust-mini">
                  <span>✓ Pago seguro con Stripe</span>
                  <span>✓ Confirmación al correo</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- A QUIÉN ES ESTE DÍA ---------- */}
      <section className="bc-sec" id="para-ti">
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">A quién es este día</span>
            <h2>Si te reconoces acá, el día es tuyo.</h2>
          </div>

          <div className="bc-list2">
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Trabajas duro, a veces en dos lados, y a fin de mes <b>no sabes bien dónde quedó lo que ganaste</b>.</p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Ya cancelaste tarjetas, cortaste el café y bajaste el plan del teléfono. <b>Y sigue sin alcanzar.</b></p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Tienes tres cuentas en tres bancos y <b>no sabes qué es cada ahorro</b>.</p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Mandas plata a casa y a la vez acá <b>te falta para el mercado</b>.</p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Trabajas por debajo de lo que estudiaste y <b>llevas años pagando por el derecho a quedarte</b> acá.</p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Quieres algo propio y <b>no crees que puedas</b>.</p>
            </div>
          </div>

          <p className="bc-close">
            Nada de esto es falta de esfuerzo. Es falta de un método. Y eso se aprende en un día.
          </p>
        </div>
      </section>

      {/* ---------- BANDA CTA ---------- */}
      <section className="bc-ctaband">
        <div className="wrap bc-ctaband-inner">
          <div>
            <h3>Un sábado entero, y de ahí no sales con tarea. Sales con decisiones.</h3>
            <p>{FECHA_LARGA}, en {LUGAR}. Con el curso «{CURSO_NOMBRE}» incluido.</p>
          </div>
          <button type="button" className="btn btn-gold btn-lg" onClick={irAComprar}>
            Sí, reservar mi entrada
          </button>
        </div>
      </section>

      {/* ---------- QUÉ TE LLEVAS ---------- */}
      <section className="bc-sec" id="que-te-llevas" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Qué te llevas</span>
            <h2>El lunes vas a tener <span className="accent ital">esto en la mano.</span></h2>
            <p>
              No apuntes. Cuatro cosas terminadas, escritas por ti, que puedes abrir el lunes
              a las siete de la mañana.
            </p>
          </div>

          <div className="bc-results">
            <div className="bc-res">
              <span className="bc-res-num">01</span>
              <div>
                <h3>Tus números en una hoja</h3>
                <p>Qué entra, qué sale, qué debes y qué te queda. En números, no en sensaciones. Vas a poder decir cuánto te sobra o cuánto te falta cada mes sin tener que pensarlo.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">02</span>
              <div>
                <h3>Tus deudas en una lista, con fecha de salida</h3>
                <p>La tarjeta, el AfterPay, el Zip, el teléfono si lo estás pagando a cuotas, lo que le debes a tu primo. Todas en un solo lado, en el orden en que las vas a atacar. Vas a salir sabiendo cuándo se termina.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">03</span>
              <div>
                <h3>Las frases que traes de casa, escritas</h3>
                <p>Y sabiendo cuáles siguen siendo ciertas hoy y cuáles te las prestaron. Escritas dejan de decidir por ti. En la cabeza, siguen decidiendo.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">04</span>
              <div>
                <h3>Tu año proyectado, y decisiones tomadas</h3>
                <p>No un presupuesto de un mes que abandonas en marzo: los doce, con los meses malos ya contados. Y tres decisiones con fecha y con el primer paso definido. No tarea. Decisiones.</p>
              </div>
            </div>
          </div>

          <figure className="bc-wide-photo reveal">
            <img src={FotoCierre} alt="Asistentes de pie celebrando con sus hojas de trabajo al final del primer día presencial" loading="lazy" />
          </figure>
        </div>
      </section>

      {/* ---------- CÓMO ES EL DÍA (sin horas ni módulos: tres partes contadas en lenguaje natural) ---------- */}
      <section className="bc-sec" id="el-dia">
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Cómo es el día</span>
            <h2>Llegas con tus números revueltos. <span className="accent ital">Te vas con un plan.</span></h2>
            <p>
              Sin agenda hora por hora ni presentaciones eternas. Trabajamos en tres partes,
              y en cada una te llevas algo tuyo, escrito por ti.
            </p>
          </div>

          <div className="bc-moves-grid">
            <div className="bc-moves">
              <div className="bc-move">
                <div><span className="bc-pill">Por la mañana</span></div>
                <div className="bc-move-body">
                  <h3>Ver tu plata como es, no como la sientes</h3>
                  <p>
                    Ponemos todo sobre la mesa: qué entra, qué sale, qué debes y qué te queda.
                    Es la parte que casi nadie hace solo, y por eso es la primera. Casi todos
                    descubren algo de su propia plata que no sabían. Ese momento vale el día.
                  </p>
                </div>
              </div>

              <div className="bc-move">
                <div><span className="bc-pill">Al mediodía</span></div>
                <div className="bc-move-body">
                  <h3>Entender por qué haces lo que haces con el dinero</h3>
                  <p>
                    Las frases que oíste en casa sobre la plata siguen decidiendo por ti hoy.
                    Las sacamos a la luz, les ponemos nombre y las reemplazamos con un
                    ejercicio concreto, no con frases motivacionales. Es la parte que nadie
                    espera y de la que más habla la gente al salir.
                  </p>
                </div>
              </div>

              <div className="bc-move">
                <div><span className="bc-pill">Por la tarde</span></div>
                <div className="bc-move-body">
                  <h3>Armar tu plan y decidir qué haces desde el lunes</h3>
                  <p>
                    Proyectas tu año completo, meses buenos y malos incluidos. Ves qué opciones
                    reales tienes acá para que tu dinero crezca y dónde hay una oportunidad de
                    ingreso a tu alcance. Cierras con decisiones tomadas, con fecha y primer
                    paso. No con tarea.
                  </p>
                </div>
              </div>
            </div>

            <aside className="bc-moves-side">
              <figure className="bc-side-photo">
                <img src={FotoDeclaraciones} alt="Asistentes de pie leyendo en voz alta sus hojas de trabajo durante el primer día presencial" loading="lazy" />
                <figcaption>Se trabaja escribiendo. Todo el día.</figcaption>
              </figure>
              <div className="bc-note">
                <b>Dos cosas que necesitas traer</b>
                <p>
                  Tus números como estén, aunque sea en capturas del banco. Y{' '}
                  <strong>${EFECTIVO_DIA} en efectivo</strong>: los vamos a usar en un
                  ejercicio práctico, y sin ellos te quedas mirando.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------- BANDA CTA ---------- */}
      <section className="bc-ctaband bc-ctaband-alt">
        <div className="wrap bc-ctaband-inner">
          <div>
            <h3>Un sábado con tus números sobre la mesa. Y un curso para repetirlo cada año.</h3>
            <p>De {HORARIO}, en {LUGAR}.</p>
          </div>
          <button type="button" className="btn btn-gold btn-lg" onClick={irAComprar}>
            Sí, reservar mi entrada
          </button>
        </div>
      </section>

      {/* ---------- EL CURSO INCLUIDO ---------- */}
      <section className="bc-sec" id="curso" style={{ background: 'var(--sand)' }}>
        <div className="wrap bc-bonus-grid">
          <figure className="bc-bonus-photo reveal">
            <img src={FotoJonathan} alt="Jonathan González conversando con una asistente en un evento de Revolución del Dinero" loading="lazy" />
          </figure>
          <div className="bc-bonus-body reveal">
            <span className="bc-eyebrow">Va incluido con tu entrada</span>
            <h2>El curso completo <span className="accent ital">«{CURSO_NOMBRE}».</span></h2>
            <p>
              El sábado armas tu primer año proyectado conmigo al lado. El curso es para que
              no dependas de mí para hacerlo de nuevo: cada enero, o cada vez que te cambie
              la vida, te sientas y lo vuelves a armar tú solo.
            </p>
            <div className="bc-scope">
              <b>Con el curso aprendes a:</b> proyectar tus ingresos y gastos de los doce
              meses, anticipar los meses difíciles antes de que lleguen, ponerle fecha a tus
              metas y ajustar el plan cuando la realidad cambie.
            </div>
            <p>
              Es lo que convierte un buen sábado en un hábito que te acompaña el resto de la
              vida. Y va incluido, vengas solo o con alguien.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- QUIÉN SOY (componente compartido) ---------- */}
      <AboutSection
        id="anfitrion"
        closing={
          <p>
            El {FECHA_LARGA.toLowerCase()} voy a estar un sábado entero en una sala en{' '}
            {LUGAR.replace(', Australia', '')} haciendo exactamente esto con quien quiera
            sentarse a hacerlo.
          </p>
        }
      />

      {/* ---------- TESTIMONIOS EN VIDEO (componente compartido) ---------- */}
      <TestimonialsSection
        id="testimonios"
        eyebrow="Del taller de finanzas"
        heading={<>Esto es lo que dijo la gente <span className="accent ital">al salir del primer evento.</span></>}
      />

      {/* ---------- LO PRÁCTICO ---------- */}
      <section className="bc-sec" id="practico">
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Lo práctico</span>
            <h2>Lo que necesitas saber <span className="accent ital">antes de llegar.</span></h2>
            <p>
              Cuatro cosas. Dos las ponemos nosotros, dos las traes tú.
            </p>
          </div>

          <div className="bc-cards3">
            <div className="bc-lcard reveal">
              <div className="bc-ic">📅</div>
              <small className="bc-lcard-label">Cuándo</small>
              <h3>{FECHA_CORTA}</h3>
              <p>El registro abre a las {REGISTRO}. Arrancamos a las 10 en punto y vamos de {HORARIO}. Llega con calma: es un día largo y vale cada hora.</p>
            </div>
            <div className="bc-lcard reveal">
              <div className="bc-ic">📍</div>
              <small className="bc-lcard-label">Dónde</small>
              <h3>{LUGAR}</h3>
              <p>La dirección exacta, cómo llegar y dónde parquear te llegan al correo unos días antes. Solo tienes que aparecer.</p>
            </div>
            <div className="bc-lcard reveal">
              <div className="bc-ic">📱</div>
              <small className="bc-lcard-label">Traes tú</small>
              <h3>Tus números, como estén</h3>
              <p>En capturas del banco, en una libreta o en la cabeza. No hace falta que vengan ordenados: para eso es el día. El material de trabajo lo ponemos nosotros.</p>
            </div>
            <div className="bc-lcard bc-lcard-warn reveal">
              <div className="bc-ic">💵</div>
              <small className="bc-lcard-label">Traes tú</small>
              <h3>${EFECTIVO_DIA} en efectivo</h3>
              <p>Para un ejercicio práctico que hacemos con plata real en la mano. En billetes, no con tarjeta, y ${EFECTIVO_DIA} por persona. Sin ellos te quedas por fuera del ejercicio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ENTRADAS ---------- */}
      <section className="bc-sec" id="entradas" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Qué cuesta</span>
            <h2>${PRECIO_INDIVIDUAL} si vienes solo. ${PRECIO_PAREJA} si vienes con alguien.</h2>
            <p>
              La de dos es para que traigas a quien tú quieras: tu pareja, tu hermano, tu flatmate.
            </p>
          </div>

          <div className="bc-tickets">
            <div className="bc-tk">
              <div className="bc-tk-head">
                <span className="bc-tk-name">Vengo solo</span>
                <div className="bc-tk-price"><sup>$</sup>{PRECIO_INDIVIDUAL} <em>AUD</em></div>
              </div>
              <ul className="bc-tk-list">
                <li>El sábado entero, de <b>{HORARIO}</b></li>
                <li>El curso completo <b>«{CURSO_NOMBRE}»</b></li>
                <li>Todo el material con el que vas a trabajar</li>
              </ul>
              <button type="button" className="btn btn-outline btn-block" onClick={elegirYComprar(INDIVIDUAL)}>
                Sí, reservar mi entrada
              </button>
              <p className="bc-tk-fee">
                En la pantalla de pago te va a aparecer ${COBRO_INDIVIDUAL}: esos $
                {COBRO_INDIVIDUAL - PRECIO_INDIVIDUAL} son la comisión de la pasarela y no se
                quedan acá.
              </p>
            </div>

            <div className="bc-tk bc-tk-dark">
              <span className="bc-tk-flag">Trae a quien tú quieras</span>
              <div className="bc-tk-head">
                <span className="bc-tk-name">Vengo con alguien</span>
                <div className="bc-tk-price"><sup>$</sup>{PRECIO_PAREJA} <em>AUD</em></div>
              </div>
              <ul className="bc-tk-list">
                <li>Todo lo de arriba, para <b>los dos</b></li>
                <li>El curso <b>«{CURSO_NOMBRE}»</b> para cada uno</li>
                <li>Material para los dos</li>
                <li>Sale a <b>${PRECIO_PAREJA / 2} cada uno</b></li>
              </ul>
              <button type="button" className="btn btn-gold btn-block" onClick={elegirYComprar(PAREJA)}>
                Sí, reservar mi entrada
              </button>
              <p className="bc-tk-fee">
                En la pantalla de pago te va a aparecer ${COBRO_PAREJA}: esos $
                {COBRO_PAREJA - PRECIO_PAREJA} son la comisión de la pasarela y no se quedan
                acá.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- PREGUNTAS FRECUENTES ---------- */}
      <section className="bc-sec" id="faq" style={{ background: 'var(--sand)' }}>
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Lo que más me preguntan</span>
            <h2>Antes de que me escribas a preguntar.</h2>
          </div>

          <div className="bc-faq">
            <details className="bc-qa">
              <summary>¿Tengo que saber de finanzas? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                No. <b>Si supieras, no te haría falta el día.</b> No hay matemáticas raras:
                sumar, restar y sacar porcentajes. Lo único que sí necesitas es venir
                dispuesto a mirar tus números. Y si creciste oyendo que no eres bueno con los
                números, esa frase es de las que vamos a desarmar ese mismo día.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Para qué son los ${EFECTIVO_DIA} en efectivo? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Para un <b>ejercicio práctico</b> que hacemos ese día con plata real en la
                mano: con billetes se aprende distinto que con números en una hoja. Tienen
                que ser efectivo, no tarjeta ni transferencia, y cada persona trae los suyos.
                Si vienes con alguien, ${EFECTIVO_DIA} cada uno.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Puedo llevar a alguien? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Sí. Con la entrada de <b>${PRECIO_PAREJA} entran dos</b>, y es para que traigas
                a quien tú quieras: tu pareja, tu hermano, tu mamá, un amigo. Al elegirla te
                pido su nombre y su teléfono para que su puesto quede a su nombre.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Qué es el curso «{CURSO_NOMBRE}»? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Es el curso completo para aprender a proyectar tu año financiero tú solo:
                ingresos, gastos, deudas y metas de los doce meses. <b>Va incluido con
                cualquier entrada</b>, y los detalles para acceder te llegan al correo después
                de comprar.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Y si nunca he hecho un presupuesto? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Mejor. Vienes sin malos hábitos que corregir. El sábado lo armamos juntos
                desde cero, y con el curso aprendes a repetirlo cada año sin ayuda.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Y si al final no puedo ir? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Escríbeme y lo resolvemos. Puedes mandar a alguien en tu lugar o pasar tu
                puesto a la siguiente edición. Las condiciones están en los{' '}
                <a href="/terminos">términos y la política de reembolso</a>.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Es en español? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">Todo, de principio a fin.</div>
            </details>

            <details className="bc-qa">
              <summary>¿Por qué en el pago sale ${COBRO_INDIVIDUAL} y no ${PRECIO_INDIVIDUAL}? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Porque esos ${COBRO_INDIVIDUAL - PRECIO_INDIVIDUAL} son la comisión de la
                pasarela y no se quedan acá. Prefiero decírtelo yo que dejar que te enteres
                solo en la pantalla de pago.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ---------- TRUSTBAND ---------- */}
      <section className="bc-trustband">
        <div className="wrap bc-trustband-inner">
          <div className="bc-tb-item">
            <div><b>Pago seguro con Stripe</b><small>No guardamos datos de tu tarjeta.</small></div>
          </div>
          <div className="bc-tb-item">
            <div><b>Confirmación al correo</b><small>Con la dirección y cómo llegar.</small></div>
          </div>
          <div className="bc-tb-item">
            <div><b>Curso «{CURSO_NOMBRE}» incluido</b><small>Con cualquiera de las dos entradas.</small></div>
          </div>
        </div>
      </section>

      {/* ---------- CIERRE ---------- */}
      <section className="bc-final">
        <div className="wrap bc-inner">
          <span className="bc-eyebrow">{FECHA_LARGA}</span>
          <h2>El problema nunca fue que no supieras. <span className="bc-ital">Era que nadie se había sentado contigo a mirarlo.</span></h2>
          <p>
            Un sábado entero, en {LUGAR}, con tus números sobre la mesa y el curso
            «{CURSO_NOMBRE}» incluido. ${PRECIO_INDIVIDUAL} si vienes solo, ${PRECIO_PAREJA} si
            vienes con alguien.
          </p>
          <button type="button" className="btn btn-gold btn-lg" onClick={irAComprar}>
            Sí, reservar mi entrada
          </button>
          <p className="bc-final-fee">
            En la pantalla de pago te va a aparecer ${COBRO_INDIVIDUAL}: esos $
            {COBRO_INDIVIDUAL - PRECIO_INDIVIDUAL} son la comisión de la pasarela y no se
            quedan acá.
          </p>
        </div>
      </section>

      {/* ---------- PIE ---------- */}
      <footer className="bc-footer">
        <div className="wrap">
          <img src={Logo} alt="Revolución del Dinero" />
          <div>
            <a href="/terminos">Términos y política de reembolso</a>
          </div>
          <div className="bc-cr">
            © 2026 Revolución del Dinero · Jonathan González Botero · Bootcamp presencial en {LUGAR}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Bootcamp;
