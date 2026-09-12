/**
 * CÍRCULO PRESENCIAL — página de venta (/circulo)
 * ================================================
 *
 * Ruta canónica: https://www.revoluciondeldinero.com/circulo
 * Página de gracias: /circulo/gracias · Términos: /terminos
 *
 * CONTEXTO
 * Es el producto más caro y más importante del negocio. El sábado 12 de septiembre de
 * 2026 Jonathan lo presenta desde el escenario como oferta ancla, y hay un QR impreso en
 * la sala que lleva acá. Público FRÍO: alguien que hace tres horas no lo conocía va a
 * decidir sobre $1.000 desde su teléfono.
 *
 * Por eso la página no está escrita para empujar a un botón en 30 segundos: está escrita
 * para resistir una lectura completa y responder objeciones. Botón arriba y repetido
 * después de cada bloque de valor.
 *
 * DISEÑO
 * Reutiliza el sistema de /bootcamp (Bootcamp.css, clases .bc-*) y añade lo propio en
 * Circulo.css (.cir-*). Los dos archivos se importan acá. No se toca Evento.css.
 *
 * FLUJO DE COMPRA (el orden no es negociable)
 *   1. POST /api/circulo-lead   → crea/actualiza el contacto en systeme.io con el tag
 *                                 `acceso-comunidad`. Fire-and-forget con `keepalive`:
 *                                 si el CRM falla, se registra en consola con el prefijo
 *                                 "circulo-lead" y el checkout se abre igual. Acá el
 *                                 ticket son $1.000: un abandono sin email capturado es
 *                                 la venta más cara que puede perder el negocio.
 *   2. Píxel de Meta            → evento `Lead`, con email y teléfono en los parámetros.
 *   3. POST /api/create-circulo-checkout → Stripe Checkout Session.
 *                                 mode 'payment' si es pago único, 'subscription' si es
 *                                 cuotas. allow_promotion_codes: true.
 *                                 metadata: { nombre, tel, tier, plan, amigoNombre,
 *                                 amigoTel, oferta: 'circulo-presencial' }
 *   4. Píxel de Meta            → evento `InitiateCheckout`.
 *   5. Redirección a Stripe. success_url → /circulo/gracias · cancel_url → /circulo
 *   6. api/stripe-webhook.js enruta por `oferta`, reconfirma el tag y —si es cuotas—
 *      fija el `cancel_at` para que se cobren exactamente 6 mensualidades y la
 *      suscripción se apague sola. Ver api/_lib/planCuotas.js.
 *
 * VARIABLES DE ENTORNO (Vercel → Project → Settings → Environment Variables)
 *   REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL          AUD 1.018,00 pago único
 *   REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA              AUD 1.527,00 pago único
 *   REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL_CUOTAS   AUD 180,00/mes recurrente
 *   REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA_CUOTAS       AUD 270,00/mes recurrente
 * Ningún price ID está hardcodeado y no hay fallback: si falta una, la página muestra un
 * error en español y no intenta cobrar. El servidor es la autoridad sobre el precio — el
 * navegador manda `tier` y `plan`, nunca un price ID.
 *
 * 🔴 DECISIONES DE NEGOCIO Y LÍMITES LEGALES QUE ESTE ARCHIVO RESPETA
 *   · NADA de conteo de contenido. La Ruta del Revolucionario tiene 7 etapas planeadas y
 *     1 publicada, así que la página no dice cuántas etapas, clases ni videos hay, ni
 *     cuándo termina el camino. Se vende el RITMO, que es verdad y es verificable.
 *   · Ningún número de cupos, ni aforo.
 *   · Ningún precio de fundador. Los 7 fundadores entraron con un precio que no existe
 *     para nadie más y no se menciona ni se insinúa.
 *   · El Círculo Online (USD $50/mes) no se menciona: al lado de $50, $1.000 se lee caro.
 *   · El crédito del Bootcamp NO se menciona en ninguna parte. El mecanismo está listo
 *     (allow_promotion_codes en la sesión de Stripe) para que Jonathan entregue un código
 *     en persona, pero no va escrito.
 *   · Las sesiones uno a uno NUNCA se llaman "asesoría", "asesoramiento", "consultoría"
 *     ni "mentoría financiera". Van acotadas por escrito (presupuesto, deudas, hábitos,
 *     organización de cuentas). En el cuerpo de la página NO hay avisos de licencia,
 *     AFSL ni "esto no es asesoría": Jonathan lo aclara en persona y la página vende. El
 *     único descargo legal es el del pie (DISCLAIMER_AFSL), legible, no gris sobre gris.
 *   · El almuerzo del Bootcamp no se menciona en esta página: va en los correos.
 *   · El Bootcamp incluido lleva el curso «Proyección anual financiera» (CURSO_NOMBRE de
 *     config/bootcamp.js), igual que el Bootcamp suelto.
 *   · El link de Calendly no aparece acá. Solo en /circulo/gracias.
 */

