import { EstadoCompra } from '../../src/domain/index.js';
import { crearRepositorios } from '../../src/repositories/index.js';
import { cargarDatosDeEjemplo } from '../../src/seed/index.js';

// Se prueba con varios "ahora" (incluido uno de noche) para asegurar que el seed
// siempre respeta las reglas, se levante cuando se levante.
describe.each([
  ['mediodía', new Date('2026-11-12T12:00:00-03:00')],
  ['casi medianoche', new Date('2026-11-12T23:30:00-03:00')],
  ['otro año', new Date('2027-03-01T08:00:00-03:00')],
])('seed de datos de ejemplo (%s)', (_, ahora) => {
  const repos = crearRepositorios();
  const resumen = cargarDatosDeEjemplo(repos, ahora);

  test('carga todas las entidades', () => {
    expect(resumen).toEqual({ categorias: 6, usuarios: 5, eventos: 12, compras: 17, resenias: 4 });
    expect(repos.usuarios.buscarPorId('usr-carla')).not.toBeNull();
  });

  test('hay compras en todos los estados', () => {
    const estados = new Set(repos.compras.todos().map((c) => c.estado));

    expect([...estados].sort()).toEqual(Object.values(EstadoCompra).sort());
  });

  test('hay eventos pasados y futuros', () => {
    const eventos = repos.eventos.todos();

    expect(eventos.filter((e) => e.yaOcurrio(ahora))).toHaveLength(3);
    expect(eventos.filter((e) => !e.yaOcurrio(ahora))).toHaveLength(9);
  });

  test('invariante de cupo: disponibles + vendidas = cupoTotal en cada tipo de entrada', () => {
    const compras = repos.compras.todos();

    repos.eventos.todos().forEach((evento) => {
      evento.tiposEntrada.forEach((tipo) => {
        const vendidas = compras
          .filter((c) => c.tipoEntrada === tipo && c.ocupaCupo())
          .reduce((suma, c) => suma + c.cantidad, 0);

        expect(tipo.cupo + vendidas).toBe(tipo.cupoTotal);
      });
    });
  });

  test('cada reseña corresponde a una compra UTILIZADA de ese evento (RN-08)', () => {
    repos.resenias.todos().forEach((resenia) => {
      const compras = repos.compras.porCompradorYEvento(resenia.comprador.id, resenia.evento.id);

      expect(compras.some((c) => c.estado === EstadoCompra.UTILIZADA)).toBe(true);
    });
  });

  test('todos los mensajes son de participantes de la compra (RN-07)', () => {
    repos.compras.todos().forEach((compra) => {
      compra.mensajes.forEach((m) => expect(compra.participa(m.usuario)).toBe(true));
    });
  });

  test('hay una compra confirmada para un evento de hoy o mañana (demo de días restantes)', () => {
    const dias = repos.compras.todos().map((c) => c.diasRestantes(ahora));

    expect(dias.some((d) => d === 0 || d === 1)).toBe(true);
  });
});
