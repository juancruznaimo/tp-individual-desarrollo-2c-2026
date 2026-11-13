import { Router } from 'express';

import { crearEventosController } from '../controllers/eventos.js';
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

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.use(identificarUsuario(repos));

  // Usuarios
  router.get('/usuarios', usuarios.listar);
  router.get('/usuarios/me', requiereUsuario, usuarios.perfil);
  router.get('/usuarios/me/eventos', requiereUsuario, eventos.deUsuarioActual);
  router.get('/usuarios/me/favoritos', requiereUsuario, usuarios.favoritos);
  router.put('/usuarios/me/favoritos/:eventoId', requiereUsuario, usuarios.agregarFavorito);
  router.delete('/usuarios/me/favoritos/:eventoId', requiereUsuario, usuarios.quitarFavorito);

  // Categorías
  router.get('/categorias', categorias.listar);

  // Eventos
  router.get('/eventos', eventos.buscar);
  router.post('/eventos', requiereUsuario, eventos.crear);
  router.get('/eventos/:id', eventos.detalle);

  return router;
}
