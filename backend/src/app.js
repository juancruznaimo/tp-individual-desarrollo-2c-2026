import cors from 'cors';
import express from 'express';

import { manejadorDeErrores, rutaNoEncontrada } from './middlewares/errores.js';
import { crearRouterApi } from './routes/index.js';

/**
 * Construye la app de Express sin ponerla a escuchar, para poder usarla en los tests.
 */
export function crearApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());

  app.use('/api', crearRouterApi());

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);

  return app;
}
