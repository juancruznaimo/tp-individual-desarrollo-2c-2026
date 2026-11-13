import { randomUUID } from 'node:crypto';

import { SinCupoError } from '../errors/AppError.js';
import {
  esEnteroEnRango,
  esNumeroFinito,
  lanzarSiHayErrores,
  tieneHastaDosDecimales,
  validarTexto,
} from './validacion.js';

export const CUPO_MAXIMO = 1_000_000;

export class TipoEntrada {
  /**
   * Valida los datos de un tipo de entrada sin construirlo. Devuelve una lista de
   * `{ campo, mensaje }` (vacía si es válido); Evento la usa para prefijar los campos.
   */
  static validar({ nombre, descripcion, precio, cupo, cupoTotal = cupo }) {
    const errores = [];
    validarTexto(errores, 'nombre', nombre, { max: 60 });
    validarTexto(errores, 'descripcion', descripcion, { max: 300, requerido: false });

    if (!esNumeroFinito(precio) || precio < 0) {
      errores.push({ campo: 'precio', mensaje: 'Debe ser un número mayor o igual a 0' });
    } else if (!tieneHastaDosDecimales(precio)) {
      errores.push({ campo: 'precio', mensaje: 'Puede tener como máximo 2 decimales' });
    }

    if (!esEnteroEnRango(cupoTotal, 1, CUPO_MAXIMO)) {
      errores.push({
        campo: 'cupo',
        mensaje: `Debe ser un número entero entre 1 y ${CUPO_MAXIMO}`,
      });
    } else if (!esEnteroEnRango(cupo, 0, cupoTotal)) {
      errores.push({ campo: 'cupo', mensaje: 'El cupo disponible no puede superar al total' });
    }
    return errores;
  }

  /**
   * @param {object} datos
   * @param {number} datos.cupo      cupo disponible (se descuenta al comprar)
   * @param {number} [datos.cupoTotal] cupo inicial; por defecto igual a `cupo`
   */
  constructor({ id = randomUUID(), nombre, descripcion = '', precio, cupo, cupoTotal = cupo }) {
    lanzarSiHayErrores(
      TipoEntrada.validar({ nombre, descripcion, precio, cupo, cupoTotal }),
      'El tipo de entrada no es válido',
    );

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion.trim();
    this.precio = precio;
    this.cupo = cupo;
    this.cupoTotal = cupoTotal;
  }

  hayCupoPara(cantidad) {
    return esEnteroEnRango(cantidad, 1) && cantidad <= this.cupo;
  }

  reservar(cantidad) {
    if (!this.hayCupoPara(cantidad)) {
      throw new SinCupoError(
        `Quedan ${this.cupo} entradas de tipo ${this.nombre} y se pidieron ${cantidad}`,
        { disponibles: this.cupo, solicitadas: cantidad },
      );
    }
    this.cupo -= cantidad;
  }

  liberar(cantidad) {
    this.cupo = Math.min(this.cupo + cantidad, this.cupoTotal);
  }

  get vendidas() {
    return this.cupoTotal - this.cupo;
  }

  get agotado() {
    return this.cupo === 0;
  }
}
