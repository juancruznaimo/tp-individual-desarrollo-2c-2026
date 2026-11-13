import { useCallback, useEffect, useState } from 'react';

/**
 * Listado paginado que acumula páginas ("ver más" / scroll infinito).
 * Vuelve a la página 1 cuando cambia `clave` (los filtros) o al llamar a `recargar`.
 *
 * @param {(page: number) => Promise<{ data: any[], page: number, totalPages: number, total: number }>} cargarPagina
 * @param {string} clave
 */
export function usePaginado(cargarPagina, clave) {
  const [intento, setIntento] = useState(0);
  const claveActual = `${clave}#${intento}`;
  const [estado, setEstado] = useState({
    clave: null,
    items: [],
    page: 0,
    totalPages: 0,
    total: 0,
    extra: null,
    error: null,
  });
  const [cargandoMas, setCargandoMas] = useState(false);

  useEffect(() => {
    let vigente = true;
    cargarPagina(1).then(
      ({ data, page, totalPages, total, extra = null }) =>
        vigente &&
        setEstado({ clave: claveActual, items: data, page, totalPages, total, extra, error: null }),
      (error) => vigente && setEstado((e) => ({ ...e, clave: claveActual, error })),
    );
    return () => {
      vigente = false;
    };
    // La clave resume los parámetros de `cargarPagina`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveActual]);

  const listo = estado.clave === claveActual && !estado.error;
  const hayMas = listo && estado.page < estado.totalPages;

  const cargarMas = useCallback(() => {
    if (!hayMas || cargandoMas) return;
    setCargandoMas(true);
    cargarPagina(estado.page + 1)
      .then(({ data, page }) =>
        setEstado((e) =>
          // Si los filtros cambiaron mientras tanto, se descarta la respuesta.
          e.clave === claveActual ? { ...e, items: [...e.items, ...data], page } : e,
        ),
      )
      .catch(() => {})
      .finally(() => setCargandoMas(false));
  }, [hayMas, cargandoMas, cargarPagina, estado.page, claveActual]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  return {
    // Mientras se cargan filtros nuevos se siguen mostrando los resultados anteriores.
    items: estado.items,
    total: estado.total,
    extra: estado.extra,
    error: estado.clave === claveActual ? estado.error : null,
    cargando: estado.clave !== claveActual,
    cargandoMas,
    hayMas,
    cargarMas,
    recargar,
  };
}
