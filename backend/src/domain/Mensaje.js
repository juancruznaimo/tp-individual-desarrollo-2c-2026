import { randomUUID } from 'node:crypto';

import { lanzarSiHayErrores, validarTexto } from './validacion.js';

export const LARGO_MAXIMO_MENSAJE = 1000;

export class Mensaje {
  constructor({ id = randomUUID(), usuario, mensaje, enviado = new Date() }) {
    const errores = [];
    if (!usuario) errores.push({ campo: 'usuario', mensaje: 'Es obligatorio' });
    validarTexto(errores, 'mensaje', mensaje, { max: LARGO_MAXIMO_MENSAJE });
    lanzarSiHayErrores(errores, 'El mensaje no es válido');

    this.id = id;
    this.usuario = usuario;
    this.mensaje = mensaje.trim();
    this.enviado = enviado;
  }
}
