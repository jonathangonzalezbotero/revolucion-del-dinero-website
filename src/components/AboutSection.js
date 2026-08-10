import { useState } from 'react';
import './AboutSection.css';
import Jonathan01 from '../assets/images/Jonathan_01.webp';
import Jonathan02 from '../assets/images/Jonathan_02.webp';
import Jonathan03 from '../assets/images/Jonathan_03.webp';
import Jonathan04 from '../assets/images/Jonathan_04.webp';
import Jonathan05 from '../assets/images/Jonathan_05.webp';
import Jonathan06 from '../assets/images/Jonathan_06.webp';

const ABOUT_PHOTOS = [Jonathan04, Jonathan02, Jonathan03, Jonathan05, Jonathan06, Jonathan01];

function AboutCarousel({ photos, alt }) {
  const [index, setIndex] = useState(0);

  const go = (i) => setIndex((i + photos.length) % photos.length);

  const onTouchStart = (e) => {
    onTouchStart.x = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - onTouchStart.x;
    if (dx > 40) go(index - 1);
    else if (dx < -40) go(index + 1);
  };

  return (
    <div className="about-carousel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {photos.map((src, i) => (
        <img key={src} src={src} alt={alt} className={i === index ? 'active' : ''} />
      ))}
      {photos.length > 1 && (
        <>
          <button type="button" className="car-arrow prev" aria-label="Foto anterior" onClick={() => go(index - 1)}>‹</button>
          <button type="button" className="car-arrow next" aria-label="Foto siguiente" onClick={() => go(index + 1)}>›</button>
          <div className="car-dots">
            {photos.map((_, i) => (
              <button
                type="button"
                key={i}
                className={i === index ? 'active' : ''}
                aria-label={`Ir a la foto ${i + 1}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AboutSection({ id = 'sobre-mi' }) {
  return (
    <section className="sec" id={id} style={{ background: 'var(--paper)' }}>
      <div className="wrap about-grid">
        <div className="about-photo reveal">
          <AboutCarousel photos={ABOUT_PHOTOS} alt="Jonathan González en un evento de Revolución del Dinero" />
          <div className="tag">Construyendo <b>comunidad</b></div>
        </div>
        <div className="about-body reveal">
          <span className="eyebrow">Hola, soy Jonathan</span>
          <h2>Llegué a Australia para cambiar mi vida. Hoy ayudo a otros a cambiar la suya.</h2>
          <p>Hace 6 años llegué con la intención de aprender inglés y volver a Colombia a seguir mi profesión — como muchos de nosotros.</p>
          <p>Recuerdo viajar a Nueva York con mi papá y recoger tarjetas del metro del piso para ahorrarnos el pasaje. En ese momento no lo cuestioné: era lo normal. Hoy sé que <span className="hi">esas historias que cargamos sobre el dinero son exactamente lo que nos frena</span> — no la falta de esfuerzo, ni de inteligencia.</p>
          <p>Mi pasión siempre ha sido el deporte, los negocios y las finanzas. Hoy tengo multiples negocios y una sola misión: impactar la vida de las personas que, como yo, <b className="hi">sueñan en grande</b>.</p>
          <div className="sig">Jonathan González Botero</div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
