import { ValidacionError } from '../errors/AppError.js';

/**
 * Helpers de validación. Cada entidad junta los errores en una lista de
 * `{ campo, mensaje }` y, si hay alguno, lanza un único ValidacionError.
 */

export function lanzarSiHayErrores(errores, mensaje = 'Los datos enviados no son válidos') {
  if (errores.length > 0) throw new ValidacionError(mensaje, errores);
}

export function validarTexto(errores, campo, valor, { min = 1, max, requerido = true } = {}) {
  const vacio = valor === undefined || valor === null || valor === '';
  if (vacio) {
    if (requerido) errores.push({ campo, mensaje: 'Es obligatorio' });
    return;
  }
  if (typeof valor !== 'string') {
    errores.push({ campo, mensaje: 'Debe ser un texto' });
    return;
  }
  const largo = valor.trim().length;
  if (largo === 0 && requerido) {
    errores.push({ campo, mensaje: 'Es obligatorio' });
  } else if (largo < min) {
    errores.push({ campo, mensaje: `Debe tener al menos ${min} caracteres` });
  } else if (max !== undefined && largo > max) {
    errores.push({ campo, mensaje: `Debe tener como máximo ${max} caracteres` });
  }
}

export function esEnteroEnRango(valor, min, max = Number.MAX_SAFE_INTEGER) {
  return Number.isInteger(valor) && valor >= min && valor <= max;
}

export function esNumeroFinito(valor) {
  return typeof valor === 'number' && Number.isFinite(valor);
}

export function tieneHastaDosDecimales(valor) {
  return Math.abs(redondear2(valor) - valor) < 1e-9;
}

/** Convierte un Date o un string ISO a Date. Devuelve null si no es una fecha válida. */
export function aFecha(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  return null;
}

export function esUrlHttp(valor) {
  if (typeof valor !== 'string') return false;
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function redondear2(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function redondear1(valor) {
  return Math.round((valor + Number.EPSILON) * 10) / 10;
}

/** Pasa a minúsculas y quita tildes, para comparar textos ("Música" ≈ "musica"). */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
