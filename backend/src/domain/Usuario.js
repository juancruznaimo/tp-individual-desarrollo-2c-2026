import { randomUUID } from 'node:crypto';

import { lanzarSiHayErrores, validarTexto } from './validacion.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Usuario {
  constructor({ id = randomUUID(), nombre, apellido, email, favoritos = [] }) {
    const errores = [];
    validarTexto(errores, 'nombre', nombre, { max: 60 });
    validarTexto(errores, 'apellido', apellido, { max: 60 });
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errores.push({ campo: 'email', mensaje: 'Debe ser un email válido' });
    }
    lanzarSiHayErrores(errores, 'El usuario no es válido');

    this.id = id;
    this.nombre = nombre.trim();
    this.apellido = apellido.trim();
    this.email = email.trim().toLowerCase();
    /** IDs de los eventos favoritos, en el orden en que se agregaron. */
    this.favoritos = [...new Set(favoritos)];
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellido}`;
  }

  agregarFavorito(eventoId) {
    if (!this.esFavorito(eventoId)) this.favoritos.push(eventoId);
  }

  quitarFavorito(eventoId) {
    this.favoritos = this.favoritos.filter((id) => id !== eventoId);
  }

  esFavorito(eventoId) {
    return this.favoritos.includes(eventoId);
  }

  esMismoQue(otro) {
    return Boolean(otro) && otro.id === this.id;
  }
}
