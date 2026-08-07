import { useState } from 'react';
import './TestimonialsSection.css';

const TESTIMONIAL_VIDEOS = [
  { src: '/videos/05-testimonial.mp4', poster: '/videos/05-testimonial-poster.webp', name: 'Juan David' },
  { src: '/videos/01-testimonial.mp4', poster: '/videos/01-testimonial-poster.webp', name: 'Maria Isabel' },
  { src: '/videos/02-testimonial.mp4', poster: '/videos/02-testimonial-poster.webp', name: 'Gustavo Meneses' },
  { src: '/videos/03-testimonial.mp4', poster: '/videos/03-testimonial-poster.webp', name: 'Gina Robayo' },
  { src: '/videos/04-testimonial.mp4', poster: '/videos/04-testimonial-poster.webp', name: 'Erika Pachon' },
  { src: '/videos/06-testimonial.mp4', poster: '/videos/06-testimonial-poster.webp', name: 'Estefania Lopera' },
];

function VideoTestimonial({ src, poster, name }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="vtcard reveal">
      {playing ? (
        <video src={src} poster={poster} controls autoPlay playsInline />
      ) : (
        <button type="button" className="vtcard-poster" onClick={() => setPlaying(true)} aria-label={`Reproducir testimonio de ${name}`}>
          <img src={poster} alt={`Testimonio en video de ${name}`} loading="lazy" />
          <span className="vt-play">▶</span>
        </button>
      )}
      <div className="vt-name">{name}</div>
    </div>
  );
}

function TestimonialsSection({ id = 'testimonios' }) {
  return (
    <section className="sec" id={id} style={{ background: 'var(--sand)' }}>
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>Historias reales</span>
          <h2>Lo que pasa cuando cambias tu relación <span className="accent ital">con el dinero.</span></h2>
        </div>
        <div className="vtcards">
          {TESTIMONIAL_VIDEOS.map((t) => (
            <VideoTestimonial key={t.src} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
