import { randomUUID } from 'node:crypto';

import { ProhibidoError, ReglaNegocioError, TransicionInvalidaError } from '../errors/AppError.js';
import { CambioEstadoCompra } from './CambioEstadoCompra.js';
import {
  ESTADOS_CANCELABLES,
  ESTADOS_QUE_OCUPAN_CUPO,
  EstadoCompra,
  TRANSICIONES,
} from './EstadoCompra.js';
import { diasCalendarioEntre } from './fechas.js';
import { Mensaje } from './Mensaje.js';
import { esEnteroEnRango, lanzarSiHayErrores, redondear2 } from './validacion.js';

export const CANTIDAD_MAXIMA_POR_COMPRA = 10;

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

export class Compra {
  /**
   * Construye una compra en estado PENDIENTE. No reserva cupo: para comprar usar
   * `Compra.realizar`, que además valida las reglas de negocio.
   */
  constructor({
    id = randomUUID(),
    comprador,
    evento,
    tipoEntrada,
    cantidad,
    creadaEn = new Date(),
  }) {
    const errores = [];
    if (!comprador) errores.push({ campo: 'comprador', mensaje: 'Es obligatorio' });
    if (!evento) errores.push({ campo: 'eventoId', mensaje: 'Es obligatorio' });
    if (!tipoEntrada) {
      errores.push({ campo: 'tipoEntradaId', mensaje: 'Es obligatorio' });
    } else if (evento && !evento.tiposEntrada.includes(tipoEntrada)) {
      errores.push({
        campo: 'tipoEntradaId',
        mensaje: 'El tipo de entrada no pertenece al evento',
      });
    }
    if (!esEnteroEnRango(cantidad, 1, CANTIDAD_MAXIMA_POR_COMPRA)) {
      errores.push({
        campo: 'cantidad',
        mensaje: `Debe ser un número entero entre 1 y ${CANTIDAD_MAXIMA_POR_COMPRA}`,
      });
    }
    lanzarSiHayErrores(errores, 'La compra no es válida');

    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    // El precio queda fijo al momento de la compra (RN-11).
    this.total = redondear2(tipoEntrada.precio * cantidad);
    this.estado = PENDIENTE;
    this.creadaEn = creadaEn;
    /** @type {Mensaje[]} */
    this.mensajes = [];
    /** @type {CambioEstadoCompra[]} */
    this.historial = [
      new CambioEstadoCompra({
        compra: this,
        estado: PENDIENTE,
        quien: comprador,
        fechaHora: creadaEn,
      }),
    ];
  }

  /**
   * Caso de uso "comprar entradas" (CU-12): valida RN-01 y RN-09, crea la compra y reserva el cupo.
   * Si algo falla, el cupo no cambia.
   */
  static realizar({ id, comprador, evento, tipoEntradaId, cantidad, ahora }) {
    if (evento.yaOcurrio(ahora)) {
      throw new ReglaNegocioError('El evento ya se realizó');
    }
    if (evento.esOrganizadoPor(comprador)) {
      throw new ReglaNegocioError('No podés comprar entradas de tu propio evento');
    }
    const tipoEntrada = evento.tipoEntrada(tipoEntradaId);
    // Se construye antes de reservar para validar la cantidad sin tocar el cupo.
    const compra = new Compra({ id, comprador, evento, tipoEntrada, cantidad, creadaEn: ahora });
    tipoEntrada.reservar(cantidad);
    return compra;
  }

  // ---------------------------------------------------------------- Estados

  puedeTransicionarA(nuevoEstado) {
    if (!TRANSICIONES[this.estado]?.includes(nuevoEstado)) return false;
    // Solo se reembolsa lo que se pagó.
    if (nuevoEstado === REEMBOLSADA) return this.fuePagada();
    return true;
  }

  /**
   * Cambia el estado validando la máquina de estados y deja registro en el historial.
   * @param {string} nuevoEstado
   * @param {import('./Usuario.js').Usuario|null} quien  null si el cambio lo hace el sistema
   * @param {Date} ahora
   */
  actualizarEstado(nuevoEstado, quien = null, ahora = new Date()) {
    this.#exigirTransicion(nuevoEstado);
    this.estado = nuevoEstado;
    if (nuevoEstado === CANCELADA) this.tipoEntrada.liberar(this.cantidad); // RN-03
    this.historial.push(
      new CambioEstadoCompra({ compra: this, estado: nuevoEstado, quien, fechaHora: ahora }),
    );
  }

