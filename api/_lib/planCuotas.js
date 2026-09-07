// Cálculo del `cancel_at` de una suscripción de N cuotas mensuales.
//
// POR QUÉ NO SE CALCA EL PATRÓN QUE YA EXISTE EN STRIPE
// -----------------------------------------------------
// Las dos suscripciones de las fundadoras (junio 2026, AUD 145/mes y AUD 180/mes) tienen
// `cancel_at = start_date + 15.811.200 s`, es decir exactamente 183 días. Eso funciona
// para ellas por casualidad: empiezan el 6 de junio, y del 6 de junio al 6 de diciembre
// hay justo 183 días (30+31+31+30+31+30). El `cancel_at` cae en el mismo segundo que el
// séptimo cobro y se salva porque Stripe cancela antes de facturar cuando coinciden.
//
// 183 días NO son seis meses de calendario. Con otras fechas de arranque, el mismo cálculo
// cobra un séptimo mes:
//
//   arranca 31 de enero  → +183 días = 2 de agosto, pero el 7.º cobro es el 31 de julio  → COBRA 7
//   arranca 12 de septiembre → +183 días = 14 de marzo, pero el 7.º cobro es el 12 de marzo → COBRA 7
//
// Un séptimo cobro es un cargo no autorizado a alguien que pagó $1.000: disputa y
// reputación. Así que acá se hace con meses de calendario reales, recortando el día al
// último del mes corto (que es la regla que usa Stripe para su ancla de cobro), y con un
// margen de seguridad para no depender de una coincidencia al segundo.
//
// Verificado con api/_lib/__tests__/planCuotas.test.js, que simula el calendario de cobros
// de Stripe para los 366 días de arranque posibles y comprueba que siempre son
// exactamente 6 cobros.

// Se descuenta del séptimo cobro para no depender de una igualdad exacta de timestamps.
// Una hora es de sobra: el sexto cobro ocurre un mes antes, así que no hay riesgo de
// recortarlo.
const MARGEN_SEGURIDAD_S = 3600;

// Fecha del cobro número `n` (1-indexado) de una suscripción mensual anclada en `anchor`.
// Replica la regla de Stripe: mismo día del mes, recortado al último día en los meses que
// no tienen ese día (31 de enero → 28 de febrero → 31 de marzo, el ancla no se pierde).
function fechaDelCobro(anchorUnix, n) {
  const a = new Date(anchorUnix * 1000);
  const anio = a.getUTCFullYear();
  const mes = a.getUTCMonth();
  const dia = a.getUTCDate();

  const mesObjetivo = mes + (n - 1);
  // Día 0 del mes siguiente = último día del mes objetivo.
  const ultimoDia = new Date(Date.UTC(anio, mesObjetivo + 1, 0)).getUTCDate();

  return Math.floor(Date.UTC(
    anio,
    mesObjetivo,
    Math.min(dia, ultimoDia),
    a.getUTCHours(),
    a.getUTCMinutes(),
    a.getUTCSeconds(),
  ) / 1000);
}

// `cancel_at` para que se cobren exactamente `cuotas` mensualidades y la suscripción se
// apague sola. Se sitúa justo antes del cobro `cuotas + 1`.
function cancelAtTrasCuotas(anchorUnix, cuotas) {
  if (!Number.isFinite(anchorUnix) || anchorUnix <= 0) {
    throw new Error(`anchorUnix inválido: ${anchorUnix}`);
  }
  if (!Number.isInteger(cuotas) || cuotas < 1) {
    throw new Error(`cuotas inválidas: ${cuotas}`);
  }
  return fechaDelCobro(anchorUnix, cuotas + 1) - MARGEN_SEGURIDAD_S;
}

module.exports = { cancelAtTrasCuotas, fechaDelCobro, MARGEN_SEGURIDAD_S };
