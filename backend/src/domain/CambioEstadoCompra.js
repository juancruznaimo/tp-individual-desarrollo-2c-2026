export class CambioEstadoCompra {
  /**
   * @param {object} datos
   * @param {import('./Compra.js').Compra} datos.compra
   * @param {string} datos.estado  estado al que pasó la compra
   * @param {import('./Usuario.js').Usuario|null} datos.quien  null si lo hizo el sistema
   * @param {Date} datos.fechaHora
   */
  constructor({ compra, estado, quien = null, fechaHora = new Date() }) {
    this.compra = compra;
    this.estado = estado;
    this.quien = quien;
    this.fechaHora = fechaHora;
  }
}
