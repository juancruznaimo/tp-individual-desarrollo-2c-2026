import { normalizarTexto } from '../domain/validacion.js';
import { RepositorioEnMemoria } from './RepositorioEnMemoria.js';

const porFechaAscendente = (a, b) => a.fecha - b.fecha;
const porCreacionDescendente = (a, b) => b.creadaEn - a.creadaEn;

export class UsuariosRepositorio extends RepositorioEnMemoria {
  constructor() {
    super('El usuario');
  }

  porEmail(email) {
    const buscado = String(email).trim().toLowerCase();
    return this.buscar((u) => u.email === buscado);
  }
}

export class CategoriasRepositorio extends RepositorioEnMemoria {
  constructor() {
    super('La categoría');
  }

  porNombre(nombre) {
    const buscado = normalizarTexto(nombre);
    return this.buscar((c) => normalizarTexto(c.nombre) === buscado);
  }
}

export class EventosRepositorio extends RepositorioEnMemoria {
  constructor() {
    super('El evento');
  }

  porOrganizador(usuarioId) {
    return this.filtrar((e) => e.organizador.id === usuarioId).sort(porFechaAscendente);
  }
}

export class ComprasRepositorio extends RepositorioEnMemoria {
  constructor() {
    super('La compra');
  }

  porComprador(usuarioId) {
    return this.filtrar((c) => c.comprador.id === usuarioId);
  }

  porEvento(eventoId) {
    return this.filtrar((c) => c.evento.id === eventoId);
  }

  porCompradorYEvento(usuarioId, eventoId) {
    return this.filtrar((c) => c.comprador.id === usuarioId && c.evento.id === eventoId);
  }
}

export class ReseniasRepositorio extends RepositorioEnMemoria {
  constructor() {
    super('La reseña');
  }

  porEvento(eventoId) {
    return this.filtrar((r) => r.evento.id === eventoId).sort(porCreacionDescendente);
  }

  /** Reseñas de todos los eventos del organizador, de la más nueva a la más vieja. */
  porOrganizador(usuarioId) {
    return this.filtrar((r) => r.evento.organizador.id === usuarioId).sort(porCreacionDescendente);
  }

  deCompradorParaEvento(usuarioId, eventoId) {
    return this.buscar((r) => r.comprador.id === usuarioId && r.evento.id === eventoId);
  }
}

export function crearRepositorios() {
  return {
    usuarios: new UsuariosRepositorio(),
    categorias: new CategoriasRepositorio(),
    eventos: new EventosRepositorio(),
    compras: new ComprasRepositorio(),
    resenias: new ReseniasRepositorio(),
  };
}

export { RepositorioEnMemoria };
