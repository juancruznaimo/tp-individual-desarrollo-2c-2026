import { randomUUID } from 'node:crypto';

import { lanzarSiHayErrores, validarTexto } from './validacion.js';

export class Categoria {
  constructor({ id = randomUUID(), nombre, descripcion = '' }) {
    const errores = [];
    validarTexto(errores, 'nombre', nombre, { max: 60 });
    validarTexto(errores, 'descripcion', descripcion, { max: 300, requerido: false });
    lanzarSiHayErrores(errores, 'La categoría no es válida');

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion.trim();
  }
}
