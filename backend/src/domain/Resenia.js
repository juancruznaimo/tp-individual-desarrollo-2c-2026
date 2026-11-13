import { randomUUID } from 'node:crypto';

import { ReglaNegocioError } from '../errors/AppError.js';
import { EstadoCompra } from './EstadoCompra.js';
import { esNumeroFinito, lanzarSiHayErrores, redondear1, validarTexto } from './validacion.js';

export const PUNTUACION_MINIMA = 1;
export const PUNTUACION_MAXIMA = 5;

export class Resenia {
  constructor({
    id = randomUUID(),
    comprador,
    evento,
    detalle,
    puntuacion,
    creadaEn = new Date(),
  }) {
    const errores = [];
    if (!comprador) errores.push({ campo: 'comprador', mensaje: 'Es obligatorio' });
    if (!evento) errores.push({ campo: 'evento', mensaje: 'Es obligatorio' });
    validarTexto(errores, 'detalle', detalle, { max: 1000 });
    if (
      !esNumeroFinito(puntuacion) ||
      puntuacion < PUNTUACION_MINIMA ||
      puntuacion > PUNTUACION_MAXIMA ||
      !Number.isInteger(puntuacion * 2)
    ) {
      errores.push({
        campo: 'puntuacion',
        mensaje: `Debe ser un número entre ${PUNTUACION_MINIMA} y ${PUNTUACION_MAXIMA}, en pasos de 0.5`,
      });
    }
    lanzarSiHayErrores(errores, 'La reseña no es válida');

    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.detalle = detalle.trim();
    this.puntuacion = puntuacion;
    this.creadaEn = creadaEn;
  }
}

/**
 * Puntaje de un organizador (RN-10): promedio de las reseñas de todos sus eventos,
 * redondeado a 1 decimal. `null` si no tiene reseñas.
 */
export function calcularPuntaje(resenias) {
  if (resenias.length === 0) return { puntaje: null, cantidadResenias: 0 };
  const suma = resenias.reduce((total, r) => total + r.puntuacion, 0);
  return { puntaje: redondear1(suma / resenias.length), cantidadResenias: resenias.length };
}

/**
 * Quién puede reseñar un evento (RN-08, RN-09): no el organizador, una sola vez por
 * usuario, y solo con al menos una compra UTILIZADA de ese evento.
 * @param {object} contexto
 * @param {import('./Compra.js').Compra[]} contexto.compras  compras del comprador para el evento
 * @param {boolean} contexto.yaReseniado  si ya existe una reseña suya para el evento
 */
export function verificarQuePuedeReseniar({ comprador, evento, compras, yaReseniado }) {
  if (evento.esOrganizadoPor(comprador)) {
    throw new ReglaNegocioError('No podés reseñar tu propio evento');
  }
  if (yaReseniado) {
    throw new ReglaNegocioError('Ya reseñaste este evento');
  }
  if (!compras.some((c) => c.estado === EstadoCompra.UTILIZADA)) {
    throw new ReglaNegocioError(
      'Solo podés reseñar eventos a los que asististe (con una entrada utilizada)',
    );
  }
}
