import { randomUUID } from 'node:crypto';

import { NoEncontradoError, ValidacionError } from '../errors/AppError.js';
import { TipoEntrada } from './TipoEntrada.js';
import {
  aFecha,
  esUrlHttp,
  lanzarSiHayErrores,
  normalizarTexto,
  validarTexto,
} from './validacion.js';

export const MAXIMO_MULTIMEDIA = 10;

export class Evento {
  constructor({
    id = randomUUID(),
    nombre,
    descripcion,
    categoria,
    fecha,
    lugar,
    tiposEntrada,
    multimedia = [],
    organizador,
    creadoEn = new Date(),
  }) {
    const errores = [];
    validarTexto(errores, 'nombre', nombre, { min: 3, max: 120 });
    validarTexto(errores, 'descripcion', descripcion, { max: 2000 });
    validarTexto(errores, 'lugar', lugar, { max: 200 });
    if (!categoria) errores.push({ campo: 'categoriaId', mensaje: 'Es obligatoria' });
    if (!organizador) errores.push({ campo: 'organizador', mensaje: 'Es obligatorio' });

    const fechaEvento = aFecha(fecha);
    if (!fechaEvento) errores.push({ campo: 'fecha', mensaje: 'Debe ser una fecha válida' });

    errores.push(...Evento.#validarMultimedia(multimedia));
    errores.push(...Evento.#validarTiposEntrada(tiposEntrada));

    lanzarSiHayErrores(errores, 'El evento no es válido');

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion.trim();
    this.categoria = categoria;
    this.fecha = fechaEvento;
    this.lugar = lugar.trim();
    this.tiposEntrada = tiposEntrada.map((t) =>
      t instanceof TipoEntrada ? t : new TipoEntrada(t),
    );
    this.multimedia = [...multimedia];
    this.organizador = organizador;
    this.creadoEn = creadoEn;
  }

  static #validarMultimedia(multimedia) {
    if (!Array.isArray(multimedia)) {
      return [{ campo: 'multimedia', mensaje: 'Debe ser una lista de URLs' }];
    }
    if (multimedia.length > MAXIMO_MULTIMEDIA) {
      return [{ campo: 'multimedia', mensaje: `Puede tener como máximo ${MAXIMO_MULTIMEDIA}` }];
    }
    return multimedia
      .map((url, i) =>
        esUrlHttp(url) ? null : { campo: `multimedia[${i}]`, mensaje: 'Debe ser una URL http(s)' },
      )
      .filter(Boolean);
  }

  static #validarTiposEntrada(tiposEntrada) {
    if (!Array.isArray(tiposEntrada) || tiposEntrada.length === 0) {
      return [{ campo: 'tiposEntrada', mensaje: 'Debe tener al menos un tipo de entrada' }];
    }

    const errores = [];
    tiposEntrada.forEach((tipo, i) => {
      if (tipo instanceof TipoEntrada) return;
      if (!tipo || typeof tipo !== 'object') {
        errores.push({ campo: `tiposEntrada[${i}]`, mensaje: 'Debe ser un objeto' });
        return;
      }
      TipoEntrada.validar(tipo).forEach(({ campo, mensaje }) =>
        errores.push({ campo: `tiposEntrada[${i}].${campo}`, mensaje }),
      );
    });

    const vistos = new Set();
    tiposEntrada.forEach((tipo, i) => {
      if (typeof tipo?.nombre !== 'string') return;
      const clave = normalizarTexto(tipo.nombre.trim());
      if (vistos.has(clave)) {
        errores.push({
          campo: `tiposEntrada[${i}].nombre`,
          mensaje: 'Ya hay otro tipo de entrada con ese nombre',
        });
      }
      vistos.add(clave);
    });
    return errores;
  }

  /** `true` si algún tipo de entrada tiene un precio dentro de [min, max]. Los límites ausentes no restringen. */
  tuPrecioEstaEntre(min, max) {
    return this.tiposEntrada.some(
      ({ precio }) => (min == null || precio >= min) && (max == null || precio <= max),
    );
  }

  precioMinimo() {
    return Math.min(...this.tiposEntrada.map((t) => t.precio));
  }

  yaOcurrio(ahora) {
    return this.fecha.getTime() <= ahora.getTime();
  }

  get agotado() {
    return this.tiposEntrada.every((t) => t.agotado);
  }

  tipoEntrada(tipoEntradaId) {
    const tipo = this.tiposEntrada.find((t) => t.id === tipoEntradaId);
    if (!tipo) {
      throw new NoEncontradoError(`El tipo de entrada ${tipoEntradaId} no pertenece al evento`);
    }
    return tipo;
  }

  esOrganizadoPor(usuario) {
    return Boolean(usuario) && usuario.id === this.organizador.id;
  }

  /**
   * Búsqueda textual: sin distinguir mayúsculas ni tildes, todas las palabras del texto
   * tienen que aparecer en el nombre, la descripción, el lugar o la categoría.
   */
  coincideCon(texto) {
    const palabras = normalizarTexto(texto).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return true;
    const contenido = normalizarTexto(
      [this.nombre, this.descripcion, this.lugar, this.categoria?.nombre].join(' '),
    );
    return palabras.every((palabra) => contenido.includes(palabra));
  }

  /** Regla de publicación: un evento nuevo tiene que tener fecha futura. */
  validarFechaFutura(ahora) {
    if (this.yaOcurrio(ahora)) {
      throw new ValidacionError('El evento no es válido', [
        { campo: 'fecha', mensaje: 'La fecha del evento debe ser futura' },
      ]);
    }
  }
}
