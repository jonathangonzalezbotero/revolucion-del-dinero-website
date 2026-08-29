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
          <h2>Manejé Uber, lavé platos y limpié oficinas. Todo eso también cuenta.</h2>
          <p>Llegué a Australia hace 6 años a aprender inglés y volverme a Colombia. Los primeros meses hice de todo: Uber, limpieza de oficinas, turnos en una warehouse, lavando platos en un restaurante. Sabía que era temporal, pero uno igual se cansa.</p>
          <p>Mi primer paso real hacia la tranquilidad financiera fue el día que empecé a trabajar como ingeniero de software. Ahí dejé de sobrevivir el mes y pude empezar a pensar. Hoy tengo dos negocios: <b className="hi">Héroes Colombia</b> allá, y <b className="hi">EasyAussie</b> acá en Australia.</p>
          <p>Llevo más de 10 años metido en el tema de las finanzas personales. Te lo digo con un número, que es más honesto que cualquier cosa: <span className="hi">hoy me faltan $1.500 al mes en ingresos que no dependan de mi trabajo</span> para poder decir que soy libre financieramente. Todavía no llego. Pero sé exactamente cuánto me falta, y eso es justo lo que quiero que tú tengas al salir del evento.</p>
          <p>En septiembre voy a dar una masterclass para LatinHub en Brisbane. Y el sábado 12, en Robina, va a estar la segunda edición de este evento.</p>
          <div className="sig">Jonathan González Botero</div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
