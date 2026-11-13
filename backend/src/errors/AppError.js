/**
 * Error base de la aplicación. El middleware de errores lo traduce a
 * `{ error: { codigo, mensaje, detalles? } }` con el status HTTP indicado.
 */
export class AppError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = this.constructor.name;
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export class ValidacionError extends AppError {
  constructor(mensaje = 'Los datos enviados no son válidos', detalles) {
    super(400, 'VALIDACION', mensaje, detalles);
  }
}

export class NoAutenticadoError extends AppError {
  constructor(mensaje = 'Usuario no identificado') {
    super(401, 'NO_AUTENTICADO', mensaje);
  }
}

export class ProhibidoError extends AppError {
  constructor(mensaje = 'No tenés permiso para realizar esta acción') {
    super(403, 'PROHIBIDO', mensaje);
  }
}

export class NoEncontradoError extends AppError {
  constructor(mensaje = 'Recurso no encontrado') {
    super(404, 'NO_ENCONTRADO', mensaje);
  }
}

export class SinCupoError extends AppError {
  constructor(mensaje = 'No hay cupo suficiente', detalles) {
    super(409, 'SIN_CUPO', mensaje, detalles);
  }
}

export class TransicionInvalidaError extends AppError {
  constructor(mensaje = 'Transición de estado inválida', detalles) {
    super(409, 'TRANSICION_INVALIDA', mensaje, detalles);
  }
}

export class ReglaNegocioError extends AppError {
  constructor(mensaje, detalles) {
    super(409, 'REGLA_NEGOCIO', mensaje, detalles);
  }
}
