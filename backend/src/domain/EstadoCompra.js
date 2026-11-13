export const EstadoCompra = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  UTILIZADA: 'UTILIZADA',
  CANCELADA: 'CANCELADA',
  REEMBOLSADA: 'REEMBOLSADA',
});

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

/** Máquina de estados de la compra: a qué estados se puede pasar desde cada uno. */
export const TRANSICIONES = Object.freeze({
  [PENDIENTE]: Object.freeze([CONFIRMADA, CANCELADA]),
  [CONFIRMADA]: Object.freeze([UTILIZADA, CANCELADA]),
  [CANCELADA]: Object.freeze([REEMBOLSADA]),
  [UTILIZADA]: Object.freeze([]),
  [REEMBOLSADA]: Object.freeze([]),
});

/** Estados en los que las entradas de la compra siguen ocupando cupo. */
export const ESTADOS_QUE_OCUPAN_CUPO = Object.freeze([PENDIENTE, CONFIRMADA, UTILIZADA]);

export const ESTADOS_CANCELABLES = Object.freeze([PENDIENTE, CONFIRMADA]);

export function esEstadoValido(estado) {
  return Object.values(EstadoCompra).includes(estado);
}
