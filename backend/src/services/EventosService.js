import { ValidacionError } from '../errors/AppError.js';
import { EstadoCompra, Evento } from '../domain/index.js';
import { aFecha, lanzarSiHayErrores } from '../domain/validacion.js';
import { aEventoDetalle, aEventoResumen } from '../mappers/index.js';
import { paginar } from './paginacion.js';

export const ORDENES = Object.freeze(['fecha', 'precio', 'puntaje']);
export const DIRECCION_POR_DEFECTO = Object.freeze({
  fecha: 'asc',
  precio: 'asc',
  puntaje: 'desc',
});
export const CANTIDAD_RESENIAS_EN_DETALLE = 5;

export class EventosService {
  constructor({ repos, reloj, reputacion }) {
    this.repos = repos;
    this.reloj = reloj;
    this.reputacion = reputacion;
  }

  /**
   * CU-03 / CU-11: búsqueda, filtros, orden y paginación. Los parámetros ya llegan
   * parseados y validados por el controller.
   */
  buscar({
    q,
    categoria,
    precioMin,
    precioMax,
    orden = 'fecha',
    direccion = DIRECCION_POR_DEFECTO[orden],
    incluirPasados = false,
    page,
    limit,
  } = {}) {
    const ahora = this.reloj.ahora();
    const reputacionDe = this.reputacion.memorizada();

    const eventos = this.repos.eventos
      .filtrar(
        (e) =>
          (incluirPasados || !e.yaOcurrio(ahora)) &&
          (!categoria || e.categoria.id === categoria) &&
          e.tuPrecioEstaEntre(precioMin, precioMax) &&
          e.coincideCon(q),
      )
      .sort(comparadorDeEventos(orden, direccion, reputacionDe));

    const resultado = paginar(eventos, { page, limit });
    return {
      ...resultado,
      data: resultado.data.map((e) =>
        aEventoResumen(e, { reputacion: reputacionDe(e.organizador.id), ahora }),
      ),
    };
  }

  detalle(eventoId, usuario = null) {
    const evento = this.repos.eventos.obtenerPorId(eventoId);
    return this.#aDetalle(evento, usuario);
  }

  /** CU-04: el usuario actual pasa a ser el organizador. */
  crear(datos, organizador) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new ValidacionError('El cuerpo de la solicitud debe ser un objeto');
    }
    const ahora = this.reloj.ahora();
    const errores = [];

    let categoria = null;
    if (datos.categoriaId !== undefined && datos.categoriaId !== null && datos.categoriaId !== '') {
      categoria = this.repos.categorias.buscarPorId(datos.categoriaId);
      if (!categoria) errores.push({ campo: 'categoriaId', mensaje: 'La categoría no existe' });
    }

    const fecha = aFecha(datos.fecha);
    if (fecha && fecha <= ahora) {
      errores.push({ campo: 'fecha', mensaje: 'La fecha del evento debe ser futura' });
    }

    let evento;
    try {
      evento = new Evento({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        categoria,
        fecha: datos.fecha,
        lugar: datos.lugar,
        multimedia: datos.multimedia ?? [],
        tiposEntrada: Array.isArray(datos.tiposEntrada)
          ? datos.tiposEntrada.map(soloCamposDeTipoEntrada)
          : datos.tiposEntrada,
        organizador,
        creadoEn: ahora,
      });
    } catch (error) {
      if (!(error instanceof ValidacionError)) throw error;
      // Si la categoría no existe ya está informado; se evita el "Es obligatoria" del dominio.
      const yaInformados = new Set(errores.map((e) => e.campo));
      errores.push(...error.detalles.filter((e) => !yaInformados.has(e.campo)));
    }
    lanzarSiHayErrores(errores, 'El evento no es válido');

    this.repos.eventos.guardar(evento);
    return this.#aDetalle(evento, organizador);
  }

  /** Eventos que organiza el usuario, con la cantidad de compras en cada estado. */
  deOrganizador(usuario) {
    const ahora = this.reloj.ahora();
    const reputacion = this.reputacion.deOrganizador(usuario.id);

    return this.repos.eventos.porOrganizador(usuario.id).map((evento) => ({
      ...aEventoResumen(evento, { reputacion, ahora }),
      comprasPorEstado: contarPorEstado(this.repos.compras.porEvento(evento.id)),
    }));
  }

  #aDetalle(evento, usuario) {
    const resenias = this.repos.resenias
      .porOrganizador(evento.organizador.id)
      .slice(0, CANTIDAD_RESENIAS_EN_DETALLE);

    return aEventoDetalle(evento, {
      reputacion: this.reputacion.deOrganizador(evento.organizador.id),
      ahora: this.reloj.ahora(),
      usuario,
      resenias,
    });
  }
}

/** El cliente solo puede definir estos campos; `cupoTotal` e `id` los asigna el sistema. */
function soloCamposDeTipoEntrada(tipo) {
  if (!tipo || typeof tipo !== 'object') return tipo;
  const { nombre, descripcion, precio, cupo } = tipo;
  return { nombre, descripcion: descripcion ?? '', precio, cupo };
}

export function contarPorEstado(compras) {
  const conteo = Object.fromEntries(Object.values(EstadoCompra).map((estado) => [estado, 0]));
  compras.forEach((c) => {
    conteo[c.estado] += 1;
  });
  return conteo;
}

/**
 * Comparador para ordenar eventos. Los organizadores sin puntaje van siempre al final.
 * Desempate: fecha ascendente y después id.
 */
function comparadorDeEventos(orden, direccion, reputacionDe) {
  const signo = direccion === 'desc' ? -1 : 1;
  const desempate = (a, b) => a.fecha - b.fecha || a.id.localeCompare(b.id);

  const criterios = {
    fecha: (a, b) => signo * (a.fecha - b.fecha) || a.id.localeCompare(b.id),
    precio: (a, b) => signo * (a.precioMinimo() - b.precioMinimo()) || desempate(a, b),
    puntaje: (a, b) => {
      const pa = reputacionDe(a.organizador.id).puntaje;
      const pb = reputacionDe(b.organizador.id).puntaje;
      if (pa === null && pb === null) return desempate(a, b);
      if (pa === null) return 1;
      if (pb === null) return -1;
      return signo * (pa - pb) || desempate(a, b);
    },
  };
  return criterios[orden];
}
