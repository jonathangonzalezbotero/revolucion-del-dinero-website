/**
 * /bootcamp/gracias — success_url de la Stripe Checkout Session del Bootcamp.
 *
 * El bono incluido es el curso "Proyección anual financiera" (CURSO_NOMBRE en
 * src/config/bootcamp.js). Los detalles de acceso se mandan por correo, así que acá solo
 * se anuncia. La sesión 1:1 de 30 minutos y su link de Calendly se retiraron en
 * septiembre de 2026: no vuelven a esta página.
 *
 * NO menciona ni enlaza la comunidad ni Skool: el Bootcamp no los incluye. Eso es del
 * Círculo Presencial ($1.000), y su tag `acceso-comunidad` no aparece en este código.
 *
 * El contacto en systeme.io ya existe desde antes del pago (api/bootcamp-lead.js) y
 * api/stripe-webhook.js lo reconfirma cuando Stripe avisa que el pago entró. Acá solo se
 * confirma la compra a la persona y se dispara el evento Purchase del píxel.
 *
 * Usa el mismo lenguaje visual que /bootcamp (Bootcamp.css): tarjeta oscura con
 * resplandor para la acción principal y datos prácticos en las mismas fichas.
 */

import { useEffect, useState } from 'react';
import './Bootcamp.css';
import Logo from '../assets/images/logo.webp';
import Seo from '../components/Seo';
import { BOOTCAMP_GRACIAS_TITLE, BOOTCAMP_GRACIAS_DESCRIPTION } from '../seoData';
import {
  CURSO_NOMBRE,
  EFECTIVO_DIA,
  FECHA_LARGA,
  FECHA_CORTA,
  HORARIO,
  REGISTRO,
  LUGAR,
  TIERS,
} from '../config/bootcamp';

function BootcampGracias() {
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nombreParam = (params.get('nombre') || '').trim();
    const tier = params.get('tier');
    const comprado = TIERS[tier] || TIERS['bootcamp-individual'];

    if (nombreParam) setNombre(nombreParam.split(/\s+/)[0]);

    // Purchase. El valor es lo que Stripe realmente cobró, no el precio anunciado.
    // Los eventos aparecen duplicados en las estadísticas del píxel porque la
    // Conversions API también está activa — es esperado, no hay que "arreglarlo".
    window.fbq?.('track', 'Purchase', {
      value: comprado.cobro,
      currency: 'AUD',
      content_name: comprado.nombre,
      content_category: 'bootcamp',
    });
  }, []);

  return (
    <div className="page-bootcamp">
      <Seo
        title={BOOTCAMP_GRACIAS_TITLE}
        description={BOOTCAMP_GRACIAS_DESCRIPTION}
        path="/bootcamp/gracias"
      />

      <div className="bc-ann">
        {FECHA_CORTA} · {LUGAR} · <b>Tu puesto está confirmado</b>
      </div>

      <section className="bc-thanks">
        <div className="wrap">
          <div className="bc-thanks-inner">
            <div className="bc-tick">✓</div>
            <h1>
              {nombre ? `Listo, ${nombre}. ` : 'Listo. '}
              <span className="accent ital">Tu puesto está confirmado.</span>
            </h1>
            <p className="bc-sub">
              Ya entró tu pago. En unos minutos te llega un correo con todos los detalles: si
              no lo ves, mira en la carpeta de spam.
            </p>

            <div className="bc-agenda-card">
              <span className="bc-badge">Va incluido en lo que acabas de pagar</span>
              <h2>El curso «{CURSO_NOMBRE}» es tuyo.</h2>
              <p>
                El sábado armas tu primer año proyectado conmigo. Con el curso aprendes a
                repetirlo cada año, tú solo, sin depender de nadie.
              </p>
              <div className="bc-scope">
                <b>Con el curso aprendes a:</b> proyectar tus ingresos y gastos de los doce
                meses, anticipar los meses difíciles, ponerle fecha a tus metas y ajustar el
                plan cuando la vida cambie.
              </div>
              <p className="bc-notis">
                Los detalles para acceder al curso te llegan al correo. Si en un rato no los
                ves, revisa la carpeta de spam o escríbeme.
              </p>
            </div>

            <div className="bc-practical">
              <div className="bc-prow">
                <span className="bc-ic">📅</span>
                <div>
                  <small>Fecha</small>
                  <b>{FECHA_LARGA}</b>
                </div>
              </div>
              <div className="bc-prow">
                <span className="bc-ic">🕒</span>
                <div>
                  <small>Horario</small>
                  <b>De {HORARIO}</b>
                  <span className="bc-psub">Llegas desde las {REGISTRO} y te registras sin prisa.</span>
                </div>
              </div>
              <div className="bc-prow">
                <span className="bc-ic">📍</span>
                <div>
                  <small>Lugar</small>
                  <b>{LUGAR}</b>
                  <span className="bc-psub">La dirección exacta y cómo llegar te llegan por correo antes del día.</span>
                </div>
              </div>
              <div className="bc-prow bc-prow-warn">
                <span className="bc-ic">💵</span>
                <div>
                  <small>Trae efectivo</small>
                  <b>${EFECTIVO_DIA} en billetes</b>
                  <span className="bc-psub">
                    Son para un ejercicio práctico que hacemos ese día. Cada persona trae los
                    suyos, y tienen que ser efectivo, no tarjeta.
                  </span>
                </div>
              </div>
              <div className="bc-prow bc-prow-warn">
                <span className="bc-ic">🍽️</span>
                <div>
                  <small>Almuerzo</small>
                  <b>No está incluido</b>
                  <span className="bc-psub">
                    Hay pausa para almorzar, pero la comida la pone cada uno. Trae algo o mira
                    antes qué hay cerca.
                  </span>
                </div>
              </div>
            </div>

            <p className="bc-close">
              Nos vemos el {FECHA_LARGA.toLowerCase()}. Trae tus números como estén y tus $
              {EFECTIVO_DIA} en efectivo. Para eso es el día.
            </p>
          </div>
        </div>
      </section>

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

export default BootcampGracias;
