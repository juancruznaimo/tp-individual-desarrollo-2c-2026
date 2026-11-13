import request from 'supertest';

import { crearApp } from '../../src/app.js';
import { relojFijo } from '../../src/reloj.js';
import { crearRepositorios } from '../../src/repositories/index.js';
import { cargarDatosDeEjemplo } from '../../src/seed/index.js';
import { AHORA } from './fabricas.js';

/**
 * App con los datos de ejemplo y el reloj fijo en AHORA (12/11/2026 12:00 ART).
 * Cada llamada crea repositorios nuevos: los tests no se pisan entre sí.
 */
export function crearAppDePrueba({ ahora = AHORA } = {}) {
  const repos = crearRepositorios();
  cargarDatosDeEjemplo(repos, ahora);
  const app = crearApp({ repos, reloj: relojFijo(ahora) });

  /** Atajos de supertest con el header `X-User-Id` ya puesto. */
  const como = (usuarioId) => ({
    get: (url) => request(app).get(url).set('X-User-Id', usuarioId),
    post: (url) => request(app).post(url).set('X-User-Id', usuarioId),
    put: (url) => request(app).put(url).set('X-User-Id', usuarioId),
    delete: (url) => request(app).delete(url).set('X-User-Id', usuarioId),
  });

  return { app, repos, api: request(app), como };
}

export const ids = (respuesta) => respuesta.body.data.map((e) => e.id);
