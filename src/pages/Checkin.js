/**
 * /checkin — check-in de asistencia del evento del sábado 12 de septiembre de 2026.
 *
 * Los asistentes escanean un QR en la puerta y llenan esto desde su propio teléfono:
 * nombre, correo y teléfono, nada más. Los acompañantes también escanean y se registran
 * por su cuenta, así quedan como contacto propio en el CRM (en el registro original solo
 * existían como partners_name/partners_phone del comprador).
 *
 * Reglas de esta página:
 *  - Solo el formulario. Sin navegación, sin secciones, sin píxel de Meta (se excluye en
 *    public/index.html y en App.js), sin indexar (robots noindex + robots.txt).
 *  - Solo funciona el 12 de septiembre, hora de Brisbane. Otro día muestra un aviso.
 *  - Nunca frena a la persona. Si no hay señal o el servidor no responde, el envío se
 *    guarda en localStorage, se muestra "Listo" igual, y se reintenta solo mientras la
 *    página siga abierta (al volver la conexión, y cada 20 s). Limitación honesta: si
 *    cierran la pestaña sin señal, ese envío se pierde. Solo un 400 (datos inválidos)
 *    le vuelve a la pantalla, porque eso sí lo puede corregir.
 *
 * El servidor (api/checkin.js) solo asigna el tag `asistencia-evento`.
 */

import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import './Checkin.css';
import Logo from '../assets/images/logo.webp';

const FECHA_EVENTO = '2026-09-12';
const ZONA = 'Australia/Brisbane';
const QUEUE_KEY = 'rdd-checkin-pendientes';
const RETRY_MS = 20000;
const TIMEOUT_MS = 8000;

function hoyEnBrisbane() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function leerCola() {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function guardarCola(list) {
  try {
    if (list.length) window.localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
    else window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    /* almacenamiento bloqueado: no hay cola, pero la página sigue funcionando */
  }
}

function encolar(payload) {
  guardarCola([...leerCola(), payload]);
}

// Resuelve { ok, status } si el servidor contestó (cualquier código), y lanza si no hubo
// respuesta: sin red, DNS caído, o timeout. Solo el segundo caso va a la cola.
async function enviar(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: controller.signal,
    });
    let body = {};
    try { body = await res.json(); } catch { /* sin cuerpo */ }
    return { ok: res.ok, status: res.status, error: body.error };
  } finally {
    clearTimeout(timer);
  }
}

// Reintenta lo pendiente. Un envío sale de la cola cuando el servidor contesta lo que sea:
// un 4xx no se va a arreglar reintentando, y seguir insistiendo no le sirve a nadie.
async function vaciarCola() {
  const pendientes = leerCola();
  if (!pendientes.length) return;
  const restantes = [];
  for (const payload of pendientes) {
    try {
      await enviar(payload);
    } catch {
      restantes.push(payload);
    }
  }
  guardarCola(restantes);
}

// /checkin?prueba=1 muestra el formulario cualquier día, para ensayar desde un teléfono
// real antes del evento. No abre nada: el servidor sigue exigiendo la fecha (o
// CHECKIN_FECHAS en Vercel), así que sin eso el ensayo termina en un 403 silencioso.
function esEnsayo() {
  try {
    return new URLSearchParams(window.location.search).get('prueba') === '1';
  } catch {
    return false;
  }
}

