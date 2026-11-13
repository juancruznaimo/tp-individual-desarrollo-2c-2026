import { ValidacionError } from '../../../src/errors/AppError.js';
import {
  calcularPuntaje,
  Categoria,
  diasCalendarioEntre,
  esEstadoValido,
  Mensaje,
  Resenia,
  Usuario,
} from '../../../src/domain/index.js';
import {
  aFecha,
  esUrlHttp,
  normalizarTexto,
  redondear2,
  validarTexto,
} from '../../../src/domain/validacion.js';
import { unEvento, unUsuario } from '../../helpers/fabricas.js';

describe('Usuario', () => {
  test('normaliza los datos y arma el nombre completo', () => {
    const usuario = new Usuario({ nombre: ' Ana ', apellido: 'Gómez', email: 'ANA@Mail.com ' });

    expect(usuario.nombreCompleto).toBe('Ana Gómez');
    expect(usuario.email).toBe('ana@mail.com');
    expect(usuario.id).toEqual(expect.any(String));
  });

  test('valida nombre, apellido y email', () => {
    expect(() => new Usuario({ nombre: '', apellido: 'X', email: 'a@b.com' })).toThrow(
      ValidacionError,
    );
    expect(() => new Usuario({ nombre: 'A', apellido: 'X', email: 'sin-arroba' })).toThrow(
      ValidacionError,
    );
  });

  test('favoritos: agregar es idempotente y se puede quitar', () => {
    const usuario = unUsuario({ favoritos: ['e1', 'e1'] });

    usuario.agregarFavorito('e2');
    usuario.agregarFavorito('e2');
    expect(usuario.favoritos).toEqual(['e1', 'e2']);
    expect(usuario.esFavorito('e2')).toBe(true);

    usuario.quitarFavorito('e1');
    usuario.quitarFavorito('no-existe');
    expect(usuario.favoritos).toEqual(['e2']);
  });

  test('esMismoQue compara por id', () => {
    const usuario = unUsuario();

    expect(usuario.esMismoQue({ id: usuario.id })).toBe(true);
    expect(usuario.esMismoQue(unUsuario())).toBe(false);
    expect(usuario.esMismoQue(null)).toBe(false);
  });
});

describe('Categoria', () => {
  test('requiere nombre', () => {
    expect(new Categoria({ nombre: 'Teatro' }).descripcion).toBe('');
    expect(() => new Categoria({ nombre: ' ' })).toThrow(ValidacionError);
  });
});

describe('Mensaje', () => {
  test('requiere autor', () => {
    expect(() => new Mensaje({ mensaje: 'hola' })).toThrow(ValidacionError);
  });
});

describe('Resenia', () => {
  const base = () => ({ comprador: unUsuario(), evento: unEvento(), detalle: 'Muy bueno' });

  test.each([1, 1.5, 3, 4.5, 5])('acepta puntuación %p', (puntuacion) => {
    expect(new Resenia({ ...base(), puntuacion }).puntuacion).toBe(puntuacion);
  });

  test.each([0, 0.5, 5.5, 3.3, '4', NaN, undefined])('rechaza puntuación %p', (puntuacion) => {
    expect(() => new Resenia({ ...base(), puntuacion })).toThrow(ValidacionError);
  });

  test('requiere comprador, evento y detalle', () => {
    expect(() => new Resenia({ puntuacion: 4, detalle: '' })).toThrow(ValidacionError);
  });
});

describe('calcularPuntaje (RN-10)', () => {
  test('sin reseñas el puntaje es null', () => {
    expect(calcularPuntaje([])).toEqual({ puntaje: null, cantidadResenias: 0 });
  });

  test('promedia y redondea a 1 decimal', () => {
    const resenias = [5, 4, 4].map((puntuacion) => ({ puntuacion }));

    expect(calcularPuntaje(resenias)).toEqual({ puntaje: 4.3, cantidadResenias: 3 });
  });

  test('redondea hacia arriba en .x5', () => {
    expect(calcularPuntaje([4.5, 4].map((puntuacion) => ({ puntuacion }))).puntaje).toBe(4.3);
  });
});

describe('diasCalendarioEntre', () => {
  test('cruza meses y años', () => {
    expect(
      diasCalendarioEntre(
        new Date('2026-12-31T10:00:00-03:00'),
        new Date('2027-01-02T08:00:00-03:00'),
      ),
    ).toBe(2);
  });

  test('puede ser negativo', () => {
    expect(
      diasCalendarioEntre(
        new Date('2026-11-12T10:00:00-03:00'),
        new Date('2026-11-10T10:00:00-03:00'),
      ),
    ).toBe(-2);
  });
});

describe('helpers de validación', () => {
  test('aFecha', () => {
    expect(aFecha('2026-01-01T00:00:00Z')).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect(aFecha(new Date('x'))).toBeNull();
    expect(aFecha('no')).toBeNull();
    expect(aFecha(123)).toBeNull();
  });

  test('esUrlHttp', () => {
    expect(esUrlHttp('https://a.com/x.jpg')).toBe(true);
    expect(esUrlHttp('javascript:alert(1)')).toBe(false);
    expect(esUrlHttp('no es url')).toBe(false);
    expect(esUrlHttp(42)).toBe(false);
  });

  test('validarTexto', () => {
    const errores = [];
    validarTexto(errores, 'a', 42);
    validarTexto(errores, 'b', 'xy', { min: 3 });
    validarTexto(errores, 'c', 'abcd', { max: 3 });
    validarTexto(errores, 'd', undefined, { requerido: false });

    expect(errores.map((e) => [e.campo, e.mensaje])).toEqual([
      ['a', 'Debe ser un texto'],
      ['b', 'Debe tener al menos 3 caracteres'],
      ['c', 'Debe tener como máximo 3 caracteres'],
    ]);
  });

  test('normalizarTexto y redondear2', () => {
    expect(normalizarTexto('Canción ÑANDÚ')).toBe('cancion nandu');
    expect(normalizarTexto(null)).toBe('');
    expect(redondear2(1.005)).toBe(1.01);
  });

  test('esEstadoValido', () => {
    expect(esEstadoValido('CONFIRMADA')).toBe(true);
    expect(esEstadoValido('confirmada')).toBe(false);
  });
});
