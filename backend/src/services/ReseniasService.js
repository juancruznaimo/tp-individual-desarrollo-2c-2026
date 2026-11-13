import { ValidacionError } from '../errors/AppError.js';
import { Resenia, verificarQuePuedeReseniar } from '../domain/index.js';
import { aResenia } from '../mappers/index.js';
import { paginar } from './paginacion.js';

export class ReseniasService {
  constructor({ repos, reloj, reputacion }) {
    this.repos = repos;
    this.reloj = reloj;
    this.reputacion = reputacion;
  }

  /** CU-09: primero valida los datos (400) y después si puede reseñar (409). */
  crear(eventoId, datos, comprador) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new ValidacionError('El cuerpo de la solicitud debe ser un objeto');
    }
    const evento = this.repos.eventos.obtenerPorId(eventoId);
    const resenia = new Resenia({
      comprador,
      evento,
      puntuacion: datos.puntuacion,
      detalle: datos.detalle,
      creadaEn: this.reloj.ahora(),
    });

    verificarQuePuedeReseniar({
      comprador,
      evento,
      compras: this.repos.compras.porCompradorYEvento(comprador.id, evento.id),
      yaReseniado: Boolean(this.repos.resenias.deCompradorParaEvento(comprador.id, evento.id)),
    });

    this.repos.resenias.guardar(resenia);
    return aResenia(resenia);
  }

  /** CU-10: reseñas de todos los eventos del organizador, más nuevas primero. */
  deOrganizador(organizadorId, { page, limit } = {}) {
    this.repos.usuarios.obtenerPorId(organizadorId); // 404 si no existe
    return {
      ...this.reputacion.deOrganizador(organizadorId),
      resenias: paginar(this.repos.resenias.porOrganizador(organizadorId).map(aResenia), {
        page,
        limit,
      }),
    };
  }
}
