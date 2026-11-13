import { aFecha } from '../domain/validacion.js';
import { lanzarSiHayErrores, paginacion } from './parametros.js';

export function crearMensajesController({ mensajes }) {
  return {
    listar(req, res) {
      res.json(mensajes.listar(req.params.id, req.usuario, parsearDesde(req.query)));
    },

    enviar(req, res) {
      res.status(201).json(mensajes.enviar(req.params.id, req.body, req.usuario));
    },
  };
}

export function crearReseniasController({ resenias }) {
  return {
    crear(req, res) {
      res.status(201).json(resenias.crear(req.params.id, req.body, req.usuario));
    },

    deOrganizador(req, res) {
      const errores = [];
      const pagina = paginacion(errores, req.query);
      lanzarSiHayErrores(errores, 'Los parámetros no son válidos');
      res.json(resenias.deOrganizador(req.params.id, pagina));
    },
  };
}

function parsearDesde(query) {
  if (query.desde === undefined || query.desde === '') return {};
  const desde = aFecha(String(query.desde));
  lanzarSiHayErrores(
    desde ? [] : [{ campo: 'desde', mensaje: 'Debe ser una fecha ISO 8601' }],
    'Los parámetros no son válidos',
  );
  return { desde };
}
