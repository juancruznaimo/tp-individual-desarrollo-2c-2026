/**
 * Wrapper sobre localStorage. Puede fallar (modo privado, almacenamiento bloqueado),
 * así que cualquier error se ignora y la app sigue funcionando sin recordar nada.
 */
const PREFIJO = 'aiticketit:';

export function leer(clave) {
  try {
    const valor = window.localStorage.getItem(PREFIJO + clave);
    return valor === null ? null : JSON.parse(valor);
  } catch {
    return null;
  }
}

export function guardar(clave, valor) {
  try {
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    // sin almacenamiento: no se recuerda entre visitas
  }
}

export function borrar(clave) {
  try {
    window.localStorage.removeItem(PREFIJO + clave);
  } catch {
    // idem
  }
}
