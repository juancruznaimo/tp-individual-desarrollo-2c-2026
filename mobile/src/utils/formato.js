const ZONA = 'America/Argentina/Buenos_Aires';

const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const fechaLarga = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const fechaCorta = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const hora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const fechaYHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const formatearPrecio = (valor) => (valor === 0 ? 'Gratis' : moneda.format(valor));

/** "sábado, 22 de noviembre de 2026" */
export const formatearFechaLarga = (iso) => fechaLarga.format(new Date(iso));

/** "sáb, 22 nov · 21:00" */
export const formatearFechaEvento = (iso) =>
  `${fechaCorta.format(new Date(iso))} · ${hora.format(new Date(iso))}`;

export const formatearHora = (iso) => hora.format(new Date(iso));

/** "22 nov, 21:00" */
export const formatearFechaYHora = (iso) => fechaYHora.format(new Date(iso));

export const formatearPuntaje = (puntaje) =>
  puntaje === null || puntaje === undefined ? 'Sin reseñas' : puntaje.toFixed(1);

/** "¡Es hoy!", "Falta 1 día", "Faltan 12 días" (CU-01). */
export function textoDiasRestantes(dias) {
  if (dias === null || dias === undefined) return null;
  if (dias === 0) return '¡Es hoy!';
  if (dias === 1) return 'Falta 1 día';
  return `Faltan ${dias} días`;
}

export const nombreCompleto = (persona) => `${persona.nombre} ${persona.apellido}`;

export const iniciales = (persona) => `${persona.nombre[0] ?? ''}${persona.apellido[0] ?? ''}`;
