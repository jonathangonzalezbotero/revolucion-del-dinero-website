import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import HeroPhoto from '../assets/images/Jonathan_06.webp';
import Logo from '../assets/images/logo.webp';
import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import Seo from '../components/Seo';
import { HOME_TITLE, HOME_DESCRIPTION, HOME_JSON_LD, SKOOL_URL } from '../seoData';

const LOGO_URL = Logo;

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useRevealOnScroll();

  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorSent, setMentorSent] = useState(false);
  const [mentorSending, setMentorSending] = useState(false);
  const [mentorError, setMentorError] = useState('');
  const [mentorFirstName, setMentorFirstName] = useState('');
  const mentorFormRef = useRef(null);
  const mentorNombreRef = useRef(null);
  const mentorEmailRef = useRef(null);
  const mentorTelRef = useRef(null);
  // Anti-spam, both invisible to the visitor: a decoy field only a bot would fill, and the
  // moment the form was opened, which the server uses to reject instant submissions.
  const mentorHoneypotRef = useRef(null);
  const mentorStartedAtRef = useRef(0);

  useEffect(() => {
    document.body.style.overflow = mentorOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mentorOpen]);

  const openMentorModal = () => {
    setMentorSent(false);
    setMentorError('');
    mentorStartedAtRef.current = Date.now();
    setMentorOpen(true);
  };

  const handleMentorSubmit = async (e) => {
    e.preventDefault();
    const nombre = mentorNombreRef.current.value.trim();
    const email = mentorEmailRef.current.value.trim();
    const whatsapp = mentorTelRef.current.value.trim();
    if (!nombre || !email || !whatsapp) {
      mentorFormRef.current.reportValidity();
      return;
    }
    setMentorSending(true);
    setMentorError('');
    try {
      const res = await fetch('/api/mentor-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email,
          whatsapp,
          empresa: mentorHoneypotRef.current?.value || '',
          startedAt: mentorStartedAtRef.current,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo enviar la solicitud.');
      }
      setMentorFirstName(nombre.split(' ')[0]);
      setMentorSent(true);
    } catch (err) {
      setMentorError(err.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setMentorSending(false);
    }
  };

  return (
    <div className="page-home">
      <Seo title={HOME_TITLE} description={HOME_DESCRIPTION} path="/" jsonLd={HOME_JSON_LD} />

      <header id="hdr" className={scrolled ? 'scrolled' : ''}>
        <div className="wrap nav">
          <a href="#top">
            <img className="logo" src={LOGO_URL} alt="Revolución del Dinero" />
          </a>
          <nav className={`nav-links${menuOpen ? ' open' : ''}`}>
            <a href="#sobre-mi" onClick={() => setMenuOpen(false)}>Sobre mí</a>
            <a href="#metodo" onClick={() => setMenuOpen(false)}>El método</a>
            <a href="#comunidad" onClick={() => setMenuOpen(false)}>Comunidad</a>
            <a href="#testimonios" onClick={() => setMenuOpen(false)}>Historias</a>
            <Link to="/evento">Evento</Link>
          </nav>
          <div className="nav-cta">
            <Link to="/evento" className="btn btn-outline">Taller de finanzas</Link>
            <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer" className="btn btn-emerald">Unirme a la comunidad</a>
          </div>
          <div className="burger" onClick={() => setMenuOpen((o) => !o)}>
            <span></span><span></span><span></span>
          </div>
        </div>
      </header>

      <div id="top"></div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <img src={HeroPhoto} alt="Jonathan González hablando en un evento presencial de Revolución del Dinero" />
        </div>
        <div className="wrap hero-grid">
          <div className="hero-copy reveal">
            <h1>Es hora de hacer tu propia <span className="ital">revolución</span> <span className="u">del dinero.</span></h1>
            {/* <p className="lead">Soy Jonathan González. Te ayudo a reprogramar tu mente, administrar lo que ganas e invertir con confianza — para que dejes de trabajar 50–60 horas y aun así sentir que el dinero no alcanza.</p> */}
            <div className="hero-cta">
              {/* <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer" className="btn btn-emerald btn-lg">Unirme a la comunidad <span className="ar">→</span></a> */}
              <Link to="/evento" className="btn btn-outline btn-lg">Asistir al taller de finanzas</Link>
            </div>
          </div>
          <div className="hero-visual reveal">
            <div className="hero-glass">
              <div className="badge-row">
                <span className="badge-pill">En español ✦</span>
                <span className="badge-pill">Para latinos ✦</span>
              </div>
              <div className="hero-stats">
                <div className="hstat"><div className="num">50+</div><div className="lbl">personas en el<br />primer evento</div></div>
                <div className="hstat"><div className="num">6 años</div><div className="lbl">construyendo<br />en Australia</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="track">
          <span>Revoluciona tu dinero</span><span>Reprograma tu mente</span><span>Construye tu libertad</span>
          <span>Revoluciona tu dinero</span><span>Reprograma tu mente</span><span>Construye tu libertad</span>
        </div>
      </div>

      {/* STATS */}
      <section className="stats">
        <div className="wrap stats-grid">
          <div className="stat reveal"><div className="n"><span className="accent">50+</span></div><div className="t">Personas en el primer<br />evento presencial</div></div>
          <div className="stat reveal"><div className="n">6</div><div className="t">Testimonios en video<br />de quienes ya vinieron</div></div>
          <div className="stat reveal"><div className="n">2</div><div className="t">Negocios propios<br />en Colombia y Australia</div></div>
          <div className="stat reveal"><div className="n"><span className="accent">100%</span></div><div className="t">En español, para latinos</div></div>
        </div>
      </section>

      {/* MISSION */}
      <section className="sec mission">
        <div className="wrap mission-inner reveal">
          <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 26 }}>Por qué existe esto</span>
          <p className="big">A casi ninguno de nosotros le enseñaron esto en la casa. Lo aprendimos mirando: cómo hablaban tus papás de la plata, qué se decía en la mesa el mes que no alcanzaba, qué te dijeron cuando te fuiste. Todo eso se queda, y termina decidiendo por ti mucho más que <em>cuánto ganas</em>. <em>Revolución del Dinero</em> existe para que puedas mirarlo de frente y decidir tú.</p>
          <div className="sig">Esa es mi misión de vida.</div>
        </div>
      </section>

      {/* MOVEMENT / PILLARS */}
      <section className="sec" id="metodo">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">El método</span>
            <h2>Tres pasos, y <span className="accent ital">en este orden.</span></h2>
            <p>No hace falta ganar más para arrancar. Hace falta saber qué está pasando con lo que ya entra.</p>
          </div>
          <div className="pillars">
            <div className="pillar reveal"><span className="step">01</span><div className="ic">🧠</div><h3>Reprograma tu mente</h3><p>Qué creencias sobre la plata traes de tu casa y cuáles te están costando dinero hoy. Va primero porque sin esto lo demás no se sostiene.</p></div>
            <div className="pillar reveal"><span className="step">02</span><div className="ic">📊</div><h3>Administra lo que ganas</h3><p>Un sistema simple para repartir lo que entra, sea mucho o poco, y venga de uno o de tres lados.</p></div>
            <div className="pillar reveal"><span className="step">03</span><div className="ic">📈</div><h3>Invierte con confianza</h3><p>Tus primeros pasos para que la plata crezca, explicados de forma que se entiendan y sin el miedo a perderlo todo.</p></div>
          </div>
        </div>
      </section>

      <AboutSection />

      {/* OFFER LADDER */}
      <section className="sec" id="comunidad">
        <div className="wrap">
          <div className="sec-head center reveal">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Cómo trabajamos juntos</span>
            <h2>Por dónde puedes <span className="accent ital">empezar.</span></h2>
            <p>Tres formas de entrar, según dónde estés viviendo y qué tanto te quieras meter.</p>
          </div>
          <div className="offers">
            <div className="offer feat reveal">
              <div className="top">
                <span className="kicker k-em">🌎 Empieza aquí</span>
                <h3>Círculo Online</h3>
              </div>
              <p className="desc">Para latinos que viven fuera de su país, estén donde estén. Aprendes a tu ritmo, con gente que va en la misma dirección. Es la puerta de entrada más fácil si no estás en Australia.</p>
              <ul>
                <li>Formación paso a paso en español</li>
                <li>Comunidad activa que te impulsa</li>
                <li>Recursos y plantillas prácticas</li>
                <li>Acceso directo a las sesiones en vivo</li>
              </ul>
              <div className="foot">
                <div className="price"><span className="free">$50 USD/mes</span></div>
                <div className="price-note">O $500 USD al año</div>
                <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer" className="btn btn-emerald">Unirme en Skool →</a>
              </div>
            </div>
            <div className="offer reveal">
              <div className="top">
                <span className="kicker k-go">📍 En Australia</span>
                <h3>Taller de finanzas</h3>
              </div>
              <p className="desc">Una tarde presencial en Gold Coast para dar el primer paso en serio, con otros latinos que están en lo mismo que tú.</p>
              <ul>
                <li>Los cuatro pilares, trabajados en vivo</li>
                <li>Sales con tu plan escrito, no con apuntes</li>
                <li>Conoces gente que va en la misma dirección</li>
                <li>Opción VIP: workbook impreso, primera fila y Q&amp;A</li>
              </ul>
              <div className="foot">
                <div className="price"><span className="free">$10 AUD</span></div>
                <div className="price-note">Admite 2 personas · lo recaudado en entradas se dona a Colombia</div>
                <Link to="/evento" className="btn btn-ink">Registrarme al evento →</Link>
              </div>
            </div>
            <div className="offer reveal">
              <div className="top">
                <span className="kicker k-soon">🎯 Programa de 1 año</span>
                <h3>Círculo Presencial</h3>
              </div>
              <p className="desc">Doce meses de acompañamiento directo conmigo, en Australia, para trabajar esto a fondo y no solo enterarte de que existe.</p>
              <ul>
                <li>12 meses de acompañamiento continuo</li>
                <li>Acceso a eventos exclusivos</li>
                <li>Encuentro mensual en grupo</li>
                <li>Seguimiento cercano de tu progreso</li>
              </ul>
              <div className="foot">
                <div className="price">Programa de 12 meses</div>
                <div className="price-note">Cupos limitados · Por solicitud</div>
                <button type="button" className="btn btn-outline" onClick={openMentorModal}>Escribeme →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* EVENT */}
      <section className="sec event">
        <div className="wrap event-grid">
          <div className="reveal">
            <span className="au">📍 Evento presencial · Gold Coast, Australia</span>
            <h2>¿Estás en Australia? Nos vemos el sábado 12.</h2>
            <p>Tres horas y media de taller para mirar tu plata de frente: de dónde viene, en qué se te va, y qué vas a hacer distinto a partir del lunes. Te vas con tu plan escrito de tu puño y letra.</p>
            <div className="when">
              <div><small>Fecha</small><b>Sáb 12 de sept., 2026</b></div>
              <div><small>Hora</small><b>3:00 a 6:30 pm</b></div>
              <div><small>Lugar</small><b>Robina Events Centre</b></div>
              <div><small>Entrada</small><b>$10 AUD</b></div>
            </div>
            <p className="event-note">✨ Tu entrada admite dos personas, así que tu pareja o un amigo entra sin pagar de más. Y todo lo que se recaude en entradas se va para las familias afectadas por el terremoto en Colombia.</p>
          </div>
          <div className="event-actions reveal">
            <Link to="/evento" className="btn btn-gold btn-lg">Registrarme · $10 AUD →</Link>
            <Link to="/evento" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(246,241,231,.4)', color: 'var(--cream)' }}>Ver detalles</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head center reveal">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Preguntas frecuentes</span>
            <h2>Lo que más me <span className="accent ital">preguntan.</span></h2>
          </div>
          <div className="faq">
            <details className="qa reveal"><summary>¿Necesito estar en Australia? <span className="pl">+</span></summary><div className="ans">Para el Círculo Online, no. Es <b>100% en español</b> y puedes entrar desde cualquier país. Los eventos presenciales y el Círculo Presencial sí son acá en Australia.</div></details>
            <details className="qa reveal"><summary>No soy bueno con los números, ¿esto es para mí? <span className="pl">+</span></summary><div className="ans">Esa frase es de las primeras que revisamos, porque casi siempre viene de la casa y no de la realidad. No hay matemáticas complicadas acá: sumar, restar y sacar porcentajes.</div></details>
            <details className="qa reveal"><summary>¿Cuánto cuesta unirme? <span className="pl">+</span></summary><div className="ans">El Círculo Online cuesta <b>$50 USD al mes</b>, o $500 al año si prefieres pagarlo de una. El taller presencial son $10 AUD y admite dos personas.</div></details>
            <details className="qa reveal"><summary>¿Qué voy a aprender exactamente? <span className="pl">+</span></summary><div className="ans">Las creencias sobre el dinero que traes de tu casa, qué es libertad financiera y cuál es tu número, cómo repartir lo que ganas cada mes, y cómo construir tu fondo de emergencia desde cero.</div></details>
          </div>
        </div>
      </section>

      {/* JOIN / FINAL CTA */}
      <section className="sec join">
        <div className="wrap">
          <div className="join-card reveal">
            <div className="inner">
              <span className="eyebrow" style={{ justifyContent: 'center', color: '#f4c56a', marginBottom: 20 }}>Tu revolución empieza hoy</span>
              <h2>Únete a los que decidieron <span className="ital">tomar el control.</span></h2>
              <p>Adentro vas a encontrar el contenido, los encuentros en vivo y gente que está haciendo exactamente lo mismo que tú. Eso último es lo que más cuesta encontrar solo.</p>
              <div className="join-cta">
                <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-lg">Unirme a la comunidad →</a>
                <Link to="/evento" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(246,241,231,.4)', color: 'var(--cream)' }}>Asistir al evento · $10 AUD</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap foot">
          <div className="col">
            <img className="logo" src={LOGO_URL} alt="Revolución del Dinero" />
            <p>Educación financiera en español. Reprograma tu mente, administra tu dinero e invierte con confianza.</p>
          </div>
          <div className="links">
            <div className="grp">
              <b>Explora</b>
              <a href="#sobre-mi">Sobre mí</a>
              <a href="#metodo">El método</a>
              <a href="#comunidad">Comunidad</a>
              <a href="#testimonios">Historias</a>
            </div>
            <div className="grp">
              <b>Empieza</b>
              <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer">Comunidad en Skool</a>
              <Link to="/evento">Evento presencial</Link>
            </div>
          </div>
          <div className="cr">© 2026 Revolución del Dinero · Jonathan González Botero · Educación financiera en español para latinos en todo el mundo.</div>
        </div>
      </footer>

      {/* MENTORSHIP REQUEST-A-CALL MODAL */}
      <div className={`mentor-overlay${mentorOpen ? ' show' : ''}`}>
        <div className="mentor-modal">
          <button type="button" className="mentor-close" aria-label="Cerrar" onClick={() => setMentorOpen(false)}>✕</button>
          {mentorSent ? (
            <div className="mentor-thanks">
              <div className="tick">✓</div>
              <h3>¡Listo, {mentorFirstName}!</h3>
              <p className="sub">Recibí tu solicitud. Te voy a llamar personalmente por WhatsApp en los próximos días para conocer tu situación y contarte en detalle cómo funciona el programa de mentoría de 1 año.</p>
              <button type="button" className="btn btn-ink" onClick={() => setMentorOpen(false)}>Listo, cerrar</button>
            </div>
          ) : (
            <>
              <h3>Hablemos!</h3>
              <p className="sub">Completa tus datos y hablamos personalmente para conocer tu situación y contarte cómo funciona el programa de mentoría de 1 año.</p>
              <form ref={mentorFormRef} onSubmit={handleMentorSubmit} noValidate>
                <div className="mentor-field"><label htmlFor="mentor-nombre">Nombre completo</label><input id="mentor-nombre" type="text" placeholder="Tu nombre y apellido" ref={mentorNombreRef} required /></div>
                <div className="mentor-field"><label htmlFor="mentor-email">Correo electrónico</label><input id="mentor-email" type="email" placeholder="tucorreo@ejemplo.com" ref={mentorEmailRef} required /></div>
                <div className="mentor-field"><label htmlFor="mentor-tel">WhatsApp / Teléfono</label><input id="mentor-tel" type="tel" placeholder="+61 ..." ref={mentorTelRef} required /></div>
                {/* Honeypot: positioned off-screen rather than display:none, which bots skip.
                    Hidden from assistive tech and from tab order, so nobody real ever meets it. */}
                <div className="mentor-hp" aria-hidden="true">
                  <label htmlFor="mentor-empresa">Empresa</label>
                  <input id="mentor-empresa" type="text" tabIndex={-1} autoComplete="off" ref={mentorHoneypotRef} />
                </div>
                {mentorError && <p className="mentor-error">{mentorError}</p>}
                <button type="submit" className="btn btn-emerald" disabled={mentorSending}>
                  {mentorSending ? 'Enviando…' : 'Enviar solicitud →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
