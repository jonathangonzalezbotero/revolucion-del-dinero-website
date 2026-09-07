/**
 * TestimonioTransformacion
 * ========================
 *
 * ⚠️ HUECO A PROPÓSITO. Este componente está maquetado y visible, con contenido
 * PLACEHOLDER marcado, esperando el testimonio que todavía no está grabado.
 *
 * El testimonio que falta es el que vende $1.000: una miembro que en junio de 2026 pagaba
 * el mercado a plazos y diez semanas después había cancelado sus tarjetas, pagado su
 * deuda y abierto un ahorro — sin ganar un peso más. Los seis videos del primer evento
 * prueban que la sala funciona; este prueba que el año funciona, y son cosas distintas.
 *
 * CÓMO RELLENARLO (Jonathan)
 *   1. Graba el testimonio en video y ponlo en public/videos/ junto a los demás, con su
 *      poster .webp, siguiendo la convención que ya existe (07-transformacion.mp4 +
 *      07-transformacion-poster.webp).
 *   2. Rellena TESTIMONIO abajo: `cita`, `nombre`, `contexto` y, si hay video, `video` y
 *      `poster`.
 *   3. Cambia PENDIENTE a false.
 *
 * Con PENDIENTE en true la sección se ve como un hueco declarado, no como una promesa:
 * ni la cita ni el nombre se presentan como reales. Eso es deliberado — publicar un
 * testimonio inventado en la página del producto de $1.000 es exactamente el tipo de cosa
 * que no se hace.
 *
 * 🔴 Al rellenarlo, dos reglas:
 *   · Ningún detalle identificable. Con siete personas en el grupo, "una mujer que
 *     trabaja en limpieza y tiene un hermano de 17" es un nombre propio.
 *   · Nada que suene a rentabilidad, retorno ni producto financiero. El testimonio va de
 *     deudas, hábitos y organización de cuentas, que es lo que el producto trabaja.
 */

import './TestimonioTransformacion.css';

const PENDIENTE = true;

const TESTIMONIO = {
  // Placeholder. No es una cita real y no se presenta como tal mientras PENDIENTE sea true.
  cita: 'Acá va, en sus palabras, qué había cambiado diez semanas después: qué dejó de pagar a plazos, qué deuda cerró y qué empezó a guardar, ganando lo mismo que antes.',
  nombre: 'Nombre de la miembro',
  contexto: 'Miembro del Círculo desde junio de 2026',
  video: null,
  poster: null,
};

function TestimonioTransformacion({ id = 'transformacion' }) {
  return (
    <div className="cir-transf" id={id}>
      {PENDIENTE && (
        <span className="cir-transf-todo">
          Pendiente · testimonio por grabar
        </span>
      )}

      <blockquote className="cir-transf-quote">
        «{TESTIMONIO.cita}»
      </blockquote>

      {TESTIMONIO.video && (
        <video
          className="cir-transf-video"
          src={TESTIMONIO.video}
          poster={TESTIMONIO.poster || undefined}
          controls
          playsInline
        />
      )}

      <div className="cir-transf-meta">
        <div className="cir-transf-avatar">
          {PENDIENTE ? '—' : (TESTIMONIO.nombre.trim()[0] || '—')}
        </div>
        <div>
          <b>{TESTIMONIO.nombre}</b>
          <small>{TESTIMONIO.contexto}</small>
        </div>
      </div>

      {PENDIENTE && (
        <p className="cir-transf-help">
          Este bloque está maquetado y listo. Para publicarlo, rellena{' '}
          <code>TESTIMONIO</code> en{' '}
          <code>src/components/TestimonioTransformacion.js</code> y cambia{' '}
          <code>PENDIENTE</code> a <code>false</code>. Mientras siga en{' '}
          <code>true</code>, nada de lo de arriba se presenta como una cita real.
        </p>
      )}
    </div>
  );
}

export default TestimonioTransformacion;
