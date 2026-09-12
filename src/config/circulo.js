// Single source of truth del Círculo Presencial (/circulo).
//
// Ruta canónica de venta: https://www.revoluciondeldinero.com/circulo
// Página de gracias:      https://www.revoluciondeldinero.com/circulo/gracias

export const DURACION = '12 meses de mentoria';

// Precios anunciados y lo que realmente cobra Stripe.
//
// PAGO ÚNICO: lleva la comisión de la pasarela encima ($1.000 → $1.018), igual que las
// entradas del evento. Se nombra debajo del botón, no se esconde.
//
// CUOTAS: llevan un 8% de recargo por financiar el pago ($1.000 → $1.080 en 6 pagos de
// $180). Ese 8% ya cubre la comisión de la pasarela, así que la cuota NO lleva fee encima:
// se cobra exactamente $180 y $270.
export const PRECIOS = {
  'circulo-individual': {
    id: 'circulo-individual',
    nombre: 'Individual',
    personas: 1,
    unico: { anunciado: 1000, cobro: 1018 },
    cuotas: { mensual: 180, numero: 6, total: 1080 },
  },
  'circulo-pareja': {
    id: 'circulo-pareja',
    nombre: 'Para dos',
    personas: 2,
    unico: { anunciado: 1500, cobro: 1527 },
    cuotas: { mensual: 270, numero: 6, total: 1620 },
  },
};

export const NUMERO_CUOTAS = 6;
export const RECARGO_CUOTAS_PCT = 8;

// Los price IDs viven SOLO en variables de entorno. Nunca se hardcodean, y no hay
// fallback: si falta la variable, la página muestra un error en español y no intenta
// cobrar. El servidor (api/create-circulo-checkout.js) lee estas mismas variables y es la
// autoridad sobre qué precio se cobra — el navegador manda `tier` y `plan`, nunca un
// price ID.
export const PRICE_IDS = {
  'circulo-individual': {
    unico: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL,
    cuotas: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_INDIVIDUAL_CUOTAS,
  },
  'circulo-pareja': {
    unico: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA,
    cuotas: process.env.REACT_APP_STRIPE_PRICE_CIRCULO_PAREJA_CUOTAS,
  },
};

// El Bootcamp va incluido en el Círculo. Se repiten los datos acá en vez de importarlos
// de config/bootcamp.js para que las dos páginas puedan divergir sin romperse: si un día
// cambia la fecha de una edición del Bootcamp, la del Círculo no tiene por qué ser la
// misma.
export const BOOTCAMP_INCLUIDO = {
  fecha: 'Sábado 28 de noviembre de 2026',
  fechaCorta: 'Sáb 28 de nov. de 2026',
  horario: '10:00 a 19:00',
  registro: '09:30',
  lugar: 'Australia',
  valorSuelto: 250,
};

// El segundo evento presencial del año, enfocado en identidad personal. Fecha exacta y
// lugar se anuncian por correo cuando estén cerrados: acá solo el mes.
export const EVENTO_MARZO = {
  nombre: 'Libera tu potencial',
  cuando: 'Marzo de 2027',
  mes: 'marzo',
};

// Sesiones uno a uno con Jonathan incluidas en el año. Se nombra el número en la página
// porque es una promesa concreta y verificable.
export const SESIONES_1A1 = 4;

// El ritmo del contenido. Es lo único que se promete sobre la Ruta del Revolucionario:
// una cadencia comprometida, nunca un número de etapas, clases o videos disponibles, ni
// una fecha de finalización del camino.
export const RITMO_CONTENIDO = {
  hastaNoviembre: 'una carpeta nueva cada semana y media',
  desdeDiciembre: 'una cada dos semanas',
};

// El curso de negocio incluido, con su precio suelto de referencia.
export const CURSO_NEGOCIO = {
  nombre: 'Empieza tu idea de negocio',
  precioSuelto: 'USD $200',
};
