import { AccionCompra, Compra, EstadoCompra, RolCompra } from '../../../src/domain/index.js';
import { AHORA, enDias, unEvento, unUsuario } from '../../helpers/fabricas.js';

const { PAGAR, CANCELAR, MARCAR_UTILIZADA, RESENIAR } = AccionCompra;
const { CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

function escenario(camino = [], { fechaEvento = enDias(10) } = {}) {
  const organizador = unUsuario();
  const comprador = unUsuario();
  const tercero = unUsuario();
  const evento = unEvento({ organizador, fecha: fechaEvento });
  const compra = Compra.realizar({
    comprador,
    evento,
    tipoEntradaId: evento.tiposEntrada[0].id,
    cantidad: 1,
    ahora: AHORA,
  });
  camino.forEach((estado) => compra.actualizarEstado(estado, null, AHORA));
  return { compra, organizador, comprador, tercero };
}

describe('Compra: roles y acciones', () => {
  test('rolDe', () => {
    const { compra, organizador, comprador, tercero } = escenario();

    expect(compra.rolDe(comprador)).toBe(RolCompra.COMPRADOR);
    expect(compra.rolDe(organizador)).toBe(RolCompra.ORGANIZADOR);
    expect(compra.rolDe(tercero)).toBeNull();
    expect(compra.rolDe(null)).toBeNull();
  });

  test.each([
    ['PENDIENTE', [], [PAGAR, CANCELAR], []],
    ['CONFIRMADA', [CONFIRMADA], [CANCELAR], [MARCAR_UTILIZADA]],
    ['UTILIZADA', [CONFIRMADA, UTILIZADA], [RESENIAR], []],
    ['CANCELADA', [CANCELADA], [], []],
    ['REEMBOLSADA', [CONFIRMADA, CANCELADA, REEMBOLSADA], [], []],
  ])('%s: comprador %p, organizador %p', (_, camino, delComprador, delOrganizador) => {
    const { compra, organizador, comprador, tercero } = escenario(camino);

    expect(compra.accionesPara(comprador, AHORA)).toEqual(delComprador);
    expect(compra.accionesPara(organizador, AHORA)).toEqual(delOrganizador);
    expect(compra.accionesPara(tercero, AHORA)).toEqual([]);
  });

  test('si el evento ya ocurrió, el comprador no puede pagar ni cancelar', () => {
    const { compra, comprador } = escenario([], { fechaEvento: enDias(1) });

    expect(compra.accionesPara(comprador, enDias(2))).toEqual([]);
  });

  test('el organizador puede marcar como utilizada aunque el evento haya pasado', () => {
    const { compra, organizador } = escenario([CONFIRMADA], { fechaEvento: enDias(1) });

    expect(compra.accionesPara(organizador, enDias(2))).toEqual([MARCAR_UTILIZADA]);
  });

  test('una compra utilizada ya reseñada no ofrece reseñar', () => {
    const { compra, comprador } = escenario([CONFIRMADA, UTILIZADA]);

    expect(compra.accionesPara(comprador, AHORA, { yaReseniada: true })).toEqual([]);
  });
});
