import { useCallback, useEffect, useState } from 'react';

/**
 * Carga datos de la API y expone `{ data, error, cargando, recargar }`.
 * Se vuelve a ejecutar cuando cambia `clave` (un string que resume los parámetros)
 * o cuando se llama a `recargar`.
 *
 * `cargando` se deriva comparando la clave pedida con la última que respondió, así
 * no hace falta setear estado de forma sincrónica dentro del efecto.
 *
 * @param {() => Promise<any>} cargar
 * @param {string} clave
 */
export function useApi(cargar, clave = '') {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState({ clave: null, data: null, error: null });
  const claveActual = `${clave}#${intento}`;

  useEffect(() => {
    let vigente = true;
    cargar().then(
      (data) => vigente && setResultado({ clave: claveActual, data, error: null }),
      (error) => vigente && setResultado((r) => ({ ...r, clave: claveActual, error })),
    );
    return () => {
      vigente = false;
    };
    // `cargar` cambia en cada render: la clave es la que define cuándo recargar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveActual]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  /** Para actualizaciones optimistas (ej. favorito) sin volver a pedir los datos. */
  const actualizar = useCallback((fn) => setResultado((r) => ({ ...r, data: fn(r.data) })), []);

  return {
    data: resultado.data,
    error: resultado.clave === claveActual ? resultado.error : null,
    cargando: resultado.clave !== claveActual,
    recargar,
    actualizar,
  };
}
