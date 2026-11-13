import { ValidacionError } from '../errors/AppError.js';
import { aMensaje } from '../mappers/index.js';
import { compraDeParticipante } from './ComprasService.js';

/** Chat de una compra (CU-05, CU-06): comprador y organizador, en cualquier estado (RN-07). */
export class MensajesService {
  constructor({ repos, reloj }) {
    this.repos = repos;
    this.reloj = reloj;
  }

  /** @param {{ desde?: Date }} opciones  solo los mensajes posteriores (para el polling) */
  listar(compraId, usuario, { desde } = {}) {
    const compra = compraDeParticipante(this.repos, compraId, usuario);
    return compra.mensajes
      .filter((m) => !desde || m.enviado > desde)
      .sort((a, b) => a.enviado - b.enviado)
      .map((m) => aMensaje(m, usuario));
  }

  enviar(compraId, datos, usuario) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new ValidacionError('El cuerpo de la solicitud debe ser un objeto');
    }
    const compra = compraDeParticipante(this.repos, compraId, usuario);
    const mensaje = compra.agregarMensaje(usuario, datos.mensaje, this.reloj.ahora());
    return aMensaje(mensaje, usuario);
  }
}
