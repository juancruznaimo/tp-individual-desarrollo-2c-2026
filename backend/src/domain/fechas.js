export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const formateador = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/** Día calendario de `fecha` en la zona horaria del sistema, como timestamp UTC de las 00:00. */
function diaCalendario(fecha) {
  const partes = Object.fromEntries(
    formateador.formatToParts(fecha).map(({ type, value }) => [type, Number(value)]),
  );
  return Date.UTC(partes.year, partes.month - 1, partes.day);
}

/**
 * Diferencia en días calendario (no en horas) entre dos fechas, en la zona de Buenos Aires.
 * Ej.: del 12/11 23:50 al 13/11 00:30 hay 1 día aunque falten 40 minutos.
 */
export function diasCalendarioEntre(desde, hasta) {
  return Math.round((diaCalendario(hasta) - diaCalendario(desde)) / MS_POR_DIA);
}
