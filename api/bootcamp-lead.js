const { registerBootcampLead } = require('./_lib/bootcampRegistration');
const {
  isTrustedOrigin,
  isSubmittedTooFast,
  isPlausibleEmail,
  isPlausiblePhone,
  isPlausibleName,
} = require('./_lib/antiSpam');

// Guarda el contacto del Bootcamp en systeme.io con el tag `bootcamp-nov-2026` ANTES de
// que se abra el checkout de Stripe. Ese orden es el requisito no negociable de
// /bootcamp: quien llena el formulario y nunca paga tiene que quedar en el CRM.
//
// Se llama fire-and-forget desde el navegador (con `keepalive`) y nunca se espera, así
// que no puede retrasar la redirección a Stripe. Siempre responde 200: el cliente no
// tiene nada útil que hacer con un fallo, y cualquier problema del CRM se registra acá
// con el prefijo "bootcamp-lead:" para recuperarlo a mano.
//
// Nada de este archivo toca el flujo del evento de septiembre.
const SILENT_OK = { ok: true };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Control que más pesa contra el spam: un envío real siempre viene del sitio en un
  // navegador, que siempre manda Origin en un fetch POST. Un script que golpea el
  // endpoint directamente, no.
  if (!isTrustedOrigin(req)) {
    console.warn('bootcamp-lead: origen no confiable', req.headers.origin, req.headers.referer);
    return res.status(403).json({ error: 'Solicitud no permitida.' });
  }

  const { nombre, email, tel, amigoNombre, amigoTel, empresa, startedAt } = req.body || {};

  // Honeypot invisible: una persona no puede llenar este campo.
  if (empresa) {
    console.warn('bootcamp-lead: honeypot lleno');
    return res.status(200).json(SILENT_OK);
  }

  if (isSubmittedTooFast(startedAt)) {
    console.warn('bootcamp-lead: enviado demasiado rápido');
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
    await registerBootcampLead({
      nombre: cleanNombre,
      email: cleanEmail,
      tel: cleanTel,
      amigoNombre: amigoNombre?.trim() || '',
      amigoTel: amigoTel?.trim() || '',
    });
  } catch (err) {
    // Se traga a propósito: una caída del CRM no puede aparecerle a alguien que va camino
    // a pagar. Queda en el log para recuperar el registro a mano.
    console.error('bootcamp-lead: fallo el registro en systeme.io para', cleanEmail, err);
  }

  return res.status(200).json({ ok: true });
};
