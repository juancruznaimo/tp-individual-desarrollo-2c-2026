export function crearUsuariosController({ usuarios }) {
  return {
    listar(_req, res) {
      res.json(usuarios.listar());
    },

    perfil(req, res) {
      res.json(usuarios.perfil(req.usuario));
    },

    favoritos(req, res) {
      res.json(usuarios.favoritos(req.usuario));
    },

    agregarFavorito(req, res) {
      usuarios.agregarFavorito(req.usuario, req.params.eventoId);
      res.status(204).end();
    },

    quitarFavorito(req, res) {
      usuarios.quitarFavorito(req.usuario, req.params.eventoId);
      res.status(204).end();
    },
  };
}

export function crearCategoriasController({ categorias }) {
  return {
    listar(_req, res) {
      res.json(categorias.listar());
    },
  };
}
