import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import HeroPhoto from '../assets/images/Jonathan_06.webp';
import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import Seo from '../components/Seo';
import { HOME_TITLE, HOME_DESCRIPTION, HOME_JSON_LD, SKOOL_URL } from '../seoData';

const LOGO_URL = 'https://d1yei2z3i6k35z.cloudfront.net/17411220/69f4103eaf1164.06093873_REVOLUCIONDELDINERO-TRANSPARENT.png';

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

  useEffect(() => {
    document.body.style.overflow = mentorOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mentorOpen]);

  const openMentorModal = () => {
    setMentorSent(false);
    setMentorError('');
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
        body: JSON.stringify({ nombre, email, whatsapp }),
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
                <div className="hstat"><div className="num">50+</div><div className="lbl">asistentes en sus<br />eventos</div></div>
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
          <div className="stat reveal"><div className="n"><span className="accent">50+</span></div><div className="t">Asistentes en sus<br />eventos presenciales</div></div>
          <div className="stat reveal"><div className="n">6+</div><div className="t">Testimonios en video<br />de transformación real</div></div>
          <div className="stat reveal"><div className="n">3</div><div className="t">Negocios propios<br />en Colombia y Australia</div></div>
          <div className="stat reveal"><div className="n"><span className="accent">100%</span></div><div className="t">En español, para latinos</div></div>
        </div>
      </section>

      {/* MISSION */}
      <section className="sec mission">
        <div className="wrap mission-inner reveal">
          <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 26 }}>Por qué existe esto</span>
          <p className="big">El dinero no se trata de <em>cuánto ganas</em>. Se trata de las historias que cargas sobre él — historias heredadas que te frenan sin que te des cuenta. <em>Revolución del Dinero</em> existe para romper ese ciclo y darle a cada persona un camino claro hacia su libertad financiera.</p>
          <div className="sig">— Esa es mi misión de vida.</div>
        </div>
      </section>

      {/* MOVEMENT / PILLARS */}
      <section className="sec" id="metodo">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">El método</span>
            <h2>Tres pasos para cambiar tu relación con el dinero <span className="accent ital">para siempre.</span></h2>
            <p>Nadie nos enseñó a manejar el dinero. Por eso lo dividí en un camino simple que cualquiera puede seguir, sin importar cuánto ganes hoy.</p>
          </div>
          <div className="pillars">
            <div className="pillar reveal"><span className="step">01</span><div className="ic">🧠</div><h3>Reprograma tu mente</h3><p>Identifica exactamente qué creencias sobre el dinero te están costando hoy — y cámbialas por unas que te impulsen.</p></div>
            <div className="pillar reveal"><span className="step">02</span><div className="ic">📊</div><h3>Administra lo que ganas</h3><p>Un sistema simple para organizar tu dinero sin importar tus fuentes de ingreso.</p></div>
            <div className="pillar reveal"><span className="step">03</span><div className="ic">📈</div><h3>Invierte con confianza</h3><p>Da tus primeros pasos para hacer crecer tu dinero sin el miedo a perderlo todo, con un camino fácil de entender.</p></div>
          </div>
        </div>
      </section>

      <AboutSection />

      {/* OFFER LADDER */}
      <section className="sec" id="comunidad">
        <div className="wrap">
          <div className="sec-head center reveal">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Cómo trabajamos juntos</span>
            <h2>Elige tu punto de <span className="accent ital">partida.</span></h2>
            <p>Desde donde estés en el mundo, hay una forma de empezar tu revolución hoy.</p>
          </div>
          <div className="offers">
            <div className="offer feat reveal">
              <div className="top">
                <span className="kicker k-em">🌎 Empieza aquí</span>
                <h3>Programa online</h3>
              </div>
              <p className="desc">El corazón de esta comunidad. Aprende a tu ritmo, rodeado de personas que van en la misma dirección — sin importar donde te encuentres.</p>
              <ul>
                <li>Formación paso a paso en español</li>
                <li>Comunidad activa que te impulsa</li>
                <li>Recursos y plantillas prácticas</li>
                <li>Acceso directo a las sesiones en vivo</li>
              </ul>
              <div className="foot">
                <div className="price"><span className="free">$59 USD/mes</span></div>
                <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer" className="btn btn-emerald">Unirme en Skool →</a>
              </div>
            </div>
            <div className="offer reveal">
              <div className="top">
                <span className="kicker k-go">📍 En Australia</span>
                <h3>Taller de finanzas</h3>
              </div>
              <p className="desc">Aprende de finanzas personales y da tu primer paso real hacia la libertad financiera, junto a otros latinos.</p>
              <ul>
                <li>Reprograma tu mentalidad en vivo</li>
                <li>Sal con un plan claro y aplicable</li>
                <li>Conecta con una comunidad real</li>
                <li>Opción VIP: primera fila y Q&amp;A</li>
              </ul>
              <div className="foot">
                <div className="price"><span className="free">$10 AUD</span></div>
                <div className="price-note">Incluye a tu pareja o acompañante</div>
                <Link to="/evento" className="btn btn-ink">Registrarme al evento →</Link>
              </div>
            </div>
            <div className="offer reveal">
              <div className="top">
                <span className="kicker k-soon">🎯 Programa de 1 año</span>
                <h3>Comunidad RD</h3>
              </div>
              <p className="desc">Es un programa de acompañamiento de 12 meses, directamente conmigo, para transformar tu relación con el dinero paso a paso.</p>
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
            <h2>¿Estás en Australia? Ven a vivirlo en persona.</h2>
            <p>Un taller de finanzas donde darás tu primer paso real hacia la libertad financiera, junto a otras personas como tú que buscan mejorar su situación financiera.</p>
            <div className="when">
              <div><small>Fecha</small><b>12 de septiembre, 2026</b></div>
              <div><small>Lugar</small><b>Gold Coast</b></div>
              <div><small>Entrada</small><b>$10 AUD</b></div>
            </div>
            <p className="event-note">✨ Tu entrada incluye a tu pareja o un acompañante, sin costo extra.</p>
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
            <h2>Lo que quizás te estás <span className="accent ital">preguntando.</span></h2>
          </div>
          <div className="faq">
            <details className="qa reveal"><summary>¿Necesito estar en Australia para aprender de finanzas? <span className="pl">+</span></summary><div className="ans">No. El programa online es <b>global y 100% en español</b>. Puedes unirte y aprender desde cualquier país del mundo. Los eventos presenciales sí son en Australia, pero la comunidad no tiene fronteras.</div></details>
            <details className="qa reveal"><summary>No soy bueno con los números, ¿esto es para mí? <span className="pl">+</span></summary><div className="ans">Justamente para ti. Saldrás con las herramientas y la información necesarias para que eso deje de ser un problema. Te guío paso a paso para eliminar esa creencia de tu vida.</div></details>
            <details className="qa reveal"><summary>¿Cuánto cuesta unirme a la comunidad? <span className="pl">+</span></summary><div className="ans">Puedes empezar en el programa online por solo $59 USD/mes. Únete, conoce el espacio y comienza a aplicar lo que aprendas desde el primer día.</div></details>
            <details className="qa reveal"><summary>¿Qué voy a aprender exactamente? <span className="pl">+</span></summary><div className="ans">A reprogramar tu mente y mejorar tu relación con el dinero, a administrarlo de manera óptima y a dar los primeros pasos para lograr tranquilidad y libertad financiera.</div></details>
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
              <p>Sé parte de la comunidad Revolución del Dinero y empieza a construir tu libertad financiera y a vivir la vida que siempre has soñado</p>
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