import { useEffect, useRef, useState } from 'react';
import './Bootcamp.css';
import './Circulo.css';
import Logo from '../assets/images/logo.webp';
import FotoHero from '../assets/images/IMG_0293.webp';
import FotoSala from '../assets/images/_MG_0156.webp';
import FotoCierre from '../assets/images/IMG_0305.webp';
import FotoDeclaraciones from '../assets/images/_MG_0234.webp';
import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import Seo from '../components/Seo';
import { CIRCULO_TITLE, CIRCULO_DESCRIPTION, CIRCULO_JSON_LD, DISCLAIMER_AFSL } from '../seoData';
import {
  PRECIOS,
  PRICE_IDS,
  NUMERO_CUOTAS,
  RECARGO_CUOTAS_PCT,
  BOOTCAMP_INCLUIDO,
  RITMO_CONTENIDO,
  CURSO_NEGOCIO,
  DURACION,
  EVENTO_MARZO,
  SESIONES_1A1,
} from '../config/circulo';
import { CURSO_NOMBRE } from '../config/bootcamp';

const INDIVIDUAL = 'circulo-individual';
const PAREJA = 'circulo-pareja';

// Un contacto en systeme.io antes del pago, siempre. Sin `await` y sin superficie en la
// interfaz: la escritura en el CRM no puede retrasar la redirección a Stripe, y una caída
// del CRM no puede impedirle a nadie pagar. `keepalive` deja que la petición termine
// aunque el navegador ya se haya ido a Stripe.
function enviarContactoAlCrm(payload) {
  fetch('/api/circulo-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err) => {
    console.error('circulo-lead failed', err);
  });
}

