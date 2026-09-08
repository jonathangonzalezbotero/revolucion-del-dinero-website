const { splitName, findContactByEmail, createContact, fillEmptyContactFields, addTagByName } = require('./systeme');
const { normalizePhone } = require('./eventoRegistration');

// Check-in del día del evento (/checkin, sábado 12 de septiembre de 2026). La página la
// llenan los propios asistentes escaneando un QR en la puerta — incluidos los acompañantes,
// que en el registro original solo aparecían como partners_name/partners_phone del
// comprador y por eso no existían como contacto propio en el CRM.
//
// Este tag es el ÚNICO que se asigna acá. Deliberadamente NO se toca `evento-septiembre-2026`
// (dispara la automatización de compradores; ver eventoRegistration.js) ni
// `evento-sept-2026-no-pago`: el check-in solo dice "esta persona estuvo". Quien tiene el
// tag del evento y no tiene este es quien no asistió, y eso se filtra en systeme.io.
const ASISTENCIA_TAG = 'asistencia-evento';

// Reglas de escritura, en orden:
//  1. Si el correo ya existe en el CRM, se le agrega el tag y SOLO se rellenan los campos
//     que tenga vacíos. Nunca se sobreescribe nombre ni teléfono: los datos que la persona
//     dio al registrarse y pagar valen más que lo que teclea de prisa en la puerta.
//  2. Si no existe, se crea con nombre y teléfono y se le agrega el tag.
//
// Idempotente: repetir el check-in del mismo correo no duplica contactos ni tags.
async function checkinAsistente({ nombre, email, tel }) {
  const { firstName, surname } = splitName(nombre);
  const phone = normalizePhone(tel);
  const cleanEmail = email.trim().toLowerCase();

  let contact = await findContactByEmail(cleanEmail);
  let created = false;

  if (contact) {
    await fillEmptyContactFields(contact, { firstName, surname, phone });
  } else {
    try {
      contact = await createContact({ email: cleanEmail, firstName, surname, phone });
      created = true;
    } catch (err) {
      // findContactByEmail devuelve null también cuando la API falla de forma pasajera
      // (no solo cuando el correo no existe). En una puerta con 100 personas escaneando a
      // la vez ese es justo el momento en que systeme.io más se traba, y si el correo sí
      // existía el POST rebota. Se busca una segunda vez antes de darse por vencido.
      contact = await findContactByEmail(cleanEmail);
      if (!contact) throw err;
      await fillEmptyContactFields(contact, { firstName, surname, phone });
    }
  }

  const tagged = await addTagByName(contact.id, ASISTENCIA_TAG);
  if (!tagged) {
    console.error('checkin: no se pudo asignar', ASISTENCIA_TAG, 'al contacto', contact.id, cleanEmail);
  }

  return { contactId: contact.id, email: cleanEmail, created, tagged };
}

module.exports = { checkinAsistente, ASISTENCIA_TAG };
