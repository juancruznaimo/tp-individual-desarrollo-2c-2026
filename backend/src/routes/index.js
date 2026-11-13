import { Router } from 'express';

import { crearComprasController } from '../controllers/compras.js';
import { crearEventosController } from '../controllers/eventos.js';
import {
  crearMensajesController,
  crearReseniasController,
} from '../controllers/mensajesYResenias.js';
import { crearCategoriasController, crearUsuariosController } from '../controllers/usuarios.js';
import { identificarUsuario, requiereUsuario } from '../middlewares/usuarioActual.js';

/**
 * Rutas de la API (specs/02-api.md). `identificarUsuario` corre en todas: las rutas
 * públicas lo usan si viene (ej. `esFavorito` en el detalle) y las privadas suman
 * `requiereUsuario`.
 */
export function crearRouterApi({ repos, servicios }) {
  const router = Router();
  const usuarios = crearUsuariosController(servicios);
  const categorias = crearCategoriasController(servicios);
  const eventos = crearEventosController(servicios);
  const compras = crearComprasController(servicios);
  const mensajes = crearMensajesController(servicios);
  const resenias = crearReseniasController(servicios);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.use(identificarUsuario(repos));

  // Usuarios
  router.get('/usuarios', usuarios.listar);
  router.get('/usuarios/me', requiereUsuario, usuarios.perfil);
  router.get('/usuarios/me/eventos', requiereUsuario, eventos.deUsuarioActual);
  router.get('/usuarios/me/compras', requiereUsuario, compras.deUsuarioActual);
  router.get('/usuarios/me/favoritos', requiereUsuario, usuarios.favoritos);
  router.put('/usuarios/me/favoritos/:eventoId', requiereUsuario, usuarios.agregarFavorito);
  router.delete('/usuarios/me/favoritos/:eventoId', requiereUsuario, usuarios.quitarFavorito);

  // Categorías
  router.get('/categorias', categorias.listar);

  // Eventos
  router.get('/eventos', eventos.buscar);
  router.post('/eventos', requiereUsuario, eventos.crear);
  router.get('/eventos/:id', eventos.detalle);
  router.get('/eventos/:id/compras', requiereUsuario, compras.deEvento);
  router.post('/eventos/:id/resenias', requiereUsuario, resenias.crear);

  // Reseñas de un organizador (pública)
  router.get('/organizadores/:id/resenias', resenias.deOrganizador);

  // Compras
  router.post('/compras', requiereUsuario, compras.comprar);
  router.get('/compras/:id', requiereUsuario, compras.detalle);
  router.post('/compras/:id/pago', requiereUsuario, compras.pagar);
  router.post('/compras/:id/cancelacion', requiereUsuario, compras.cancelar);
  router.post('/compras/:id/uso', requiereUsuario, compras.marcarUtilizada);

  // Chat de la compra
  router.get('/compras/:id/mensajes', requiereUsuario, mensajes.listar);
  router.post('/compras/:id/mensajes', requiereUsuario, mensajes.enviar);

  return router;
}
