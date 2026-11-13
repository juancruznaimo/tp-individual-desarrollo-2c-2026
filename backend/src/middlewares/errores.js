import { AppError, NoEncontradoError, ValidacionError } from '../errors/AppError.js';

export function rutaNoEncontrada(req, _res, next) {
  next(new NoEncontradoError(`No existe la ruta ${req.method} ${req.originalUrl}`));
}

// Express reconoce un middleware de errores por tener 4 parámetros.
export function manejadorDeErrores(err, _req, res, _next) {
  let error = err;

  // JSON mal formado en el body (lo lanza express.json()).
  if (err.type === 'entity.parse.failed') {
    error = new ValidacionError('El cuerpo de la solicitud no es un JSON válido');
  }

  if (!(error instanceof AppError)) {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    error = new AppError(500, 'ERROR_INTERNO', 'Ocurrió un error inesperado');
  }

  const cuerpo = { codigo: error.codigo, mensaje: error.message };
  if (error.detalles !== undefined) cuerpo.detalles = error.detalles;

  res.status(error.status).json({ error: cuerpo });
}