  /** Pago simulado: PENDIENTE → CONFIRMADA. Solo el comprador y si el evento no ocurrió. */
  pagar(usuario, ahora) {
    this.#exigirComprador(usuario, 'pagar');
    this.#exigirTransicion(CONFIRMADA);
    if (this.evento.yaOcurrio(ahora)) throw new ReglaNegocioError('El evento ya se realizó');
    this.actualizarEstado(CONFIRMADA, usuario, ahora);
  }

  /**
   * CU-07 / CU-08. Si la compra estaba pagada se reembolsa automáticamente
   * (CONFIRMADA → CANCELADA → REEMBOLSADA); si estaba pendiente queda CANCELADA.
   */
  cancelar(usuario, ahora) {
    this.#exigirComprador(usuario, 'cancelar');
    if (this.estado === UTILIZADA) throw new ReglaNegocioError('La compra ya fue utilizada');
    if (!ESTADOS_CANCELABLES.includes(this.estado)) {
      throw new ReglaNegocioError('La compra ya está cancelada');
    }
    if (this.evento.yaOcurrio(ahora)) throw new ReglaNegocioError('El evento ya se realizó');

    const estabaPagada = this.estado === CONFIRMADA;
    this.actualizarEstado(CANCELADA, usuario, ahora);
    if (estabaPagada) this.actualizarEstado(REEMBOLSADA, null, ahora);
  }

  /** CONFIRMADA → UTILIZADA. Solo el organizador del evento (RN-06). */
  marcarUtilizada(usuario, ahora) {
    if (!this.evento.esOrganizadoPor(usuario)) {
      throw new ProhibidoError(
        'Solo el organizador del evento puede marcar la entrada como utilizada',
      );
    }
    this.actualizarEstado(UTILIZADA, usuario, ahora);
  }

  /** RN-04 */
  puedeCancelarse(ahora) {
    return ESTADOS_CANCELABLES.includes(this.estado) && !this.evento.yaOcurrio(ahora);
  }

  fuePagada() {
    return this.historial.some((cambio) => cambio.estado === CONFIRMADA);
  }

  ocupaCupo() {
    return ESTADOS_QUE_OCUPAN_CUPO.includes(this.estado);
  }

  /**
   * Días calendario que faltan para el evento (0 = hoy). Solo para compras CONFIRMADAS
   * cuyo evento no pasó de día; en cualquier otro caso devuelve null.
   */
  diasRestantes(ahora) {
    if (this.estado !== CONFIRMADA) return null;
    const dias = diasCalendarioEntre(ahora, this.evento.fecha);
    return dias >= 0 ? dias : null;
  }

  // ---------------------------------------------------------------- Chat

  /** El comprador y el organizador del evento son los únicos participantes (RN-07). */
  participa(usuario) {
    return (
      Boolean(usuario) && (usuario.id === this.comprador.id || this.evento.esOrganizadoPor(usuario))
    );
  }

  agregarMensaje(usuario, texto, ahora = new Date()) {
    if (!this.participa(usuario)) {
      throw new ProhibidoError('Solo el comprador y el organizador pueden escribir en esta compra');
    }
    const mensaje = new Mensaje({ usuario, mensaje: texto, enviado: ahora });
    this.mensajes.push(mensaje);
    return mensaje;
  }

  // ---------------------------------------------------------------- Privados

  #exigirComprador(usuario, accion) {
    if (!usuario || usuario.id !== this.comprador.id) {
      throw new ProhibidoError(`Solo el comprador puede ${accion} la compra`);
    }
  }

  #exigirTransicion(nuevoEstado) {
    if (!this.puedeTransicionarA(nuevoEstado)) {
      throw new TransicionInvalidaError(
        `Una compra ${this.estado} no puede pasar a ${nuevoEstado}`,
        { desde: this.estado, hacia: nuevoEstado },
      );
    }
  }
}
