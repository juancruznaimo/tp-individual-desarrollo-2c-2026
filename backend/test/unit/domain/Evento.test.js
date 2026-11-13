import { NoEncontradoError, ValidacionError } from '../../../src/errors/AppError.js';
import { TipoEntrada } from '../../../src/domain/index.js';
import { AHORA, enDias, unaCategoria, unEvento, unUsuario } from '../../helpers/fabricas.js';

/** Ejecuta `fn` y devuelve los `detalles` del ValidacionError que lanza. */
function erroresDe(fn) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ValidacionError);
    return error.detalles;
  }
  throw new Error('Se esperaba un ValidacionError');
}

describe('Evento', () => {
  describe('construcción y validaciones', () => {
    test('convierte los tipos de entrada en instancias de TipoEntrada', () => {
      const evento = unEvento({
        tiposEntrada: [
          { nombre: 'Campo', precio: 100, cupo: 10 },
          { nombre: 'Platea', precio: 200, cupo: 5 },
        ],
      });

      expect(evento.tiposEntrada).toHaveLength(2);
      evento.tiposEntrada.forEach((t) => expect(t).toBeInstanceOf(TipoEntrada));
    });

    test('acepta la fecha como string ISO', () => {
      const evento = unEvento({ fecha: '2026-12-20T21:00:00-03:00' });

      expect(evento.fecha).toEqual(new Date('2026-12-21T00:00:00Z'));
    });

    test('junta todos los errores con el nombre del campo', () => {
      const errores = erroresDe(() =>
        unEvento({
          nombre: 'ab',
          descripcion: '',
          lugar: undefined,
          categoria: null,
          fecha: 'no es una fecha',
          multimedia: ['ftp://archivo', 'https://ok.com/img.jpg'],
        }),
      );

      expect(errores.map((e) => e.campo)).toEqual(
        expect.arrayContaining([
          'nombre',
          'descripcion',
          'lugar',
          'categoriaId',
          'fecha',
          'multimedia[0]',
        ]),
      );
      expect(errores.map((e) => e.campo)).not.toContain('multimedia[1]');
    });

    test('exige al menos un tipo de entrada', () => {
      expect(erroresDe(() => unEvento({ tiposEntrada: [] }))).toEqual([
        { campo: 'tiposEntrada', mensaje: 'Debe tener al menos un tipo de entrada' },
      ]);
    });

    test('prefija los errores de cada tipo de entrada con su posición', () => {
      const errores = erroresDe(() =>
        unEvento({
          tiposEntrada: [
            { nombre: 'Campo', precio: 100, cupo: 10 },
            { nombre: 'Platea', precio: -5, cupo: 0 },
            null,
          ],
        }),
      );

      expect(errores.map((e) => e.campo)).toEqual([
        'tiposEntrada[1].precio',
        'tiposEntrada[1].cupo',
        'tiposEntrada[2]',
      ]);
    });

    test('no permite nombres de tipo repetidos (sin importar mayúsculas ni tildes)', () => {
      const errores = erroresDe(() =>
        unEvento({
          tiposEntrada: [
            { nombre: 'Platea', precio: 100, cupo: 10 },
            { nombre: 'PLATEA ', precio: 200, cupo: 10 },
          ],
        }),
      );

      expect(errores).toEqual([
        { campo: 'tiposEntrada[1].nombre', mensaje: 'Ya hay otro tipo de entrada con ese nombre' },
      ]);
    });

    test('limita la cantidad de imágenes', () => {
      const multimedia = Array.from({ length: 11 }, (_, i) => `https://img.com/${i}.jpg`);

      expect(erroresDe(() => unEvento({ multimedia }))[0].campo).toBe('multimedia');
      expect(erroresDe(() => unEvento({ multimedia: 'https://img.com' }))[0].campo).toBe(
        'multimedia',
      );
    });

    test('validarFechaFutura rechaza eventos que ya ocurrieron', () => {
      expect(() => unEvento({ fecha: enDias(1) }).validarFechaFutura(AHORA)).not.toThrow();
      expect(erroresDe(() => unEvento({ fecha: enDias(-1) }).validarFechaFutura(AHORA))).toEqual([
        { campo: 'fecha', mensaje: 'La fecha del evento debe ser futura' },
      ]);
    });
  });

  describe('tuPrecioEstaEntre', () => {
    const evento = unEvento({
      tiposEntrada: [
        { nombre: 'Pullman', precio: 1000, cupo: 10 },
        { nombre: 'Platea', precio: 5000, cupo: 10 },
      ],
    });

    test.each([
      [500, 1500, true],
      [1000, 1000, true], // límites inclusivos
      [5000, 9000, true],
      [1001, 4999, false], // entre los dos precios, ninguno entra
      [6000, 9000, false],
      [undefined, 1000, true], // sin mínimo
      [5000, undefined, true], // sin máximo
      [5001, null, false],
      [null, null, true],
    ])('entre %p y %p → %p', (min, max, esperado) => {
      expect(evento.tuPrecioEstaEntre(min, max)).toBe(esperado);
    });

    test('precioMinimo devuelve el más barato', () => {
      expect(evento.precioMinimo()).toBe(1000);
    });
  });

  describe('coincideCon', () => {
    const evento = unEvento({
      nombre: 'Música en el Parque',
      descripcion: 'Bandas de rock y folklore',
      lugar: 'Parque Centenario',
      categoria: unaCategoria({ nombre: 'Festivales' }),
    });

    test.each([
      ['musica', true], // sin tilde
      ['MÚSICA', true],
      ['rock', true], // descripción
      ['centenario', true], // lugar
      ['festival', true], // categoría
      ['rock parque', true], // todas las palabras, en cualquier orden
      ['rock jazz', false], // falta una palabra
      ['teatro', false],
      ['', true],
      ['   ', true],
    ])('"%s" → %p', (texto, esperado) => {
      expect(evento.coincideCon(texto)).toBe(esperado);
    });
  });

  describe('otros', () => {
    test('yaOcurrio compara contra ahora (la hora exacta del evento cuenta como ocurrido)', () => {
      expect(unEvento({ fecha: enDias(1) }).yaOcurrio(AHORA)).toBe(false);
      expect(unEvento({ fecha: AHORA }).yaOcurrio(AHORA)).toBe(true);
      expect(unEvento({ fecha: enDias(-1) }).yaOcurrio(AHORA)).toBe(true);
    });

    test('tipoEntrada busca por id y lanza NoEncontradoError si no pertenece al evento', () => {
      const evento = unEvento();
      const [tipo] = evento.tiposEntrada;

      expect(evento.tipoEntrada(tipo.id)).toBe(tipo);
      expect(() => evento.tipoEntrada('otro')).toThrow(NoEncontradoError);
    });

    test('agotado solo si todos los tipos tienen cupo 0', () => {
      const evento = unEvento({
        tiposEntrada: [
          { nombre: 'A', precio: 1, cupo: 1 },
          { nombre: 'B', precio: 1, cupo: 1 },
        ],
      });

      evento.tiposEntrada[0].reservar(1);
      expect(evento.agotado).toBe(false);

      evento.tiposEntrada[1].reservar(1);
      expect(evento.agotado).toBe(true);
    });

    test('esOrganizadoPor', () => {
      const organizador = unUsuario();
      const evento = unEvento({ organizador });

      expect(evento.esOrganizadoPor(organizador)).toBe(true);
      expect(evento.esOrganizadoPor(unUsuario())).toBe(false);
      expect(evento.esOrganizadoPor(null)).toBe(false);
    });
  });
});
