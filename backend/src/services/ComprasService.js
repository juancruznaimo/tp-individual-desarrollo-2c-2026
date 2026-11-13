import { ProhibidoError, ValidacionError } from '../errors/AppError.js';
import { CANTIDAD_MAXIMA_POR_COMPRA, Compra } from '../domain/index.js';
import { esEnteroEnRango, lanzarSiHayErrores } from '../domain/validacion.js';
import { aCompraDetalle, aCompraResumen } from '../mappers/index.js';
import { contarPorEstado } from './EventosService.js';

const porFechaDeEvento = (a, b) => a.evento.fecha - b.evento.fecha || a.creadaEn - b.creadaEn;
const masNuevasPrimero = (a, b) => b.creadaEn - a.creadaEn;

export class ComprasService {
  constructor({ repos, reloj }) {
    this.repos = repos;
    this.reloj = reloj;
  }

  /** CU-12: compra en estado PENDIENTE que reserva el cupo (RN-01, RN-02, RN-09, RN-11). */
  comprar(datos, comprador) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new ValidacionError('El cuerpo de la solicitud debe ser un objeto');
    }
    const { eventoId, tipoEntradaId, cantidad } = datos;
    const errores = [];
    if (typeof eventoId !== 'string' || !eventoId) {
      errores.push({ campo: 'eventoId', mensaje: 'Es obligatorio' });
    }
    if (typeof tipoEntradaId !== 'string' || !tipoEntradaId) {
      errores.push({ campo: 'tipoEntradaId', mensaje: 'Es obligatorio' });
    }
    if (!esEnteroEnRango(cantidad, 1, CANTIDAD_MAXIMA_POR_COMPRA)) {
      errores.push({
        campo: 'cantidad',
        mensaje: `Debe ser un número entero entre 1 y ${CANTIDAD_MAXIMA_POR_COMPRA}`,
      });
    }
    lanzarSiHayErrores(errores, 'La compra no es válida');

    const evento = this.repos.eventos.obtenerPorId(eventoId);
    // Validar y reservar ocurre sin `await` de por medio: en Node es atómico.
    const compra = Compra.realizar({
      comprador,
      evento,
      tipoEntradaId,
      cantidad,
      ahora: this.reloj.ahora(),
    });
    this.repos.compras.guardar(compra);
    return this.#aDetalle(compra, comprador);
  }

  /** CU-01: compras del usuario como comprador, por fecha del evento. */
  deComprador(usuario, { estado } = {}) {
    const ahora = this.reloj.ahora();
    return this.repos.compras
      .porComprador(usuario.id)
      .filter((c) => !estado || c.estado === estado)
      .sort(porFechaDeEvento)
      .map((c) => aCompraResumen(c, { ahora }));
  }

  detalle(compraId, usuario) {
    return this.#aDetalle(this.#compraDeParticipante(compraId, usuario), usuario);
  }

  pagar(compraId, usuario) {
    const compra = this.#compraDeParticipante(compraId, usuario);
    compra.pagar(usuario, this.reloj.ahora());
    return this.#aDetalle(compra, usuario);
  }

  /** CU-07 / CU-08: con reembolso automático si estaba pagada. */
  cancelar(compraId, usuario) {
    const compra = this.#compraDeParticipante(compraId, usuario);
    compra.cancelar(usuario, this.reloj.ahora());
    return this.#aDetalle(compra, usuario);
  }

  marcarUtilizada(compraId, usuario) {
    const compra = this.#compraDeParticipante(compraId, usuario);
    compra.marcarUtilizada(usuario, this.reloj.ahora());
    return this.#aDetalle(compra, usuario);
  }

  /** CU-02: vista del organizador con disponibilidad por tipo y resumen por estado. */
  deEvento(eventoId, usuario, { estado } = {}) {
    const evento = this.repos.eventos.obtenerPorId(eventoId);
    if (!evento.esOrganizadoPor(usuario)) {
      throw new ProhibidoError('Solo el organizador puede ver las compras del evento');
    }
    const ahora = this.reloj.ahora();
    const compras = this.repos.compras.porEvento(evento.id);

    return {
      evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
      disponibilidad: evento.tiposEntrada.map((tipo) => ({
        tipoEntradaId: tipo.id,
        nombre: tipo.nombre,
        precio: tipo.precio,
        cupoTotal: tipo.cupoTotal,
        vendidas: compras
          .filter((c) => c.tipoEntrada === tipo && c.ocupaCupo())
          .reduce((total, c) => total + c.cantidad, 0),
        disponibles: tipo.cupo,
      })),
      resumenPorEstado: contarPorEstado(compras),
      compras: compras
        .filter((c) => !estado || c.estado === estado)
        .sort(masNuevasPrimero)
        .map((c) => aCompraResumen(c, { ahora })),
    };
  }

  /** La compra existe (404) y el usuario es el comprador o el organizador (403). */
  #compraDeParticipante(compraId, usuario) {
    const compra = this.repos.compras.obtenerPorId(compraId);
    if (!compra.participa(usuario)) {
      throw new ProhibidoError('No participás de esta compra');
    }
    return compra;
  }

  #aDetalle(compra, usuario) {
    const ahora = this.reloj.ahora();
    const yaReseniada = Boolean(
      this.repos.resenias.deCompradorParaEvento(compra.comprador.id, compra.evento.id),
    );
    return aCompraDetalle(compra, {
      ahora,
      usuario,
      acciones: compra.accionesPara(usuario, ahora, { yaReseniada }),
    });
  }
}
