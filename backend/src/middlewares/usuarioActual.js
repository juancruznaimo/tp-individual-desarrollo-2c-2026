import { NoAutenticadoError } from '../errors/AppError.js';

export const HEADER_USUARIO = 'x-user-id';

/**
 * Autenticación simulada: identifica al usuario por el header `X-User-Id` y lo deja
 * en `req.usuario`. Si el header no viene, sigue sin usuario (las rutas que lo
 * necesitan usan `requiereUsuario`). Si viene con un id inexistente responde 401.
 */
export function identificarUsuario(repos) {
  return (req, _res, next) => {
    const id = req.get(HEADER_USUARIO)?.trim();
    req.usuario = null;
    if (id) {
      req.usuario = repos.usuarios.buscarPorId(id);
      if (!req.usuario) return next(new NoAutenticadoError(`El usuario ${id} no existe`));
    }
    next();
  };
}

export function requiereUsuario(req, _res, next) {
  if (!req.usuario) {
    return next(new NoAutenticadoError('Falta el header X-User-Id con el usuario actual'));
  }
  next();
}
