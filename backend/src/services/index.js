import { aCategoria } from '../mappers/index.js';
import { EventosService } from './EventosService.js';
import { ReputacionService } from './ReputacionService.js';
import { UsuariosService } from './UsuariosService.js';

class CategoriasService {
  constructor({ repos }) {
    this.repos = repos;
  }

  listar() {
    return this.repos.categorias
      .todos()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(aCategoria);
  }
}

export function crearServicios({ repos, reloj }) {
  const reputacion = new ReputacionService({ repos });
  const dependencias = { repos, reloj, reputacion };
  return {
    reputacion,
    usuarios: new UsuariosService(dependencias),
    categorias: new CategoriasService(dependencias),
    eventos: new EventosService(dependencias),
  };
}
