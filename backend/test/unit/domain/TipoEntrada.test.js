import { SinCupoError, ValidacionError } from '../../../src/errors/AppError.js';
import { TipoEntrada } from '../../../src/domain/index.js';
import { unTipoEntrada } from '../../helpers/fabricas.js';

describe('TipoEntrada', () => {
  describe('construcción', () => {
    test('el cupo total arranca igual al cupo', () => {
      const tipo = unTipoEntrada({ cupo: 50 });

      expect(tipo.cupo).toBe(50);
      expect(tipo.cupoTotal).toBe(50);
      expect(tipo.vendidas).toBe(0);
    });

    test.each([
      [{ precio: -1 }, 'precio'],
      [{ precio: 10.555 }, 'precio'],
      [{ precio: '100' }, 'precio'],
      [{ cupo: 0 }, 'cupo'],
      [{ cupo: 1.5 }, 'cupo'],
      [{ cupo: 5, cupoTotal: 3 }, 'cupo'],
      [{ nombre: '   ' }, 'nombre'],
    ])('rechaza %o (campo %s)', (datos, campo) => {
      expect(() => unTipoEntrada(datos)).toThrow(ValidacionError);
      expect(TipoEntrada.validar({ nombre: 'General', precio: 1, cupo: 1, ...datos })).toEqual(
        expect.arrayContaining([expect.objectContaining({ campo })]),
      );
    });

    test('acepta precio 0 (evento gratuito) y 2 decimales', () => {
      expect(unTipoEntrada({ precio: 0 }).precio).toBe(0);
      expect(unTipoEntrada({ precio: 1234.56 }).precio).toBe(1234.56);
    });
  });

  describe('hayCupoPara', () => {
    const tipo = unTipoEntrada({ cupo: 5 });

    test.each([
      [1, true],
      [5, true], // exactamente el cupo
      [6, false],
      [0, false],
      [-1, false],
      [2.5, false],
    ])('con cupo 5, hayCupoPara(%p) = %p', (cantidad, esperado) => {
      expect(tipo.hayCupoPara(cantidad)).toBe(esperado);
    });

    test('con cupo 0 no hay lugar para nadie', () => {
      const agotado = unTipoEntrada({ cupo: 0, cupoTotal: 10 });

      expect(agotado.hayCupoPara(1)).toBe(false);
      expect(agotado.agotado).toBe(true);
    });
  });

  describe('reservar y liberar', () => {
    test('reservar descuenta el cupo', () => {
      const tipo = unTipoEntrada({ cupo: 10 });

      tipo.reservar(4);

      expect(tipo.cupo).toBe(6);
      expect(tipo.vendidas).toBe(4);
    });

    test('reservar todo el cupo lo deja agotado', () => {
      const tipo = unTipoEntrada({ cupo: 3 });

      tipo.reservar(3);

      expect(tipo.agotado).toBe(true);
    });

    test('reservar más del cupo lanza SinCupoError y no modifica el cupo', () => {
      const tipo = unTipoEntrada({ nombre: 'VIP', cupo: 3 });

      expect(() => tipo.reservar(5)).toThrow(SinCupoError);
      expect(() => tipo.reservar(5)).toThrow('Quedan 3 entradas de tipo VIP y se pidieron 5');
      expect(tipo.cupo).toBe(3);
    });

    test('liberar repone el cupo sin superar el total', () => {
      const tipo = unTipoEntrada({ cupo: 10 });
      tipo.reservar(4);

      tipo.liberar(4);
      expect(tipo.cupo).toBe(10);

      tipo.liberar(5);
      expect(tipo.cupo).toBe(10);
    });
  });
});
