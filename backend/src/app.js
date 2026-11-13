import cors from 'cors';
import express from 'express';

import { manejadorDeErrores, rutaNoEncontrada } from './middlewares/errores.js';
import { relojDelSistema } from './reloj.js';
import { crearRepositorios } from './repositories/index.js';
import { crearRouterApi } from './routes/index.js';
import { crearServicios } from './services/index.js';

/**
 * Construye la app de Express sin ponerla a escuchar, para poder usarla en los tests.
 *
 * @param {object} [dependencias]
 * @param {ReturnType<typeof crearRepositorios>} [dependencias.repos]  repositorios en memoria
 * @param {{ ahora: () => Date }} [dependencias.reloj]  fuente de la hora actual
 */
export function crearApp({ repos = crearRepositorios(), reloj = relojDelSistema } = {}) {
  const app = express();

  app.disable('x-powered-by');
  const servicios = crearServicios({ repos, reloj });
  app.locals.repos = repos;
  app.locals.servicios = servicios;

  app.use(cors());
  app.use(express.json());

  app.use('/api', crearRouterApi({ repos, servicios }));

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);

  return app;
}
