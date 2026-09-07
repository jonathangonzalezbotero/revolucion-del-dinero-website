/**
 * /bootcamp/gracias — success_url de la Stripe Checkout Session del Bootcamp.
 *
 * Es el ÚNICO sitio donde aparece el link de Calendly para agendar la sesión de 30
 * minutos: quien no ha pagado no debe poder agendar. El link vive en la constante
 * LINK_AGENDA (src/config/bootcamp.js), no repetido acá.
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
  LINK_AGENDA,
  LIMITE_SESION,
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
              no lo ves, mira en la carpeta de spam. Y hoy te queda una sola cosa por hacer.
            </p>

            <div className="bc-agenda-card">
              <span className="bc-badge">Va incluido en lo que acabas de pagar</span>
              <h2>Agenda tu media hora conmigo.</h2>
              <p>
                Media hora, tú y yo solos, cuando quieras antes del Bootcamp. Eliges tú el día
                y la hora.
              </p>
              <div className="bc-scope">
                <b>Para ordenar tu punto de partida:</b> tu presupuesto, tus deudas, tus
                hábitos y cómo tienes repartidas tus cuentas.
              </div>
              <a
                className="btn btn-gold btn-block btn-lg"
                href={LINK_AGENDA}
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar mi media hora
              </a>
              <p className="bc-notis">
                La puedes usar hasta el {LIMITE_SESION}, el día del Bootcamp. Mientras más
                pronto la agendes, más tiempo tienes para trabajar con lo que salga de ahí. No
                es asesoría sobre productos financieros — para eso hay profesionales
                licenciados y te digo a quién preguntarle.
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
              Nos vemos el {FECHA_LARGA.toLowerCase()}. Trae tus números como estén. Para eso
              es el día.
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