function Circulo() {
  const [tier, setTier] = useState(INDIVIDUAL);
  const [plan, setPlan] = useState('unico');
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

  useRevealOnScroll();

  const precio = PRECIOS[tier];
  const esCuotas = plan === 'cuotas';

  // Si falta el price ID de la combinación elegida no se intenta cobrar con ningún
  // fallback: mensaje claro y botón deshabilitado.
  const faltaConfiguracion = !PRICE_IDS[tier][plan];

  useEffect(() => {
    window.fbq?.('track', 'ViewContent', {
      content_name: 'Circulo Presencial',
      content_category: 'circulo-presencial',
      currency: 'AUD',
      value: PRECIOS[INDIVIDUAL].unico.anunciado,
    });
  }, []);

  const irAComprar = (e) => {
    e?.preventDefault();
    compraRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nombreRef.current?.focus({ preventScroll: true });
  };

  // Desde las tarjetas de precio: fija las dos dimensiones a la vez y sube al formulario.
  const elegir = (nuevoTier, nuevoPlan) => (e) => {
    setTier(nuevoTier);
    setPlan(nuevoPlan);
    setError('');
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
      setError('Para la entrada de dos personas necesitamos el nombre y el teléfono de quien entra contigo.');
      formRef.current.reportValidity();
      return;
    }
    if (faltaConfiguracion) {
      setError('Esa forma de pago no está disponible en este momento. Escríbenos y lo resolvemos contigo.');
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
    const valorAnunciado = esCuotas ? precio.cuotas.total : precio.unico.anunciado;
    if (!leadEnviadoRef.current) {
      window.fbq?.('track', 'Lead', {
        em: email.toLowerCase(),
        ph: tel,
        content_name: 'Circulo Presencial',
        content_category: 'circulo-presencial',
        currency: 'AUD',
        value: valorAnunciado,
      });
      leadEnviadoRef.current = true;
    }

    // 3. Stripe Checkout Session.
    setCargando(true);
    try {
      const res = await fetch('/api/create-circulo-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, tel, amigoNombre, amigoTel, tier, plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago.');

      // 4. Píxel: InitiateCheckout, ya con la sesión creada.
      window.fbq?.('track', 'InitiateCheckout', {
        em: email.toLowerCase(),
        ph: tel,
        content_name: `Circulo Presencial · ${precio.nombre} · ${esCuotas ? 'cuotas' : 'pago unico'}`,
        content_category: 'circulo-presencial',
        currency: 'AUD',
        value: esCuotas ? precio.cuotas.mensual : precio.unico.cobro,
      });

      // 5. A Stripe.
      window.location.href = data.url;
    } catch (err) {
      console.error('create-circulo-checkout failed', err);
      setError(err.message === 'No se pudo iniciar el pago.'
        ? 'No se pudo iniciar el pago. Intenta de nuevo.'
        : err.message);
      setCargando(false);
    }
  };

  return (
    <div className="page-bootcamp page-circulo">
      <Seo title={CIRCULO_TITLE} description={CIRCULO_DESCRIPTION} path="/circulo" jsonLd={CIRCULO_JSON_LD} />

      <div className="bc-ann">
        Personas que hablan de dinero · <b>Incluye el Bootcamp de noviembre y «{EVENTO_MARZO.nombre}» en {EVENTO_MARZO.mes}</b>
      </div>

      {/* ---------- HERO + TARJETA DE COMPRA ---------- */}
      <section className="bc-hero">
        <div className="bc-hero-bg">
          <video src="/videos/hero-bg.mp4" poster="/videos/hero-bg-poster.webp" autoPlay muted loop playsInline />
        </div>

        <div className="wrap bc-hero-grid">
          <div className="bc-hero-copy">
            <span className="bc-badge">Un año de mentoria</span>
            <h1>Nadie me pidió más información. <span className="bc-ital">Todos me pidieron hacerlo en grupo.</span></h1>
            <p className="bc-lead">
              Seis conversaciones con la gente de la comunidad y todos dijeron lo mismo con
              palabras distintas. El Círculo es eso: un año de mentoria conmigo y con un grupo que
              quiere lo mismo que tú.
            </p>

            <div className="bc-hero-cta">
              <button type="button" className="btn btn-gold btn-block btn-lg" onClick={irAComprar}>
                Quiero entrar al Círculo
              </button>
            </div>

            <div className="bc-meta-row">
              <div className="bc-chip">
                <div className="bc-chip-head"><small>Cuánto dura</small></div>
                <b>{DURACION}</b>
              </div>
              <div className="bc-chip">
                <div className="bc-chip-head"><small>Dónde</small></div>
                <b>{BOOTCAMP_INCLUIDO.lugar}</b>
              </div>
              <div className="bc-chip bc-chip-price">
                <div className="bc-chip-head"><small>Qué cuesta</small></div>
                <b>
                  ${PRECIOS[INDIVIDUAL].unico.anunciado} el año · o {NUMERO_CUOTAS} cuotas de ${PRECIOS[INDIVIDUAL].cuotas.mensual}
                </b>
              </div>
            </div>

            <div className="bc-band">
              <span>
                <b>Incluye el Bootcamp de noviembre y «{EVENTO_MARZO.nombre}» en {EVENTO_MARZO.mes}.</b>{' '}
                Más {SESIONES_1A1} sesiones 1:1 conmigo durante el año.
              </span>
            </div>

            <figure className="bc-hero-img">
              <img src={FotoHero} alt="Asistentes de pie al cierre del primer día presencial de Revolución del Dinero en Gold Coast" />
              <div className="bc-ov">La primera sala, en Gold Coast</div>
            </figure>

            <div className="bc-urgency">
              <span className="bc-dot"></span>
              <span>
                No porque seas latino tienes menos oportunidades. Lo que pasa es que todo lo
                que ganas se va en seguir estando acá — y eso no se arregla recortando, se
                arregla construyendo.
              </span>
            </div>
          </div>

          {/* ---------- LA TARJETA DE COMPRA (única en la página) ---------- */}
          <div className="bc-formcard-sticky" id="entrar" ref={compraRef}>
            <div className="bc-formcard">
              <h3>Entra a la comunidad</h3>
              <p className="bc-fsub">
                Eliges si entras solo o con alguien, y si pagas de una vez o en seis cuotas.
              </p>

              <div className="bc-choice">
                <button
                  type="button"
                  className={`bc-opt${tier === INDIVIDUAL ? ' bc-on' : ''}`}
                  onClick={() => { setTier(INDIVIDUAL); setError(''); }}
                  aria-pressed={tier === INDIVIDUAL}
                >
                  <span className="bc-radio"></span>
                  <span className="bc-opt-body">
                    <b>Entro yo</b>
                    <small>Un puesto</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`bc-opt${tier === PAREJA ? ' bc-on' : ''}`}
                  onClick={() => { setTier(PAREJA); setError(''); }}
                  aria-pressed={tier === PAREJA}
                >
                  <span className="bc-radio"></span>
                  <span className="bc-opt-body">
                    <b>Entro con alguien</b>
                    <small>Dos puestos · quien tú quieras</small>
                  </span>
                </button>
              </div>

              <div className="cir-plan">
                <button
                  type="button"
                  className={plan === 'unico' ? 'cir-on' : ''}
                  onClick={() => { setPlan('unico'); setError(''); }}
                  aria-pressed={plan === 'unico'}
                >
                  De una vez
                  <small>${precio.unico.anunciado} el año</small>
                </button>
                <button
                  type="button"
                  className={esCuotas ? 'cir-on' : ''}
                  onClick={() => { setPlan('cuotas'); setError(''); }}
                  aria-pressed={esCuotas}
                >
                  En {NUMERO_CUOTAS} cuotas
                  <small>${precio.cuotas.mensual} al mes</small>
                </button>
              </div>

              <div className="cir-total">
                {esCuotas ? (
                  <>
                    <div className="cir-amt">
                      <sup>$</sup>{precio.cuotas.mensual} <em>/mes</em>
                    </div>
                    <small>
                      Seis pagos y se para solo. El total queda en ${precio.cuotas.total}.
                    </small>
                  </>
                ) : (
                  <>
                    <div className="cir-amt">
                      <sup>$</sup>{precio.unico.anunciado} <em>AUD</em>
                    </div>
                    <small>Un pago. El año completo.</small>
                  </>
                )}
              </div>

              {error && <div className="bc-error">{error}</div>}
              {faltaConfiguracion && !error && (
                <div className="bc-error">
                  Esa forma de pago no está abierta en este momento. Escríbeme y lo
                  resolvemos.
                </div>
              )}

              <form ref={formRef} onSubmit={comprar} noValidate>
                <div className="bc-field">
                  <label htmlFor="cirNombre">Nombre completo</label>
                  <input id="cirNombre" name="nombre" type="text" autoComplete="name" placeholder="Tu nombre y apellido" ref={nombreRef} required />
                </div>
                <div className="bc-field">
                  <label htmlFor="cirEmail">Correo electrónico</label>
                  <input id="cirEmail" name="email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" ref={emailRef} required />
                </div>
                <div className="bc-field">
                  <label htmlFor="cirTel">Teléfono</label>
                  <input id="cirTel" name="tel" type="tel" autoComplete="tel" placeholder="+61 ..." ref={telRef} required />
                </div>

                {/* Honeypot: invisible para una persona, irresistible para un bot. */}
                <div className="bc-hp" aria-hidden="true">
                  <label htmlFor="cirEmpresa">Empresa</label>
                  <input id="cirEmpresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" ref={empresaRef} />
                </div>

                {tier === PAREJA && (
                  <>
                    <div className="bc-divider">
                      Los datos de quien entra contigo <span>Para que su puesto quede a su nombre</span>
                    </div>
                    <div className="bc-field">
                      <label htmlFor="cirAmigoNombre">Su nombre completo</label>
                      <input id="cirAmigoNombre" name="amigoNombre" type="text" placeholder="Nombre y apellido" ref={amigoNombreRef} required />
                    </div>
                    <div className="bc-field">
                      <label htmlFor="cirAmigoTel">Su teléfono</label>
                      <input id="cirAmigoTel" name="amigoTel" type="tel" placeholder="+61 ..." ref={amigoTelRef} required />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={cargando || faltaConfiguracion}>
                  {cargando ? 'Abriendo el pago…' : 'Quiero entrar al Círculo'}
                </button>

                <p className="bc-fee">
                  {esCuotas ? (
                    <>
                      Seis cuotas de ${precio.cuotas.mensual}: el total queda en $
                      {precio.cuotas.total}. Ese {RECARGO_CUOTAS_PCT}% de más es por
                      financiarlo, y te lo digo acá y no en letra chiquita.
                    </>
                  ) : (
                    <>
                      En la pantalla de pago te va a aparecer ${precio.unico.cobro}: esos $
                      {precio.unico.cobro - precio.unico.anunciado} son la comisión de la
                      pasarela y no se quedan acá.
                    </>
                  )}
                </p>

                <div className="bc-trust-mini">
                  <span>✓ Pago seguro con Stripe</span>
                  <span>✓ Todo en español</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- EL PROBLEMA ---------- */}
      <section className="bc-sec" id="el-problema">
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">El problema</span>
            <h2>Información hay de sobra. Lo que no hay es alguien que se siente contigo.</h2>
            <p>
              Y entienda tu proceso migratorio.
            </p>
          </div>

          <div className="bc-list2">
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Empiezas ordenado en enero y <b>en marzo ya no sabes en qué quedó</b>. Solo, nadie te pregunta cómo vas.</p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Guardaste diez videos, tres podcasts y un libro. <b>No abriste ninguno</b>, y no es por pereza: es que no tienes comunidad.</p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>En tu casa nadie habla de plata con números al frente. <b>En tu trabajo tampoco.</b></p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Ya cancelaste tarjetas, cortaste el café y bajaste el plan del teléfono. <b>Y sigue sin alcanzar.</b></p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Trabajas por debajo de lo que estudiaste y <b>llevas años pagando por el derecho a quedarte</b> acá.</p>
            </div>
            <div className="bc-li">
              <span className="bc-ck">✓</span>
              <p>Y hay algo que casi nadie te dice: <b>administrar tu plata sin saber en qué país vas a estar en tres años es más difícil</b>. No es que lo estés haciendo mal.</p>
            </div>
          </div>

          <p className="bc-close">
            Eso no lo arregla otro curso.
          </p>
        </div>
      </section>

      {/* ---------- BANDA CTA ---------- */}
      <section className="bc-ctaband">
        <div className="wrap bc-ctaband-inner">
          <div>
            <h3>Un año acompañado, en vez de otro año intentándolo solo.</h3>
            <p>Grupo pequeño, presencial en {BOOTCAMP_INCLUIDO.lugar}, y todo en español.</p>
          </div>
          <button type="button" className="btn btn-gold btn-lg" onClick={irAComprar}>
            Quiero entrar al Círculo
          </button>
        </div>
      </section>

      {/* ---------- QUÉ ES EL CÍRCULO ---------- */}
      <section className="bc-sec" id="que-es" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Qué es</span>
            <h2>Qué es un año <span className="accent ital">en la Comunidad.</span></h2>
            <p>
              Te lo cuento como lo que te va a pasar, no como una lista de cosas que recibes.
            </p>
          </div>

          <div className="bc-results">
            <div className="bc-res">
              <span className="bc-res-num">01</span>
              <div>
                <h3>Las primeras semanas: dejas de adivinar</h3>
                <p>Nos sentamos con tus números y sale la foto completa: qué tienes, qué debes, qué entra y qué sale. Es incómodo, y es el punto de partida. Te apuesto que vas a encontrar algo de tu propia plata que no sabías.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">02</span>
              <div>
                <h3>El primer mes: alguien te pregunta cómo vas</h3>
                <p>Eso es el producto, en realidad. Una vez al mes el grupo entero se sienta y tú dices en voz alta qué hiciste y qué no. Cuando sabes que te van a preguntar, lo haces.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">03</span>
              <div>
                <h3>En noviembre: un sábado entero en una sala</h3>
                <p>El Bootcamp, incluido. De diez de la mañana a siete de la tarde, en persona, con el grupo y con tus números sobre la mesa. De ahí sales con tu año proyectado y con decisiones tomadas.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">04</span>
              <div>
                <h3>En {EVENTO_MARZO.mes}: «{EVENTO_MARZO.nombre}»</h3>
                <p>El segundo evento presencial del año, y este no va de números: va de ti. De la identidad con la que te relacionas con el dinero, con el trabajo y con lo que crees que puedes. Porque ordenar la plata sin tocar eso es ordenar el síntoma.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">05</span>
              <div>
                <h3>Cuatro veces al año: tú y yo solos</h3>
                <p>{SESIONES_1A1} sesiones uno a uno conmigo, repartidas durante el año, porque lo tuyo nunca es exactamente lo del vecino. Ahí es donde se hablan las cosas que no se dicen en una llamada de doce personas.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">06</span>
              <div>
                <h3>12x sesiones de Cashflow</h3>
                <p>Cashflow de Kiyosaki, en persona, con el grupo. Suena a juego porque lo es, y es donde a la gente se le cae la ficha de golpe con algo que llevaba años leyendo sin entender.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">07</span>
              <div>
                <h3>Desde el primer día: mi grupo privado de WhatsApp</h3>
                <p>Entras al chat donde está la gente de la comunidad y estoy yo. Es donde preguntas a las once de la noche lo que no le puedes preguntar a nadie más, y donde ves que a otros les está pasando lo mismo.</p>
              </div>
            </div>
            <div className="bc-res">
              <span className="bc-res-num">08</span>
              <div>
                <h3>Todo el año: gente que va en lo mismo</h3>
                <p>Un grupo pequeño de latinos acá en Australia, en español. Es lo único de toda esta lista que no se puede comprar suelto en ninguna parte.</p>
              </div>
            </div>
          </div>

          <figure className="bc-wide-photo reveal">
            <img src={FotoCierre} alt="Asistentes de pie celebrando con sus hojas de trabajo al final del primer día presencial" loading="lazy" />
          </figure>
        </div>
      </section>

      {/* ---------- QUÉ INCLUYE ---------- */}
      <section className="bc-sec" id="que-incluye">
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Lo que obtendras</span>
            <h2>Lo que importa es la comunidad. Pero esto es lo que obtendras.</h2>
            <p>Y qué es cada cosa en la práctica, no en el folleto.</p>
          </div>

          <div className="cir-includes">
            <div className="cir-inc reveal">
              <div className="cir-ic">01</div>
              <div>
                <h3>
                  El Bootcamp del 28 de noviembre
                  <span className="cir-worth">Suelto vale ${BOOTCAMP_INCLUIDO.valorSuelto}</span>
                </h3>
                <p>
                  {BOOTCAMP_INCLUIDO.fecha}, en {BOOTCAMP_INCLUIDO.lugar}. Registro desde las{' '}
                  {BOOTCAMP_INCLUIDO.registro} y el día va de {BOOTCAMP_INCLUIDO.horario}. Un
                  sábado entero trabajando en persona con tus propios números: de ahí sales
                  con tu año proyectado y con decisiones tomadas.
                </p>
                <p className="cir-inc-note">
                  Y con él entra también el curso completo «{CURSO_NOMBRE}», el mismo que
                  recibe quien compra el Bootcamp suelto, para que lo que armes ese sábado lo
                  repitas cada año por tu cuenta.
                </p>
              </div>
            </div>

            <div className="cir-inc reveal">
              <div className="cir-ic">02</div>
              <div>
                <h3>«{EVENTO_MARZO.nombre}», en {EVENTO_MARZO.mes}</h3>
                <p>
                  El segundo evento presencial del año, {EVENTO_MARZO.cuando.toLowerCase()}.
                  Un día dedicado a tu identidad personal: quién eres cuando nadie te está
                  mirando, qué historias sobre ti mismo te tienen frenado y qué versión tuya
                  es la que va a sostener el plan que armaste en noviembre. Los números se
                  ordenan en un sábado. La identidad es lo que hace que se queden ordenados.
                </p>
              </div>
            </div>

            <div className="cir-inc reveal">
              <div className="cir-ic">03</div>
              <div>
                <h3>{SESIONES_1A1} sesiones 1:1 conmigo durante el año</h3>
                <p>
                  Cuatro veces al año nos sentamos tú y yo solos, sin el grupo. Son tuyas, las
                  agendas tú, y las repartes como te sirva: una al empezar para ver dónde
                  estás, y las otras cuando el año te apriete o cuando quieras acelerar.
                </p>
                <div className="cir-inc-scope">
                  <b>Tu presupuesto, tus deudas, tus hábitos y cómo tienes repartidas tus
                    cuentas.</b> Con nombres y con números, no en general.
                </div>
              </div>
            </div>

            <div className="cir-inc reveal">
              <div className="cir-ic">04</div>
              <div>
                <h3>Mi grupo privado de WhatsApp</h3>
                <p>
                  Entras al chat donde está la gente de la comunidad y estoy yo. Ahí se
                  celebran las deudas que se cierran, se preguntan las cosas que dan pena
                  preguntar en otro lado y se sostiene el ritmo entre una sesión y la
                  siguiente. Es lo que más usan los que ya están dentro.
                </p>
              </div>
            </div>

            <div className="cir-inc reveal">
              <div className="cir-ic">05</div>
              <div>
                <h3>Una sesión al mes con todo el grupo</h3>
                <p>
                  Nos sentamos todos por Zoom, se revisa qué pasó, se destraban los trancones
                  y cada uno dice en voz alta a qué se compromete para el mes que viene. Es lo
                  que hace que no abandones en marzo.
                </p>
              </div>
            </div>

            <div className="cir-inc reveal">
              <div className="cir-ic">06</div>
              <div>
                <h3>Cashflow de Kiyosaki, en persona</h3>
                <p>
                  El juego, con el grupo, una tarde entera. Es la forma más rápida que conozco
                  de entender cómo se mueve la plata, porque la mueves tú en la mesa en vez de
                  leer sobre ella.
                </p>
              </div>
            </div>

            <div className="cir-inc reveal">
              <div className="cir-ic">07</div>
              <div>
                <h3>
                  El curso «{CURSO_NEGOCIO.nombre}»
                  <span className="cir-worth">Se vende aparte por {CURSO_NEGOCIO.precioSuelto}</span>
                </h3>
                <p>
                  Va incluido. Para quien lleva años con una idea dando vueltas y no sabe por
                  dónde se empieza ni cómo saber si sirve antes de meterle tiempo y plata.
                </p>
              </div>
            </div>

            <div className="cir-inc reveal">
              <div className="cir-ic">08</div>
              <div>
                <h3>La comunidad y la Ruta del Revolucionario, en Skool</h3>
                <p>
                  El espacio cerrado donde vive el camino de formación de la comunidad, con
                  material nuevo entrando {RITMO_CONTENIDO.hastaNoviembre} hasta noviembre y{' '}
                  {RITMO_CONTENIDO.desdeDiciembre} de ahí en adelante. Un ritmo que me
                  comprometo a cumplir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- BANDA CTA ---------- */}
      <section className="bc-ctaband bc-ctaband-alt">
        <div className="wrap bc-ctaband-inner">
          <div>
            <h3>Dos eventos presenciales, el grupo cada mes y {SESIONES_1A1} sesiones a solas conmigo.</h3>
            <p>Un año entero, desde el día que entras.</p>
          </div>
          <button type="button" className="btn btn-gold btn-lg" onClick={irAComprar}>
            Quiero entrar al Círculo
          </button>
        </div>
      </section>

      {/* ---------- QUIÉN SOY (componente compartido) ---------- */}
      <AboutSection
        id="anfitrion"
        closing={
          <p>
            El Círculo es donde hago esto a fondo, con un grupo pequeño y durante un año
            entero. Es lo más cerca que puedo estar de acompañar a alguien de verdad sin
            dejar de ser una sola persona.
          </p>
        }
      />

      {/* ---------- PRUEBA SOCIAL ---------- */}
      <TestimonialsSection
        id="testimonios"
        eyebrow="Del taller de finanzas"
        heading={<>Esto es lo que dijo la gente <span className="accent ital">al salir del primer evento.</span></>}
      />

      <section className="bc-sec" id="transformacion">
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Imagina un año de esto</span>
            <h2>Eso pasó en una sola tarde. <span className="accent ital">El Círculo es un año entero.</span></h2>
            <p>
              Las personas de arriba cuentan qué se llevaron de un taller de unas horas. Si
              eso se mueve en una tarde, imagina lo que se mueve con doce meses de grupo,
              sesiones y un sábado entero de trabajo en persona.
            </p>
          </div>

          {/* El testimonio de transformación (src/components/TestimonioTransformacion.js) está
              maquetado pero todavía sin grabar. Se retiró de la página el 12 de septiembre
              de 2026 a pedido de Jonathan; cuando exista, se vuelve a importar y a montar
              acá, entre el encabezado y las fotos. */}

          <div className="cir-photos">
            <figure className="cir-photo reveal">
              <img src={FotoSala} alt="Asistentes con las manos levantadas durante el primer día presencial en Gold Coast" loading="lazy" />
            </figure>
            <figure className="cir-photo reveal">
              <img src={FotoDeclaraciones} alt="Asistentes de pie leyendo en voz alta sus hojas de trabajo" loading="lazy" />
            </figure>
            <figure className="cir-photo reveal">
              <img src={FotoHero} alt="La sala llena al cierre del primer día presencial" loading="lazy" />
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- PRECIO ---------- */}
      <section className="bc-sec" id="precio" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Qué cuesta</span>
            <h2>${PRECIOS[INDIVIDUAL].unico.anunciado} el año si entras solo. ${PRECIOS[PAREJA].unico.anunciado} si entras con alguien.</h2>
            <p>
              La de dos es para que entres con quien tú quieras: tu pareja, tu hermano, tu flatmate.
            </p>
          </div>

          <div className="cir-prices">
            <div className="cir-card">
              <span className="cir-card-name">Entro yo</span>
              <div className="cir-card-price">
                <sup>$</sup>{PRECIOS[INDIVIDUAL].unico.anunciado} <em>AUD</em>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '.95rem' }}>
                El año entero, un puesto.
              </p>
              <div className="cir-alt">
                <b>Y si de golpe no te da, son {NUMERO_CUOTAS} cuotas de $
                  {PRECIOS[INDIVIDUAL].cuotas.mensual} al mes.</b> El total queda en $
                {PRECIOS[INDIVIDUAL].cuotas.total}, y después del sexto cobro se para solo.
              </div>
              <button type="button" className="btn btn-emerald btn-block" onClick={elegir(INDIVIDUAL, 'unico')}>
                Quiero entrar al Círculo
              </button>
              <p className="cir-fee">
                ${PRECIOS[INDIVIDUAL].unico.anunciado} de una vez. En la pantalla de pago te va
                a aparecer ${PRECIOS[INDIVIDUAL].unico.cobro}: esos $
                {PRECIOS[INDIVIDUAL].unico.cobro - PRECIOS[INDIVIDUAL].unico.anunciado} son la
                comisión de la pasarela y no se quedan acá.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{ marginTop: 6 }}
                onClick={elegir(INDIVIDUAL, 'cuotas')}
              >
                Prefiero las {NUMERO_CUOTAS} cuotas de ${PRECIOS[INDIVIDUAL].cuotas.mensual}
              </button>
              <p className="cir-fee">
                El total en cuotas queda en ${PRECIOS[INDIVIDUAL].cuotas.total}. Ese{' '}
                {RECARGO_CUOTAS_PCT}% de más es por financiarlo.
              </p>
            </div>

            <div className="cir-card cir-card-dark">
              <span className="cir-card-flag">Trae a quien tú quieras</span>
              <span className="cir-card-name">Entro con alguien</span>
              <div className="cir-card-price">
                <sup>$</sup>{PRECIOS[PAREJA].unico.anunciado} <em>AUD</em>
              </div>
              <p style={{ color: 'rgba(246,241,231,.78)', fontSize: '.95rem' }}>
                El año entero, dos puestos. Sale a $
                {PRECIOS[PAREJA].unico.anunciado / 2} cada uno.
              </p>
              <div className="cir-alt">
                <b>Y si de golpe no les da, son {NUMERO_CUOTAS} cuotas de $
                  {PRECIOS[PAREJA].cuotas.mensual} al mes.</b> El total queda en $
                {PRECIOS[PAREJA].cuotas.total}, y después del sexto cobro se para solo.
              </div>
              <button type="button" className="btn btn-gold btn-block" onClick={elegir(PAREJA, 'unico')}>
                Quiero entrar al Círculo
              </button>
              <p className="cir-fee">
                ${PRECIOS[PAREJA].unico.anunciado} de una vez. En la pantalla de pago te va a
                aparecer ${PRECIOS[PAREJA].unico.cobro}: esos $
                {PRECIOS[PAREJA].unico.cobro - PRECIOS[PAREJA].unico.anunciado} son la comisión
                de la pasarela y no se quedan acá.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{ marginTop: 6, borderColor: 'rgba(246,241,231,.4)', color: 'var(--cream)' }}
                onClick={elegir(PAREJA, 'cuotas')}
              >
                Preferimos las {NUMERO_CUOTAS} cuotas de ${PRECIOS[PAREJA].cuotas.mensual}
              </button>
              <p className="cir-fee">
                El total en cuotas queda en ${PRECIOS[PAREJA].cuotas.total}. Ese{' '}
                {RECARGO_CUOTAS_PCT}% de más es por financiarlo.
              </p>
            </div>
          </div>

          {/* La renovación va explícita: elimina la objeción de "y el año que viene me
              vuelven a cobrar $1.000 completos". */}
          <div className="cir-renew reveal">
            <b>La renovación</b>
            <h3>El año dos te cuesta la mitad.</h3>
            <p>
              La mitad de lo que valga ese año, y con los presenciales de ese año incluidos.
              No me interesa que entres un año y te vayas. Te lo digo acá y no cuando toque
              renovar, porque sé que es la pregunta que te estás haciendo.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- PREGUNTAS FRECUENTES ---------- */}
      <section className="bc-sec" id="faq">
        <div className="wrap">
          <div className="bc-sec-head reveal">
            <span className="bc-eyebrow">Lo que más me preguntan</span>
            <h2>Antes de que me escribas a preguntar.</h2>
          </div>

          <div className="bc-faq">
            <details className="bc-qa">
              <summary>¿Tengo que saber de finanzas? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                No. <b>Si supieras, no te haría falta el Círculo.</b> No hay matemáticas raras:
                sumar, restar y sacar porcentajes. Lo que sí necesitas es estar dispuesto a
                mirar tus números y a decir en voz alta cómo vas, porque el año entero se
                apoya en eso.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Qué pasa al año? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Tu acceso es <b>un año entero desde el día que entras</b>. Al terminar decides
                tú: si sigues, el año dos te cuesta <b>la mitad</b> de lo que valga ese año, con
                los presenciales incluidos. Y si no sigues, no pasa nada. No hay renovación
                automática ni cobros sorpresa.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Puedo pagar en cuotas? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Sí. Son <b>{NUMERO_CUOTAS} pagos</b> de ${PRECIOS[INDIVIDUAL].cuotas.mensual} al
                mes si entras solo, o de ${PRECIOS[PAREJA].cuotas.mensual} si entran dos. El
                total queda en ${PRECIOS[INDIVIDUAL].cuotas.total} y $
                {PRECIOS[PAREJA].cuotas.total}: ese {RECARGO_CUOTAS_PCT}% de más es por
                financiarlo. <b>Después del sexto cobro se para solo</b> — no tienes que
                cancelar nada ni acordarte de nada. Y tu acceso es el año entero desde que
                entras, no seis meses.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Qué pasa si me cambio de ciudad o me voy del país? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                La comunidad, la sesión mensual del grupo y las sesiones uno a uno son en
                línea, así que <b>eso te sigue funcionando desde donde estés</b>. Lo presencial
                no te lo puedes llevar: el Bootcamp y el Cashflow son acá, en persona. Si te
                mudas dentro de Australia, avísame y cuadramos fechas. Y si te vas del país,
                escríbeme: no te voy a dejar pagando por algo que no puedes usar.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Puedo entrar con mi pareja o con un amigo? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Sí. Con la de <b>${PRECIOS[PAREJA].unico.anunciado} entran dos</b>, y es para
                que entres con quien tú quieras: tu pareja, tu hermano, tu mamá, un amigo, tu flatmate.
                Los dos entran completos al año. Y te
                digo algo que he visto: cuando las dos personas están adentro, la conversación
                de la plata en esa casa cambia por completo.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Qué pasa si mi visa cambia? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Es una de las razones por las que existe esto. Casi todos acá administramos
                plata sin saber en qué país vamos a estar en tres años, y eso cambia cómo se
                decide: cuánto te conviene tener disponible, cuánto tiene sentido comprometer
                a largo plazo, cómo se sostiene lo que mandas a casa.{' '}
                <b>Trabajamos con tu situación, no con una genérica.</b> Y si tu visa cambia y
                ya no puedes seguir, escríbeme y lo resolvemos como personas.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Cuánto tiempo me va a quitar a la semana? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Menos de lo que crees, porque está pensado para alguien que trabaja mucho. Una
                sesión de grupo al mes, el material nuevo cuando puedas verlo, y los
                presenciales con la fecha avisada con meses de antelación. <b>Lo que sí pide es
                  que hagas las cosas entre sesión y sesión</b>, y eso son ratos cortos.
              </div>
            </details>

            <details className="bc-qa">
              <summary>¿Es en español? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">Todo, de principio a fin.</div>
            </details>

            <details className="bc-qa">
              <summary>¿Y si entro y no es para mí? <span className="bc-pl">+</span></summary>
              <div className="bc-ans">
                Las condiciones están en los{' '}
                <a href="/terminos">términos y la política de reembolso</a>, en lenguaje llano
                y sin letra chiquita. Léelas antes de pagar, no después.
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
            <div><b>Las cuotas se paran solas</b><small>{NUMERO_CUOTAS} cobros y listo, sin cancelar nada.</small></div>
          </div>
          <div className="bc-tb-item">
            <div><b>Todo en español</b><small>El grupo, las sesiones y los presenciales.</small></div>
          </div>
        </div>
      </section>

      {/* ---------- CIERRE ---------- */}
      <section className="bc-final">
        <div className="wrap bc-inner">
          <span className="bc-eyebrow">Círculo Presencial</span>
          <h2>Lo que cambia una vida financiera no es saber más. <span className="bc-ital">Es que alguien se siente contigo.</span></h2>
          <p>
            Yo tampoco lo hice solo, y todavía no he llegado. La diferencia entre el año
            pasado y este no fue más información: fue tener a quién decirle en voz alta qué
            iba a hacer.
          </p>
          <button type="button" className="btn btn-gold btn-lg" onClick={irAComprar}>
            Quiero entrar al Círculo
          </button>
          <p className="bc-final-fee">
            ${PRECIOS[INDIVIDUAL].unico.anunciado} el año, o {NUMERO_CUOTAS} cuotas de $
            {PRECIOS[INDIVIDUAL].cuotas.mensual}. Un año entero desde el día que entras.
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
            © 2026 Revolución del Dinero · Jonathan González Botero · {BOOTCAMP_INCLUIDO.lugar}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Circulo;
