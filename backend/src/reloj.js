/**
 * Fuente de la hora actual. Los servicios reciben un reloj en vez de llamar a
 * `new Date()` para que los tests puedan fijar "ahora".
 */
export const relojDelSistema = Object.freeze({ ahora: () => new Date() });

export function relojFijo(fecha) {
  const instante = new Date(fecha).getTime();
  return { ahora: () => new Date(instante) };
}
