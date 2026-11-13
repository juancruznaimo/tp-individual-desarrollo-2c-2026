import { Categoria, Evento, TipoEntrada, Usuario } from '../../src/domain/index.js';

/** "Ahora" fijo para todos los tests: 12/11/2026 12:00 hora argentina. */
export const AHORA = new Date('2026-11-12T12:00:00-03:00');

export const enDias = (dias, desde = AHORA) =>
  new Date(desde.getTime() + dias * 24 * 60 * 60 * 1000);

let contador = 0;

export function unUsuario(datos = {}) {
  contador += 1;
  return new Usuario({
    nombre: 'Usuario',
    apellido: `Test${contador}`,
    email: `usuario${contador}@test.com`,
    ...datos,
  });
}

export function unaCategoria(datos = {}) {
  return new Categoria({ nombre: 'Recitales', descripcion: 'Shows en vivo', ...datos });
}

export function unTipoEntrada(datos = {}) {
  return new TipoEntrada({ nombre: 'General', precio: 10000, cupo: 100, ...datos });
}

export function unEvento(datos = {}) {
  return new Evento({
    nombre: 'Recital de prueba',
    descripcion: 'Un recital para los tests',
    categoria: unaCategoria(),
    fecha: enDias(10),
    lugar: 'Estadio de prueba',
    organizador: unUsuario(),
    tiposEntrada: [{ nombre: 'General', precio: 10000, cupo: 100 }],
    ...datos,
  });
}
