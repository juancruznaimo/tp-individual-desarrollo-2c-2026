import { request } from './client';

/** Una función por endpoint de la API (specs/02-api.md). */

// Sistema
export const obtenerHealth = () => request('/health');

// Usuarios
export const listarUsuarios = () => request('/usuarios');
export const obtenerPerfil = () => request('/usuarios/me');
export const listarFavoritos = () => request('/usuarios/me/favoritos');
export const agregarFavorito = (eventoId) =>
  request(`/usuarios/me/favoritos/${encodeURIComponent(eventoId)}`, { method: 'PUT' });
export const quitarFavorito = (eventoId) =>
  request(`/usuarios/me/favoritos/${encodeURIComponent(eventoId)}`, { method: 'DELETE' });

// Categorías y eventos
export const listarCategorias = () => request('/categorias');

/** @param {{ q?, categoria?, precioMin?, precioMax?, orden?, direccion?, page?, limit? }} filtros */
export const buscarEventos = (filtros) => request('/eventos', { query: filtros });

export const obtenerEvento = (id) => request(`/eventos/${encodeURIComponent(id)}`);

export const reseniasDeOrganizador = (organizadorId, { page = 1, limit = 10 } = {}) =>
  request(`/organizadores/${encodeURIComponent(organizadorId)}/resenias`, {
    query: { page, limit },
  });

// Compras
export const comprar = ({ eventoId, tipoEntradaId, cantidad }) =>
  request('/compras', { method: 'POST', body: { eventoId, tipoEntradaId, cantidad } });

export const obtenerCompra = (id) => request(`/compras/${encodeURIComponent(id)}`);

export const misCompras = (filtros = {}) => request('/usuarios/me/compras', { query: filtros });

export const pagarCompra = (id) =>
  request(`/compras/${encodeURIComponent(id)}/pago`, { method: 'POST' });

export const cancelarCompra = (id) =>
  request(`/compras/${encodeURIComponent(id)}/cancelacion`, { method: 'POST' });

export const marcarCompraUtilizada = (id) =>
  request(`/compras/${encodeURIComponent(id)}/uso`, { method: 'POST' });

// Mensajes
export const listarMensajes = (id, desde) =>
  request(`/compras/${encodeURIComponent(id)}/mensajes`, { query: { desde } });

export const enviarMensaje = (id, mensaje) =>
  request(`/compras/${encodeURIComponent(id)}/mensajes`, { method: 'POST', body: { mensaje } });

// Reseñas
export const reseniarEvento = (eventoId, { puntuacion, detalle }) =>
  request(`/eventos/${encodeURIComponent(eventoId)}/resenias`, {
    method: 'POST',
    body: { puntuacion, detalle },
  });
