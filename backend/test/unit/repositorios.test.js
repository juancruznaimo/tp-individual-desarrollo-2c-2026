import { NoEncontradoError } from '../../src/errors/AppError.js';
import { Compra, Resenia } from '../../src/domain/index.js';
import { crearRepositorios, RepositorioEnMemoria } from '../../src/repositories/index.js';
import { AHORA, enDias, unaCategoria, unEvento, unUsuario } from '../helpers/fabricas.js';

describe('RepositorioEnMemoria', () => {
  test('guarda, busca, filtra y elimina por id', () => {
    const repo = new RepositorioEnMemoria('La cosa');
    const a = repo.guardar({ id: 'a', n: 1 });
    repo.guardar({ id: 'b', n: 2 });

    expect(repo.buscarPorId('a')).toBe(a);
    expect(repo.buscarPorId('x')).toBeNull();
    expect(repo.filtrar((e) => e.n > 1).map((e) => e.id)).toEqual(['b']);
    expect(repo.buscar((e) => e.n === 3)).toBeNull();
    expect(repo.cantidad()).toBe(2);

    expect(repo.eliminar('a')).toBe(true);
    expect(repo.todos().map((e) => e.id)).toEqual(['b']);

    repo.limpiar();
    expect(repo.cantidad()).toBe(0);
  });

  test('obtenerPorId lanza NoEncontradoError con un mensaje legible', () => {
    const repo = new RepositorioEnMemoria('El evento');

    expect(() => repo.obtenerPorId('x')).toThrow(
      new NoEncontradoError('El evento con id x no existe'),
    );
  });

  test('guarda referencias: los cambios en la entidad quedan persistidos', () => {
    const repo = new RepositorioEnMemoria();
    const usuario = repo.guardar(unUsuario());

    usuario.agregarFavorito('e1');

    expect(repo.obtenerPorId(usuario.id).favoritos).toEqual(['e1']);
  });
});

describe('repositorios específicos', () => {
  const repos = crearRepositorios();
  const ana = repos.usuarios.guardar(unUsuario({ email: 'ana@test.com' }));
  const carla = repos.usuarios.guardar(unUsuario());
  const diego = repos.usuarios.guardar(unUsuario());
  repos.categorias.guardar(unaCategoria({ nombre: 'Música' }));
  const lejano = repos.eventos.guardar(unEvento({ organizador: ana, fecha: enDias(30) }));
  const cercano = repos.eventos.guardar(unEvento({ organizador: ana, fecha: enDias(5) }));
  const deOtro = repos.eventos.guardar(unEvento({ organizador: carla }));

  const comprar = (comprador, evento) =>
    repos.compras.guardar(
      Compra.realizar({
        comprador,
        evento,
        tipoEntradaId: evento.tiposEntrada[0].id,
        cantidad: 1,
        ahora: AHORA,
      }),
    );
  const c1 = comprar(carla, lejano);
  const c2 = comprar(carla, cercano);
  const c3 = comprar(diego, lejano);

  const r1 = repos.resenias.guardar(
    new Resenia({
      comprador: carla,
      evento: lejano,
      puntuacion: 4,
      detalle: 'a',
      creadaEn: enDias(1),
    }),
  );
  const r2 = repos.resenias.guardar(
    new Resenia({
      comprador: diego,
      evento: cercano,
      puntuacion: 5,
      detalle: 'b',
      creadaEn: enDias(2),
    }),
  );

  test('usuarios.porEmail no distingue mayúsculas', () => {
    expect(repos.usuarios.porEmail(' ANA@test.com')).toBe(ana);
    expect(repos.usuarios.porEmail('nadie@test.com')).toBeNull();
  });

  test('categorias.porNombre no distingue mayúsculas ni tildes', () => {
    expect(repos.categorias.porNombre('musica').nombre).toBe('Música');
  });

  test('eventos.porOrganizador ordena por fecha', () => {
    expect(repos.eventos.porOrganizador(ana.id)).toEqual([cercano, lejano]);
    expect(repos.eventos.porOrganizador(carla.id)).toEqual([deOtro]);
  });

  test('compras por comprador, por evento y por ambos', () => {
    expect(repos.compras.porComprador(carla.id)).toEqual([c1, c2]);
    expect(repos.compras.porEvento(lejano.id)).toEqual([c1, c3]);
    expect(repos.compras.porCompradorYEvento(diego.id, lejano.id)).toEqual([c3]);
  });

  test('reseñas por evento, por organizador (más nuevas primero) y de un comprador', () => {
    expect(repos.resenias.porEvento(lejano.id)).toEqual([r1]);
    expect(repos.resenias.porOrganizador(ana.id)).toEqual([r2, r1]);
    expect(repos.resenias.porOrganizador(carla.id)).toEqual([]);
    expect(repos.resenias.deCompradorParaEvento(carla.id, lejano.id)).toBe(r1);
    expect(repos.resenias.deCompradorParaEvento(carla.id, cercano.id)).toBeNull();
  });
});
