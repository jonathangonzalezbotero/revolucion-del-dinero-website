const LOGO_URL = 'https://d1yei2z3i6k35z.cloudfront.net/17411220/69f4103eaf1164.06093873_REVOLUCIONDELDINERO-TRANSPARENT.png';

const BRAND = {
  ivory: '#f6f1e7',
  ink: '#1c1712',
  inkSoft: '#5f564a',
  emerald: '#0f6b4f',
  emeraldDeep: '#0a4d39',
  gold: '#d99a2b',
  line: '#e7ddc9',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shell({ preheader, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:${BRAND.ivory};font-family:Georgia,'Times New Roman',serif;">
    <span style="display:none;font-size:1px;color:${BRAND.ivory};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.ivory};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf8f1;border-radius:20px;overflow:hidden;border:1px solid ${BRAND.line};">
            <tr>
              <td style="background:${BRAND.emeraldDeep};padding:28px 32px;text-align:center;">
                <img src="${LOGO_URL}" alt="Revolución del Dinero" height="40" style="height:40px;width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${BRAND.line};text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.inkSoft};">
                  © ${new Date().getUTCFullYear()} Revolución del Dinero · Jonathan González Botero
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:${BRAND.ink};">${text}</h1>`;
}

function p(text) {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.inkSoft};">${text}</p>`;
}

/**
 * Sent to the lead who submitted the mentorship request form.
 */
function mentorLeadConfirmationEmail({ nombre }) {
  const firstName = escapeHtml(String(nombre).trim().split(' ')[0] || 'hola');
  const bodyHtml = `
    ${h1(`¡Recibí tu solicitud, ${firstName}!`)}
    ${p('Gracias por dar este paso. La Mentoría 1:1 es un programa de acompañamiento de <strong>12 meses</strong> conmigo, y antes de confirmar tu cupo quiero conocer tu situación personalmente.')}
    ${p('Te voy a llamar por WhatsApp en los próximos días para conversar y contarte en detalle cómo funciona el programa.')}
    ${p('Mientras tanto, si quieres seguir aprendiendo, te espero en la comunidad:')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
      <tr>
        <td style="border-radius:60px;background:${BRAND.emerald};">
          <a href="https://www.skool.com/revolucion-del-dinero-7029" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#fbf8f1;text-decoration:none;">Unirme a la comunidad →</a>
        </td>
      </tr>
    </table>
  `;
  return {
    subject: 'Recibimos tu solicitud de mentoría — Revolución del Dinero',
    html: shell({ preheader: 'Te voy a llamar personalmente por WhatsApp en los próximos días.', bodyHtml }),
    text: `¡Recibí tu solicitud, ${firstName}!\n\nGracias por dar este paso. La Mentoría 1:1 es un programa de acompañamiento de 12 meses conmigo, y antes de confirmar tu cupo quiero conocer tu situación personalmente. Te voy a llamar por WhatsApp en los próximos días.\n\n— Jonathan González Botero, Revolución del Dinero`,
  };
}

/**
 * Sent to Jonathan (or whoever MENTOR_NOTIFY_EMAIL points at) with the lead's details.
 */
function mentorNotificationEmail({ nombre, email, whatsapp }) {
  const row = (label, value) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.inkSoft};width:110px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${BRAND.ink};font-weight:700;">${escapeHtml(value)}</td>
    </tr>`;

  const bodyHtml = `
    ${h1('Nueva solicitud de mentoría 🎯')}
    ${p('Alguien acaba de pedir una llamada para la Mentoría 1:1 desde el sitio web.')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${row('Nombre', nombre)}
      ${row('Correo', email)}
      ${row('WhatsApp', whatsapp)}
    </table>
    ${p(`Responde a este correo para escribirle directamente a <strong>${escapeHtml(email)}</strong>, o contáctalo por WhatsApp al número de arriba.`)}
  `;
  return {
    subject: `Nueva solicitud de mentoría: ${nombre}`,
    html: shell({ preheader: `${nombre} · ${email} · ${whatsapp}`, bodyHtml }),
    text: `Nueva solicitud de mentoría\n\nNombre: ${nombre}\nCorreo: ${email}\nWhatsApp: ${whatsapp}`,
  };
}

module.exports = { mentorLeadConfirmationEmail, mentorNotificationEmail };
