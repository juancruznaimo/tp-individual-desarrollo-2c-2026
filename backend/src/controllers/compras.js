import { EstadoCompra } from '../domain/index.js';
import { lanzarSiHayErrores, opcion } from './parametros.js';

function parsearEstado(query) {
  const errores = [];
  const estado = opcion(errores, query, 'estado', Object.values(EstadoCompra));
  lanzarSiHayErrores(errores, 'Los parámetros no son válidos');
  return { estado };
}

export function crearComprasController({ compras }) {
  return {
    comprar(req, res) {
      const compra = compras.comprar(req.body, req.usuario);
      res.status(201).location(`/api/compras/${compra.id}`).json(compra);
    },

    deUsuarioActual(req, res) {
      res.json(compras.deComprador(req.usuario, parsearEstado(req.query)));
    },

    detalle(req, res) {
      res.json(compras.detalle(req.params.id, req.usuario));
    },

    pagar(req, res) {
      res.json(compras.pagar(req.params.id, req.usuario));
    },

    cancelar(req, res) {
      res.json(compras.cancelar(req.params.id, req.usuario));
    },

    marcarUtilizada(req, res) {
      res.json(compras.marcarUtilizada(req.params.id, req.usuario));
    },

    deEvento(req, res) {
      res.json(compras.deEvento(req.params.id, req.usuario, parsearEstado(req.query)));
    },
  };
}
