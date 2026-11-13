import { ReglaNegocioError } from '../../../src/errors/AppError.js';
import { Compra, EstadoCompra, verificarQuePuedeReseniar } from '../../../src/domain/index.js';
import { AHORA, unEvento, unUsuario } from '../../helpers/fabricas.js';

const { CONFIRMADA, UTILIZADA, CANCELADA } = EstadoCompra;

function escenario(caminos) {
  const organizador = unUsuario();
  const comprador = unUsuario();
  const evento = unEvento({ organizador });
  const compras = caminos.map((camino) => {
    const compra = Compra.realizar({
      comprador,
      evento,
      tipoEntradaId: evento.tiposEntrada[0].id,
      cantidad: 1,
      ahora: AHORA,
    });
    camino.forEach((estado) => compra.actualizarEstado(estado, null, AHORA));
    return compra;
  });
  return { organizador, comprador, evento, compras };
}

describe('verificarQuePuedeReseniar (RN-08, RN-09)', () => {
  test('con una compra UTILIZADA puede reseñar', () => {
    const { comprador, evento, compras } = escenario([[CONFIRMADA, UTILIZADA]]);

    expect(() =>
      verificarQuePuedeReseniar({ comprador, evento, compras, yaReseniado: false }),
    ).not.toThrow();
  });

  test('alcanza con que una de sus compras esté UTILIZADA', () => {
    const { comprador, evento, compras } = escenario([[CANCELADA], [CONFIRMADA, UTILIZADA]]);

    expect(() =>
      verificarQuePuedeReseniar({ comprador, evento, compras, yaReseniado: false }),
    ).not.toThrow();
  });

  test.each([[[]], [[[]]], [[[CONFIRMADA]]], [[[CANCELADA]]]])(
    'sin compras UTILIZADAS (%j) no puede',
    (caminos) => {
      const { comprador, evento, compras } = escenario(caminos);

      expect(() =>
        verificarQuePuedeReseniar({ comprador, evento, compras, yaReseniado: false }),
      ).toThrow(
        new ReglaNegocioError(
          'Solo podés reseñar eventos a los que asististe (con una entrada utilizada)',
        ),
      );
    },
  );

  test('no puede reseñar dos veces', () => {
    const { comprador, evento, compras } = escenario([[CONFIRMADA, UTILIZADA]]);

    expect(() =>
      verificarQuePuedeReseniar({ comprador, evento, compras, yaReseniado: true }),
    ).toThrow(new ReglaNegocioError('Ya reseñaste este evento'));
  });

  test('el organizador no puede reseñar su evento', () => {
    const { organizador, evento } = escenario([]);

    expect(() =>
      verificarQuePuedeReseniar({
        comprador: organizador,
        evento,
        compras: [],
        yaReseniado: false,
      }),
    ).toThrow(new ReglaNegocioError('No podés reseñar tu propio evento'));
  });
});
