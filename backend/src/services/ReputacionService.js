import { calcularPuntaje } from '../domain/index.js';

/** Puntaje de los organizadores (RN-10), calculado a partir de las reseñas guardadas. */
export class ReputacionService {
  constructor({ repos }) {
    this.repos = repos;
  }

  deOrganizador(organizadorId) {
    return calcularPuntaje(this.repos.resenias.porOrganizador(organizadorId));
  }

  /**
   * Devuelve una función `organizadorId → reputación` que calcula cada organizador
   * una sola vez. Sirve para listados con muchos eventos del mismo organizador.
   */
  memorizada() {
    const cache = new Map();
    return (organizadorId) => {
      if (!cache.has(organizadorId)) cache.set(organizadorId, this.deOrganizador(organizadorId));
      return cache.get(organizadorId);
    };
  }
}
