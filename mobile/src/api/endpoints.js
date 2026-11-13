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
