/**
 * /circulo/gracias — success_url de la Stripe Checkout Session del Círculo.
 *
 * Es uno de los dos únicos sitios donde aparece el link de Calendly (el otro es
 * /bootcamp/gracias): quien no ha pagado no debe poder agendar. El link vive en
 * LINK_AGENDA (src/config/agenda.js), compartido entre los dos productos.
 *
 * Esta página NO manda el link de acceso a la comunidad. Lo manda systeme.io por email
 * al recibir el tag `acceso-comunidad`, que api/circulo-lead.js aplicó antes del pago y
 * api/stripe-webhook.js reconfirma cuando Stripe avisa que el cobro entró.
 *
 * Si la compra fue en cuotas, lo dice con claridad: cuántos pagos son, de cuánto, y que
 * después del sexto se para solo. A ese ticket, la duda de "¿me van a seguir cobrando?"
 * es la primera que aparece.
 */

import { useEffect, useState } from 'react';
import './Bootcamp.css';
import './Circulo.css';
import Logo from '../assets/images/logo.webp';
import Seo from '../components/Seo';
import { CIRCULO_GRACIAS_TITLE, CIRCULO_GRACIAS_DESCRIPTION, DISCLAIMER_AFSL } from '../seoData';
import { LINK_AGENDA } from '../config/agenda';
import { PRECIOS, NUMERO_CUOTAS, BOOTCAMP_INCLUIDO } from '../config/circulo';

function CirculoGracias() {
  const [nombre, setNombre] = useState('');
  const [compra, setCompra] = useState({ tier: 'circulo-individual', plan: 'unico' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nombreParam = (params.get('nombre') || '').trim();
    const tier = PRECIOS[params.get('tier')] ? params.get('tier') : 'circulo-individual';
    const plan = params.get('plan') === 'cuotas' ? 'cuotas' : 'unico';

    if (nombreParam) setNombre(nombreParam.split(/\s+/)[0]);
    setCompra({ tier, plan });

    // Purchase. El valor es lo que Stripe realmente cobra: el importe con la comisión en
    // pago único, o la primera mensualidad en cuotas.
    //
    // Los eventos aparecen duplicados en las estadísticas del píxel porque la Conversions
    // API también está activa — es esperado, no hay que "arreglarlo".
    const p = PRECIOS[tier];
    window.fbq?.('track', 'Purchase', {
      value: plan === 'cuotas' ? p.cuotas.mensual : p.unico.cobro,
      currency: 'AUD',
      content_name: `Circulo Presencial · ${p.nombre} · ${plan === 'cuotas' ? 'cuotas' : 'pago unico'}`,
      content_category: 'circulo-presencial',
    });
  }, []);

  const p = PRECIOS[compra.tier];
  const esCuotas = compra.plan === 'cuotas';

  return (
    <div className="page-bootcamp page-circulo">
      <Seo
        title={CIRCULO_GRACIAS_TITLE}
        description={CIRCULO_GRACIAS_DESCRIPTION}
        path="/circulo/gracias"
      />

      <div className="bc-ann">
        Círculo Presencial · <b>Ya estás adentro</b>
      </div>

      <section className="bc-thanks">
        <div className="wrap">
          <div className="bc-thanks-inner">
            <div className="bc-tick">✓</div>
            <h1>
              {nombre ? `Bienvenido, ${nombre}. ` : 'Bienvenido. '}
              <span className="accent ital">Ya estás adentro.</span>
            </h1>
            <p className="bc-sub">
              Entró tu pago y tu puesto está confirmado por <b>un año entero desde hoy</b>. En
              unos minutos te llega el correo de bienvenida con el link para entrar a la
              comunidad: si no lo ves, mira en la carpeta de spam.
            </p>

            {/* La duda número uno a este ticket: "¿me van a seguir cobrando?" */}
            <div className="bc-practical" style={{ marginBottom: 28 }}>
              <div className="bc-prow">
                <span className="bc-ic">🎟️</span>
                <div>
                  <small>Lo que compraste</small>
                  <b>Círculo Presencial · {p.nombre}</b>
                  <span className="bc-psub">Un año entero, desde hoy.</span>
                </div>
              </div>
              <div className="bc-prow bc-prow-warn">
                <span className="bc-ic">{esCuotas ? '🔁' : '💳'}</span>
                <div>
                  <small>Tu pago</small>
                  {esCuotas ? (
                    <>
                      <b>{NUMERO_CUOTAS} pagos de ${p.cuotas.mensual} al mes</b>
                      <span className="bc-psub">
                        El primero ya entró. Quedan {NUMERO_CUOTAS - 1}, y después del sexto{' '}
                        <b>se para solo</b>: no tienes que cancelar nada ni acordarte de nada.
                        El total queda en ${p.cuotas.total}.
                      </span>
                    </>
                  ) : (
                    <>
                      <b>Un pago de ${p.unico.cobro}</b>
                      <span className="bc-psub">
                        Listo, no hay más cobros. Y no hay renovación automática.
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bc-agenda-card">
              <span className="bc-badge">Tu primer paso</span>
              <h2>Agenda tu primera sesión conmigo.</h2>
              <p>
                Empezamos por acá: tú y yo solos, para ver dónde estás y por dónde arrancamos
                tu año. Eliges tú el día y la hora.
              </p>
              <div className="bc-scope">
                <b>Tu presupuesto, tus deudas, tus hábitos y cómo tienes repartidas tus
                cuentas.</b> Con nombres y con números, no en general.
              </div>
              <a
                className="btn btn-gold btn-block btn-lg"
                href={LINK_AGENDA}
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar mi primera sesión
              </a>
              <p className="bc-notis">
                Mientras más pronto la agendes, más pronto arranca tu año con un punto de
                partida claro.
              </p>
            </div>

            <div className="bc-sec-head reveal" style={{ marginBottom: 20 }}>
              <span className="bc-eyebrow">Lo que viene</span>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                Tu siguiente fecha: el Bootcamp, incluido.
              </h2>
            </div>

            <div className="bc-practical">
              <div className="bc-prow">
                <span className="bc-ic">📅</span>
                <div>
                  <small>Fecha</small>
                  <b>{BOOTCAMP_INCLUIDO.fecha}</b>
                </div>
              </div>
              <div className="bc-prow">
                <span className="bc-ic">🕒</span>
                <div>
                  <small>Horario</small>
                  <b>De {BOOTCAMP_INCLUIDO.horario}</b>
                  <span className="bc-psub">Llegas desde las {BOOTCAMP_INCLUIDO.registro} y te registras sin prisa.</span>
                </div>
              </div>
              <div className="bc-prow">
                <span className="bc-ic">📍</span>
                <div>
                  <small>Lugar</small>
                  <b>{BOOTCAMP_INCLUIDO.lugar}</b>
                  <span className="bc-psub">La dirección exacta y cómo llegar te llegan por correo antes del día.</span>
                </div>
              </div>
              <div className="bc-prow">
                <span className="bc-ic">🍽️</span>
                <div>
                  <small>Almuerzo</small>
                  <b>No está incluido</b>
                  <span className="bc-psub">
                    Hay pausa para almorzar, pero la comida la pone cada uno.
                  </span>
                </div>
              </div>
            </div>

            <p className="bc-close">
              Nos vemos adentro. Y esta vez no lo estás haciendo solo.
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
          <div className="cir-disclaimer">
            <b>Aviso importante</b>
            {DISCLAIMER_AFSL}
          </div>
          <div className="bc-cr">
            © 2026 Revolución del Dinero · Jonathan González Botero · {BOOTCAMP_INCLUIDO.lugar}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CirculoGracias;
