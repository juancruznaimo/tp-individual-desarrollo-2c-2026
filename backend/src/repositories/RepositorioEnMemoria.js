import { NoEncontradoError } from '../errors/AppError.js';

/**
 * Repositorio genérico sobre un Map indexado por `id`. Guarda referencias a los
 * objetos de dominio, así que las modificaciones sobre una entidad ya guardada
 * quedan persistidas sin volver a llamar a `guardar`.
 */
export class RepositorioEnMemoria {
  #items = new Map();

  /** @param {string} descripcion  cómo nombrar la entidad en los errores, ej. "El evento" */
  constructor(descripcion = 'El recurso') {
    this.descripcion = descripcion;
  }

  guardar(entidad) {
    this.#items.set(entidad.id, entidad);
    return entidad;
  }

  buscarPorId(id) {
    return this.#items.get(id) ?? null;
  }

  /** Como `buscarPorId`, pero lanza NoEncontradoError si no existe. */
  obtenerPorId(id) {
    const entidad = this.buscarPorId(id);
    if (!entidad) throw new NoEncontradoError(`${this.descripcion} con id ${id} no existe`);
    return entidad;
  }

  todos() {
    return [...this.#items.values()];
  }

  filtrar(predicado) {
    return this.todos().filter(predicado);
  }

  buscar(predicado) {
    return this.todos().find(predicado) ?? null;
  }

  eliminar(id) {
    return this.#items.delete(id);
  }

  cantidad() {
    return this.#items.size;
  }

  limpiar() {
    this.#items.clear();
  }
}
