import { ORDENES } from '../services/EventosService.js';
import { booleano, lanzarSiHayErrores, numero, opcion, paginacion, texto } from './parametros.js';

export function crearEventosController({ eventos }) {
  return {
    buscar(req, res) {
      res.json(eventos.buscar(parsearBusqueda(req.query)));
    },

    detalle(req, res) {
      res.json(eventos.detalle(req.params.id, req.usuario));
    },

    crear(req, res) {
      const evento = eventos.crear(req.body, req.usuario);
      res.status(201).location(`/api/eventos/${evento.id}`).json(evento);
    },

    deUsuarioActual(req, res) {
      res.json(eventos.deOrganizador(req.usuario));
    },
  };
}

export function parsearBusqueda(query) {
  const errores = [];
  const filtros = {
    q: texto(query, 'q'),
    categoria: texto(query, 'categoria'),
    precioMin: numero(errores, query, 'precioMin', { min: 0 }),
    precioMax: numero(errores, query, 'precioMax', { min: 0 }),
    orden: opcion(errores, query, 'orden', ORDENES),
    direccion: opcion(errores, query, 'direccion', ['asc', 'desc']),
    incluirPasados: booleano(errores, query, 'incluirPasados'),
    ...paginacion(errores, query),
  };
  if (
    filtros.precioMin !== undefined &&
    filtros.precioMax !== undefined &&
    filtros.precioMin > filtros.precioMax
  ) {
    errores.push({ campo: 'precioMin', mensaje: 'No puede ser mayor que precioMax' });
  }
  lanzarSiHayErrores(errores, 'Los parámetros de búsqueda no son válidos');

  // Los ausentes se omiten para que el servicio aplique sus valores por defecto.
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined));
}
