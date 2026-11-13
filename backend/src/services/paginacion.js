export const LIMITE_POR_DEFECTO = 20;
export const LIMITE_MAXIMO = 50;

/** Corta una lista ya ordenada y la devuelve con el formato paginado de la API. */
export function paginar(items, { page = 1, limit = LIMITE_POR_DEFECTO } = {}) {
  const inicio = (page - 1) * limit;
  return {
    data: items.slice(inicio, inicio + limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
  };
}
