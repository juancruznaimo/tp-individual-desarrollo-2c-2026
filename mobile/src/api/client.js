/**
 * Cliente HTTP de la app. Todas las rutas son relativas a `/api`: en desarrollo
 * Vite las reenvía al back-end (ver `server.proxy` en vite.config.js).
 */
const BASE_URL = '/api';

export class ApiError extends Error {
  constructor({ status, codigo, mensaje, detalles }) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  /** `true` si no se pudo hablar con el servidor (sin red, back-end caído). */
  get esDeConexion() {
    return this.codigo === 'SIN_CONEXION';
  }
}

let usuarioActualId = null;

let sinConexion = false;
const oyentesConexion = new Set();

function marcarConexion(caida) {
  if (caida === sinConexion) return;
  sinConexion = caida;
  oyentesConexion.forEach((oyente) => oyente());
}

export function suscribirConexion(oyente) {
  oyentesConexion.add(oyente);
  return () => oyentesConexion.delete(oyente);
}

export const estaSinConexion = () => sinConexion;

/** Lo setea el contexto de usuario (Etapa 5); se manda como header `X-User-Id`. */
export function setUsuarioActual(id) {
  usuarioActualId = id;
}

export async function request(ruta, { method = 'GET', body, query } = {}) {
  const url = new URL(BASE_URL + ruta, window.location.origin);
  Object.entries(query ?? {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
  });

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (usuarioActualId) headers['X-User-Id'] = usuarioActualId;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    marcarConexion(true);
    throw new ApiError({
      status: 0,
      codigo: 'SIN_CONEXION',
      mensaje: 'Sin conexión con el servidor',
    });
  }

  marcarConexion(respuesta.status >= 502);

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // Si el proxy de Vite no llega al back-end responde 502/504 sin el formato de la API.
    const error = datos?.error ?? {
      codigo: respuesta.status >= 502 ? 'SIN_CONEXION' : 'ERROR_INTERNO',
      mensaje:
        respuesta.status >= 502 ? 'Sin conexión con el servidor' : 'Ocurrió un error inesperado',
    };
    throw new ApiError({ status: respuesta.status, ...error });
  }

  return datos;
}
