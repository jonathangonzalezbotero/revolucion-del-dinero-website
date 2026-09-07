// Single source of truth for the Bootcamp Financiero (sábado 14 de noviembre de 2026).
// Imported by src/pages/Bootcamp.js and src/pages/BootcampGracias.js so no date, price
// or link is ever typed twice.
//
// Ruta canónica de venta: https://www.revoluciondeldinero.com/bootcamp
// Página de gracias:      https://www.revoluciondeldinero.com/bootcamp/gracias

// El link de Calendly pasó a src/config/agenda.js cuando /circulo/gracias también empezó
// a necesitarlo: una sola constante para los dos productos. Se re-exporta acá para que
// quien ya lo importaba de este módulo siga funcionando sin cambios.
export { LINK_AGENDA } from './agenda';

export const FECHA_LARGA = 'Sábado 14 de noviembre de 2026';
export const FECHA_CORTA = 'Sáb 14 de nov. de 2026';
export const HORARIO = '10:00 a 19:00';
export const REGISTRO = '09:30';
export const LUGAR = 'Gold Coast, Australia';

// Precios anunciados. Lo que se cobra en Stripe es $255 / $408: el cliente asume la
// comisión de la pasarela, igual que con las entradas del evento ($10 → $10,50). La
// diferencia se nombra debajo de cada botón, nunca se esconde.
export const PRECIO_INDIVIDUAL = 250;
export const PRECIO_PAREJA = 400;
export const COBRO_INDIVIDUAL = 255;
export const COBRO_PAREJA = 408;

// Los price IDs viven SOLO en variables de entorno. Nunca se hardcodean, y no hay
// fallback: si falta la variable, la página muestra un error en español y no intenta
// cobrar. El servidor (api/create-bootcamp-checkout.js) lee estas mismas variables y es
// la autoridad sobre qué precio se cobra — el navegador nunca manda un price ID.
export const PRICE_IDS = {
  'bootcamp-individual': process.env.REACT_APP_STRIPE_PRICE_BOOTCAMP_INDIVIDUAL,
  'bootcamp-pareja': process.env.REACT_APP_STRIPE_PRICE_BOOTCAMP_PAREJA,
};

export const TIERS = {
  'bootcamp-individual': {
    id: 'bootcamp-individual',
    nombre: 'Entrada individual',
    precio: PRECIO_INDIVIDUAL,
    cobro: COBRO_INDIVIDUAL,
    personas: 1,
  },
  'bootcamp-pareja': {
    id: 'bootcamp-pareja',
    nombre: 'Entrada para dos',
    precio: PRECIO_PAREJA,
    cobro: COBRO_PAREJA,
    personas: 2,
  },
};

// La sesión 1:1 se puede usar entre el 12 de septiembre y el 14 de noviembre de 2026.
export const LIMITE_SESION = '14 de noviembre de 2026';
