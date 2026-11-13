import {
  NoEncontradoError,
  ProhibidoError,
  ReglaNegocioError,
  SinCupoError,
  TransicionInvalidaError,
  ValidacionError,
} from '../../../src/errors/AppError.js';
import { Compra, EstadoCompra, Mensaje } from '../../../src/domain/index.js';
import { AHORA, enDias, unEvento, unUsuario } from '../../helpers/fabricas.js';

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

function escenario({ fechaEvento = enDias(10), precio = 15000, cupo = 10 } = {}) {
  const organizador = unUsuario({ nombre: 'Org' });
  const comprador = unUsuario({ nombre: 'Comp' });
  const tercero = unUsuario({ nombre: 'Otro' });
  const evento = unEvento({
    organizador,
    fecha: fechaEvento,
    tiposEntrada: [{ nombre: 'General', precio, cupo }],
  });
  const [tipo] = evento.tiposEntrada;
  const comprar = (cantidad = 2, quien = comprador) =>
    Compra.realizar({ comprador: quien, evento, tipoEntradaId: tipo.id, cantidad, ahora: AHORA });
  return { organizador, comprador, tercero, evento, tipo, comprar };
}

describe('Compra', () => {
  describe('Compra.realizar (CU-12)', () => {
    test('crea la compra PENDIENTE, calcula el total y reserva el cupo', () => {
      const { comprar, tipo, comprador } = escenario({ precio: 15000.5, cupo: 10 });

      const compra = comprar(3);

      expect(compra.estado).toBe(PENDIENTE);
      expect(compra.total).toBe(45001.5);
      expect(tipo.cupo).toBe(7);
      expect(compra.historial).toHaveLength(1);
      expect(compra.historial[0]).toMatchObject({
        estado: PENDIENTE,
        quien: comprador,
        fechaHora: AHORA,
      });
    });

    test('se puede comprar exactamente el cupo restante, pero no uno más', () => {
      const { comprar, tipo } = escenario({ cupo: 4 });

      comprar(3);
      expect(() => comprar(2)).toThrow(SinCupoError);
      expect(tipo.cupo).toBe(1);

      comprar(1);
      expect(tipo.cupo).toBe(0);
    });

    test.each([0, 11, 2.5, '2', null])('rechaza cantidad %p sin tocar el cupo', (cantidad) => {
      const { comprar, tipo } = escenario({ cupo: 100 });

      expect(() => comprar(cantidad)).toThrow(ValidacionError);
      expect(tipo.cupo).toBe(100);
    });

    test('no se puede comprar un evento que ya ocurrió', () => {
      const { comprar } = escenario({ fechaEvento: enDias(-1) });

      expect(() => comprar()).toThrow(new ReglaNegocioError('El evento ya se realizó'));
    });

    test('el organizador no puede comprar entradas de su propio evento (RN-09)', () => {
      const { comprar, organizador } = escenario();

      expect(() => comprar(1, organizador)).toThrow(ReglaNegocioError);
    });

    test('el tipo de entrada tiene que ser del evento', () => {
      const { evento, comprador } = escenario();

      expect(() =>
        Compra.realizar({ comprador, evento, tipoEntradaId: 'otro', cantidad: 1, ahora: AHORA }),
      ).toThrow(NoEncontradoError);
    });

    test('el constructor valida que el tipo pertenezca al evento', () => {
      const { evento, comprador } = escenario();
      const otroTipo = unEvento().tiposEntrada[0];

      expect(() => new Compra({ comprador, evento, tipoEntrada: otroTipo, cantidad: 1 })).toThrow(
        ValidacionError,
      );
      expect(() => new Compra({ cantidad: 1 })).toThrow(ValidacionError);
    });
  });

  describe('máquina de estados (actualizarEstado)', () => {
    const transicionesValidas = [
      [[], CONFIRMADA],
      [[], CANCELADA],
      [[CONFIRMADA], UTILIZADA],
      [[CONFIRMADA], CANCELADA],
      [[CONFIRMADA, CANCELADA], REEMBOLSADA],
    ];

    test.each(transicionesValidas)('desde %p puede pasar a %s', (camino, destino) => {
      const { comprar, organizador } = escenario();
      const compra = comprar();
      camino.forEach((estado) => compra.actualizarEstado(estado, organizador, AHORA));

      compra.actualizarEstado(destino, organizador, AHORA);

      expect(compra.estado).toBe(destino);
    });

    const transicionesInvalidas = [
      [[], UTILIZADA],
      [[], REEMBOLSADA],
      [[], PENDIENTE],
      [[CONFIRMADA], PENDIENTE],
      [[CONFIRMADA], REEMBOLSADA],
      [[CONFIRMADA, UTILIZADA], CANCELADA],
      [[CONFIRMADA, UTILIZADA], REEMBOLSADA],
      [[CANCELADA], REEMBOLSADA], // nunca se pagó
      [[CANCELADA], CONFIRMADA],
      [[CONFIRMADA, CANCELADA, REEMBOLSADA], CONFIRMADA],
      [[], 'INEXISTENTE'],
    ];

    test.each(transicionesInvalidas)('desde %p NO puede pasar a %s', (camino, destino) => {
      const { comprar } = escenario();
      const compra = comprar();
      camino.forEach((estado) => compra.actualizarEstado(estado, null, AHORA));
      const estadoPrevio = compra.estado;
      const largoHistorial = compra.historial.length;

      expect(() => compra.actualizarEstado(destino, null, AHORA)).toThrow(TransicionInvalidaError);
      expect(compra.estado).toBe(estadoPrevio);
      expect(compra.historial).toHaveLength(largoHistorial);
    });

    test('cada cambio queda registrado en el historial con quién y cuándo', () => {
      const { comprar, comprador, organizador } = escenario();
      const compra = comprar();

      compra.actualizarEstado(CONFIRMADA, comprador, enDias(1));
      compra.actualizarEstado(UTILIZADA, organizador, enDias(2));

      expect(
        compra.historial.map(({ estado, quien, fechaHora }) => [estado, quien, fechaHora]),
      ).toEqual([
        [PENDIENTE, comprador, AHORA],
        [CONFIRMADA, comprador, enDias(1)],
        [UTILIZADA, organizador, enDias(2)],
      ]);
      compra.historial.forEach((cambio) => expect(cambio.compra).toBe(compra));
    });

    test('pasar a CANCELADA repone el cupo (RN-03)', () => {
      const { comprar, tipo } = escenario({ cupo: 10 });
      const compra = comprar(4);

      compra.actualizarEstado(CANCELADA, null, AHORA);

      expect(tipo.cupo).toBe(10);
      expect(compra.ocupaCupo()).toBe(false);
    });
  });

  describe('pagar', () => {
    test('el comprador confirma la compra', () => {
      const { comprar, comprador } = escenario();
      const compra = comprar();

      compra.pagar(comprador, AHORA);

      expect(compra.estado).toBe(CONFIRMADA);
      expect(compra.fuePagada()).toBe(true);
    });

    test('nadie más que el comprador puede pagar', () => {
      const { comprar, organizador } = escenario();

      expect(() => comprar().pagar(organizador, AHORA)).toThrow(ProhibidoError);
    });

    test('no se puede pagar dos veces', () => {
      const { comprar, comprador } = escenario();
      const compra = comprar();
      compra.pagar(comprador, AHORA);

      expect(() => compra.pagar(comprador, AHORA)).toThrow(TransicionInvalidaError);
    });

    test('no se puede pagar si el evento ya ocurrió', () => {
      const { comprar, comprador, evento } = escenario();
      const compra = comprar();

      expect(() => compra.pagar(comprador, enDias(1, evento.fecha))).toThrow(ReglaNegocioError);
    });
  });

  describe('cancelar (CU-07, CU-08)', () => {
    test('una compra PENDIENTE queda CANCELADA, sin reembolso', () => {
      const { comprar, comprador, tipo } = escenario({ cupo: 10 });
      const compra = comprar(2);

      compra.cancelar(comprador, AHORA);

      expect(compra.estado).toBe(CANCELADA);
      expect(compra.historial.map((c) => c.estado)).toEqual([PENDIENTE, CANCELADA]);
      expect(tipo.cupo).toBe(10);
    });

    test('una compra CONFIRMADA se reembolsa automáticamente', () => {
      const { comprar, comprador, tipo } = escenario({ cupo: 10 });
      const compra = comprar(2);
      compra.pagar(comprador, AHORA);

      compra.cancelar(comprador, enDias(1));

      expect(compra.estado).toBe(REEMBOLSADA);
      expect(compra.historial.map(({ estado, quien }) => [estado, quien])).toEqual([
        [PENDIENTE, comprador],
        [CONFIRMADA, comprador],
        [CANCELADA, comprador],
        [REEMBOLSADA, null], // lo hace el sistema
      ]);
      expect(tipo.cupo).toBe(10);
    });

    test('no se puede cancelar una compra UTILIZADA', () => {
      const { comprar, comprador, organizador } = escenario();
      const compra = comprar();
      compra.pagar(comprador, AHORA);
      compra.marcarUtilizada(organizador, AHORA);

      expect(compra.puedeCancelarse(AHORA)).toBe(false);
      expect(() => compra.cancelar(comprador, AHORA)).toThrow(
        new ReglaNegocioError('La compra ya fue utilizada'),
      );
    });

    test('no se puede cancelar si el evento ya se realizó', () => {
      const { comprar, comprador, evento } = escenario();
      const compra = comprar();
      compra.pagar(comprador, AHORA);
      const despues = enDias(1, evento.fecha);

      expect(compra.puedeCancelarse(despues)).toBe(false);
      expect(() => compra.cancelar(comprador, despues)).toThrow(
        new ReglaNegocioError('El evento ya se realizó'),
      );
      expect(compra.estado).toBe(CONFIRMADA);
    });

    test('no se puede cancelar dos veces', () => {
      const { comprar, comprador } = escenario();
      const compra = comprar();
      compra.cancelar(comprador, AHORA);

      expect(() => compra.cancelar(comprador, AHORA)).toThrow(
        new ReglaNegocioError('La compra ya está cancelada'),
      );
    });

    test('solo el comprador puede cancelar', () => {
      const { comprar, organizador } = escenario();

      expect(() => comprar().cancelar(organizador, AHORA)).toThrow(ProhibidoError);
    });

    test.each([
      [[], true],
      [[CONFIRMADA], true],
      [[CONFIRMADA, UTILIZADA], false],
      [[CANCELADA], false],
      [[CONFIRMADA, CANCELADA, REEMBOLSADA], false],
    ])('puedeCancelarse con evento futuro, camino %p → %p', (camino, esperado) => {
      const { comprar } = escenario();
      const compra = comprar();
      camino.forEach((estado) => compra.actualizarEstado(estado, null, AHORA));

      expect(compra.puedeCancelarse(AHORA)).toBe(esperado);
    });
  });

  describe('marcarUtilizada', () => {
    test('el organizador marca como utilizada una compra confirmada', () => {
      const { comprar, comprador, organizador } = escenario();
      const compra = comprar();
      compra.pagar(comprador, AHORA);

      compra.marcarUtilizada(organizador, AHORA);

      expect(compra.estado).toBe(UTILIZADA);
      expect(compra.ocupaCupo()).toBe(true);
    });

    test('el comprador no puede marcarla', () => {
      const { comprar, comprador } = escenario();
      const compra = comprar();
      compra.pagar(comprador, AHORA);

      expect(() => compra.marcarUtilizada(comprador, AHORA)).toThrow(ProhibidoError);
    });

    test('una compra pendiente no se puede utilizar', () => {
      const { comprar, organizador } = escenario();

      expect(() => comprar().marcarUtilizada(organizador, AHORA)).toThrow(TransicionInvalidaError);
    });
  });

  describe('diasRestantes (CU-01)', () => {
    function confirmadaPara(fechaEvento, ahora) {
      const { comprar, comprador } = escenario({ fechaEvento });
      const compra = comprar();
      compra.pagar(comprador, AHORA);
      return compra.diasRestantes(ahora);
    }

    test('cuenta días calendario', () => {
      expect(confirmadaPara(new Date('2026-11-22T21:00:00-03:00'), AHORA)).toBe(10);
    });

    test('el mismo día devuelve 0', () => {
      expect(confirmadaPara(new Date('2026-11-12T23:00:00-03:00'), AHORA)).toBe(0);
    });

    test('mañana devuelve 1 aunque falten menos de 24 horas', () => {
      const ahora = new Date('2026-11-12T23:50:00-03:00');

      expect(confirmadaPara(new Date('2026-11-13T00:30:00-03:00'), ahora)).toBe(1);
    });

    test('usa la zona horaria de Buenos Aires, no la de UTC', () => {
      // 13/11 01:00 UTC es todavía 12/11 22:00 en Argentina.
      const ahora = new Date('2026-11-13T01:00:00Z');

      expect(confirmadaPara(new Date('2026-11-12T23:30:00-03:00'), ahora)).toBe(0);
    });

    test('si el evento ya pasó de día devuelve null', () => {
      expect(confirmadaPara(enDias(5), enDias(7))).toBeNull();
    });

    test.each([
      [[]],
      [[CANCELADA]],
      [[CONFIRMADA, UTILIZADA]],
      [[CONFIRMADA, CANCELADA, REEMBOLSADA]],
    ])('una compra no confirmada (camino %p) devuelve null', (camino) => {
      const { comprar } = escenario();
      const compra = comprar();
      camino.forEach((estado) => compra.actualizarEstado(estado, null, AHORA));

      expect(compra.diasRestantes(AHORA)).toBeNull();
    });
  });

  describe('chat (CU-05, CU-06)', () => {
    test('comprador y organizador participan; un tercero no', () => {
      const { comprar, comprador, organizador, tercero } = escenario();
      const compra = comprar();

      expect(compra.participa(comprador)).toBe(true);
      expect(compra.participa(organizador)).toBe(true);
      expect(compra.participa(tercero)).toBe(false);
      expect(compra.participa(null)).toBe(false);
    });

    test('los participantes pueden escribir en cualquier estado', () => {
      const { comprar, comprador, organizador } = escenario();
      const compra = comprar();
      compra.cancelar(comprador, AHORA);

      compra.agregarMensaje(comprador, '  ¿Me devuelven la plata?  ', AHORA);
      compra.agregarMensaje(organizador, 'No hacía falta, no estaba pagada.', enDias(1));

      expect(compra.mensajes).toHaveLength(2);
      expect(compra.mensajes[0]).toBeInstanceOf(Mensaje);
      expect(compra.mensajes[0]).toMatchObject({
        usuario: comprador,
        mensaje: '¿Me devuelven la plata?',
        enviado: AHORA,
      });
    });

    test('un tercero no puede escribir', () => {
      const { comprar, tercero } = escenario();

      expect(() => comprar().agregarMensaje(tercero, 'hola', AHORA)).toThrow(ProhibidoError);
    });

    test.each(['', '   ', 'x'.repeat(1001), undefined])('rechaza el mensaje %p', (texto) => {
      const { comprar, comprador } = escenario();
      const compra = comprar();

      expect(() => compra.agregarMensaje(comprador, texto, AHORA)).toThrow(ValidacionError);
      expect(compra.mensajes).toHaveLength(0);
    });
  });
});
