const { checkinAsistente } = require('./_lib/eventoCheckin');
const {
  isTrustedOrigin,
  isSubmittedTooFast,
  isPlausibleEmail,
  isPlausiblePhone,
  isPlausibleName,
} = require('./_lib/antiSpam');

// Check-in de asistencia al evento del 12 de septiembre de 2026 (ver _lib/eventoCheckin.js).
//
// Es un endpoint público sin PIN — los asistentes lo llenan desde su propio teléfono al
// escanear un QR — así que lleva las mismas capas invisibles que los otros formularios:
// origen confiable, honeypot, tiempo mínimo de llenado y datos plausibles. Encima, solo
// acepta envíos en la fecha del evento (hora de Brisbane) para que una foto vieja del QR
// no sirva para meter contactos al CRM semanas después.
//
// Cualquier fallo del CRM responde 200 igual: la persona en la puerta no tiene nada que
// hacer con un error, y el fallo queda en el log con el prefijo "checkin:" para
// recuperarlo a mano. Solo los datos inválidos (400) le vuelven a la pantalla.

// La página web (src/pages/Checkin.js) solo se muestra el día del evento. El servidor
// acepta un día más porque la página guarda en el teléfono los envíos que fallaron sin
// señal y los reintenta cuando vuelve la conexión — eso puede ocurrir pasada la medianoche.
//
// Para ensayar antes del evento: CHECKIN_FECHAS en Vercel (fechas YYYY-MM-DD separadas por
// coma, hora de Brisbane) reemplaza esta lista, y la página se abre con /checkin?prueba=1.
// Quitar la variable después del ensayo.
const FECHAS_POR_DEFECTO = ['2026-09-12', '2026-09-13'];
const ZONA = 'Australia/Brisbane';

function fechasValidas() {
  const env = (process.env.CHECKIN_FECHAS || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
  return new Set(env.length ? env : FECHAS_POR_DEFECTO);
}

function fechaHoyBrisbane() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

const SILENT_OK = { ok: true };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isTrustedOrigin(req)) {
    console.warn('checkin: origen no confiable', req.headers.origin, req.headers.referer);
    return res.status(403).json({ error: 'Solicitud no permitida.' });
  }

  if (!fechasValidas().has(fechaHoyBrisbane())) {
    return res.status(403).json({ error: 'El check-in solo está disponible el día del evento.' });
  }

  const { nombre, email, tel, empresa, startedAt } = req.body || {};

  // Honeypot invisible: una persona no puede llenar este campo.
  if (empresa) {
    console.warn('checkin: honeypot lleno');
    return res.status(200).json(SILENT_OK);
  }

  if (isSubmittedTooFast(startedAt)) {
    console.warn('checkin: enviado demasiado rápido');
    return res.status(200).json(SILENT_OK);
  }

  if (!nombre?.trim() || !email?.trim() || !tel?.trim()) {
    return res.status(400).json({ error: 'Faltan datos: nombre, correo y teléfono son requeridos.' });
  }

  const cleanNombre = nombre.trim();
  const cleanEmail = email.trim();
  const cleanTel = tel.trim();

  if (!isPlausibleName(cleanNombre) || !isPlausibleEmail(cleanEmail) || !isPlausiblePhone(cleanTel)) {
    return res.status(400).json({ error: 'Revisa tu nombre, correo y teléfono.' });
  }

  try {
    const result = await checkinAsistente({ nombre: cleanNombre, email: cleanEmail, tel: cleanTel });
    console.log('checkin: ok', result.email, result.created ? 'nuevo' : 'existente', result.tagged ? 'tag ok' : 'SIN TAG');
  } catch (err) {
    // Se traga a propósito: nada de esto puede frenar a alguien en la puerta.
    console.error('checkin: fallo en systeme.io para', cleanEmail, cleanNombre, cleanTel, err);
  }

  return res.status(200).json({ ok: true });
};