function Checkin() {
  const esHoy = hoyEnBrisbane() === FECHA_EVENTO || esEnsayo();

  const [estado, setEstado] = useState('form'); // 'form' | 'enviando' | 'listo'
  const [error, setError] = useState('');
  const [nombreListo, setNombreListo] = useState('');

  const formRef = useRef(null);
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const telRef = useRef(null);
  const empresaRef = useRef(null);
  const abiertoEnRef = useRef(Date.now());

  useEffect(() => {
    vaciarCola();
    const id = setInterval(vaciarCola, RETRY_MS);
    window.addEventListener('online', vaciarCola);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', vaciarCola);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (estado === 'enviando') return;

    const nombre = nombreRef.current?.value.trim() || '';
    const email = emailRef.current?.value.trim() || '';
    const tel = telRef.current?.value.trim() || '';

    if (!nombre || !email || !tel || !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setError('');
    setEstado('enviando');

    const payload = {
      nombre,
      email,
      tel,
      empresa: empresaRef.current?.value || '',
      startedAt: abiertoEnRef.current,
    };

    try {
      const res = await enviar(payload);
      if (res.status === 400) {
        setError(res.error || 'Revisa tu nombre, correo y teléfono.');
        setEstado('form');
        return;
      }
      if (res.status === 403) {
        // Fuera de fecha u origen raro: no es culpa de la persona ni lo puede arreglar.
        console.warn('checkin rechazado', res.status, res.error);
      }
    } catch (err) {
      // Sin señal: guardar y seguir. La persona ve "Listo" igual.
      console.warn('checkin sin conexión, guardado para reintentar', err);
      encolar(payload);
    }

    setNombreListo(nombre.split(/\s+/)[0]);
    setEstado('listo');
  };

  const handleOtro = () => {
    setNombreListo('');
    setError('');
    abiertoEnRef.current = Date.now();
    setEstado('form');
  };

  return (
    <div className="page-checkin">
      <Helmet>
        <title>Check-in · Revolución del Dinero</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Check-in de asistencia al evento." />
      </Helmet>

      <main className="checkin-wrap">
        <header className="checkin-head">
          <img src={Logo} alt="Revolución del Dinero" className="checkin-logo" width="56" height="56" />
          <span className="eyebrow">Taller de Finanzas Personales</span>
        </header>

        {!esHoy && (
          <section className="checkin-card" aria-live="polite">
            <h1>Check-in</h1>
            <p className="checkin-sub">El check-in solo está disponible el día del evento, sábado 12 de septiembre.</p>
          </section>
        )}

        {esHoy && estado === 'listo' && (
          <section className="checkin-card checkin-done" aria-live="polite">
            <div className="checkin-check" aria-hidden="true">✓</div>
            <h1>Listo{nombreListo ? `, ${nombreListo}` : ''}.</h1>
            <p className="checkin-sub">Bienvenido. Ya quedó tu asistencia registrada.</p>
            <button type="button" className="btn btn-outline btn-block checkin-otro" onClick={handleOtro}>
              Registrar a otra persona
            </button>
          </section>
        )}

        {esHoy && estado !== 'listo' && (
          <section className="checkin-card">
            <h1>Check-in</h1>
            <p className="checkin-sub">Confirma tu asistencia con los mismos datos de tu registro. Si vienes acompañando a alguien, regístrate tú también.</p>

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="ckNombre">Nombre completo</label>
                <input id="ckNombre" name="nombre" type="text" placeholder="Tu nombre y apellido" autoComplete="name" ref={nombreRef} required />
              </div>
              <div className="field">
                <label htmlFor="ckEmail">Correo electrónico</label>
                <input id="ckEmail" name="email" type="email" placeholder="tucorreo@ejemplo.com" autoComplete="email" inputMode="email" autoCapitalize="none" ref={emailRef} required />
              </div>
              <div className="field">
                <label htmlFor="ckTel">Teléfono</label>
                <input id="ckTel" name="tel" type="tel" placeholder="+61 ..." autoComplete="tel" inputMode="tel" ref={telRef} required />
              </div>

              {/* Honeypot: invisible para personas, irresistible para bots. */}
              <div className="checkin-hp" aria-hidden="true">
                <label htmlFor="ckEmpresa">Empresa</label>
                <input id="ckEmpresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" ref={empresaRef} />
              </div>

              {error && <p className="checkin-error" role="alert">{error}</p>}

              <button type="submit" className="btn btn-gold btn-lg btn-block" disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Registrando…' : 'Confirmar asistencia'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default Checkin;
