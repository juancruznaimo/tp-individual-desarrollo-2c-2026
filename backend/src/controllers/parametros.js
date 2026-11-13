import { LIMITE_MAXIMO, LIMITE_POR_DEFECTO } from '../services/paginacion.js';
import { lanzarSiHayErrores } from '../domain/validacion.js';

/**
 * Parseo de query params. Cada lector recibe la lista de errores y agrega
 * `{ campo, mensaje }` si el valor no es válido; al final se llama a `lanzarSiHayErrores`.
 * Un parámetro ausente o vacío devuelve `undefined`.
 */

const ausente = (valor) => valor === undefined || valor === '';

export function texto(query, campo) {
  const valor = query[campo];
  if (ausente(valor)) return undefined;
  return String(valor).trim() || undefined;
}

export function numero(errores, query, campo, { min } = {}) {
  const valor = query[campo];
  if (ausente(valor)) return undefined;
  const n = Number(valor);
  if (!Number.isFinite(n) || (min !== undefined && n < min)) {
    errores.push({
      campo,
      mensaje:
        min !== undefined ? `Debe ser un número mayor o igual a ${min}` : 'Debe ser un número',
    });
    return undefined;
  }
  return n;
}

export function entero(errores, query, campo, { min, max, porDefecto } = {}) {
  const valor = query[campo];
  if (ausente(valor)) return porDefecto;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) {
    errores.push({ campo, mensaje: `Debe ser un número entero entre ${min} y ${max}` });
    return porDefecto;
  }
  return n;
}

export function booleano(errores, query, campo, { porDefecto = false } = {}) {
  const valor = query[campo];
  if (ausente(valor)) return porDefecto;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  errores.push({ campo, mensaje: 'Debe ser true o false' });
  return porDefecto;
}

export function opcion(errores, query, campo, opciones) {
  const valor = query[campo];
  if (ausente(valor)) return undefined;
  if (!opciones.includes(valor)) {
    errores.push({ campo, mensaje: `Debe ser uno de: ${opciones.join(', ')}` });
    return undefined;
  }
  return valor;
}

export function paginacion(errores, query) {
  return {
    page: entero(errores, query, 'page', { min: 1, max: Number.MAX_SAFE_INTEGER, porDefecto: 1 }),
    limit: entero(errores, query, 'limit', {
      min: 1,
      max: LIMITE_MAXIMO,
      porDefecto: LIMITE_POR_DEFECTO,
    }),
  };
}

export { lanzarSiHayErrores };
