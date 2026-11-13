import { aEventoResumen, aUsuario, aUsuarioResumen } from '../mappers/index.js';

export class UsuariosService {
  constructor({ repos, reloj, reputacion }) {
    this.repos = repos;
    this.reloj = reloj;
    this.reputacion = reputacion;
  }

  /** Para el selector de usuario de la app (autenticación simulada). */
  listar() {
    return this.repos.usuarios
      .todos()
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))
      .map(aUsuarioResumen);
  }

  perfil(usuario) {
    return aUsuario(usuario);
  }

  /** CU-13: favoritos del usuario, en el orden en que los agregó. */
  favoritos(usuario) {
    const ahora = this.reloj.ahora();
    const reputacionDe = this.reputacion.memorizada();
    return usuario.favoritos
      .map((id) => this.repos.eventos.buscarPorId(id))
      .filter(Boolean)
      .map((e) => aEventoResumen(e, { reputacion: reputacionDe(e.organizador.id), ahora }));
  }

  agregarFavorito(usuario, eventoId) {
    this.repos.eventos.obtenerPorId(eventoId); // 404 si no existe
    usuario.agregarFavorito(eventoId);
  }

  quitarFavorito(usuario, eventoId) {
    usuario.quitarFavorito(eventoId);
  }
}
