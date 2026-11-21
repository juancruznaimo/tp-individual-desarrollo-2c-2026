export const MAXIMO_IMAGENES = 10;
export const CUPO_MAXIMO = 1_000_000;

export function aNumero(texto) {
  let limpio = String(texto ?? '').replace(/\s|\$/g, '');
  if (limpio === '') return null;
  if (limpio.includes(',')) limpio = limpio.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) limpio = limpio.replace(/\./g, '');
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return Number.NaN;
  return Number(limpio);
}

const normalizar = (texto) => texto.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function validarTexto(errores, campo, valor, { min = 1, max }) {
  const largo = valor.trim().length;
  if (largo === 0) errores[campo] = 'Es obligatorio';
  else if (largo < min) errores[campo] = `Debe tener al menos ${min} caracteres`;
  else if (largo > max) errores[campo] = `Debe tener como máximo ${max} caracteres`;
}

function esUrlHttp(valor) {
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validarEvento(form, ahora) {
  const errores = {};
  validarTexto(errores, 'nombre', form.nombre, { min: 3, max: 120 });
  validarTexto(errores, 'descripcion', form.descripcion, { max: 2000 });
  validarTexto(errores, 'lugar', form.lugar, { max: 200 });
  if (!form.categoriaId) errores.categoriaId = 'Elegí una categoría';

  const fecha = form.fecha ? new Date(form.fecha) : null;
  if (!fecha || Number.isNaN(fecha.getTime())) errores.fecha = 'Elegí la fecha y la hora';
  else if (fecha.getTime() <= ahora) errores.fecha = 'La fecha del evento debe ser futura';

  if (form.multimedia.length > MAXIMO_IMAGENES) {
    errores.multimedia = `Puede tener como máximo ${MAXIMO_IMAGENES} imágenes`;
  }
  form.multimedia.forEach((url, i) => {
    if (url.trim() === '') errores[`multimedia[${i}]`] = 'Ingresá una URL o quitá la imagen';
    else if (!esUrlHttp(url)) errores[`multimedia[${i}]`] = 'Debe ser una URL http(s)';
  });

  if (form.tiposEntrada.length === 0) {
    errores.tiposEntrada = 'Agregá al menos un tipo de entrada';
  }
  const vistos = new Set();
  form.tiposEntrada.forEach((tipo, i) => {
    const prefijo = `tiposEntrada[${i}]`;
    validarTexto(errores, `${prefijo}.nombre`, tipo.nombre, { max: 60 });
    if (tipo.descripcion.trim().length > 300) {
      errores[`${prefijo}.descripcion`] = 'Debe tener como máximo 300 caracteres';
    }

    const clave = normalizar(tipo.nombre);
    if (clave && vistos.has(clave)) {
      errores[`${prefijo}.nombre`] = 'Ya hay otro tipo de entrada con ese nombre';
    }
    vistos.add(clave);

    const precio = aNumero(tipo.precio);
    if (precio === null) errores[`${prefijo}.precio`] = 'Es obligatorio';
    else if (Number.isNaN(precio) || precio < 0) {
      errores[`${prefijo}.precio`] = 'Debe ser un número mayor o igual a 0';
    } else if (Math.abs(Math.round(precio * 100) - precio * 100) > 1e-6) {
      errores[`${prefijo}.precio`] = 'Puede tener como máximo 2 decimales';
    }

    const cupo = aNumero(tipo.cupo);
    if (cupo === null) errores[`${prefijo}.cupo`] = 'Es obligatorio';
    else if (!Number.isInteger(cupo) || cupo < 1 || cupo > CUPO_MAXIMO) {
      errores[`${prefijo}.cupo`] =
        `Debe ser un entero entre 1 y ${CUPO_MAXIMO.toLocaleString('es-AR')}`;
    }
  });

  return errores;
}

export function armarEvento(form) {
  return {
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim(),
    categoriaId: form.categoriaId,
    fecha: new Date(form.fecha).toISOString(),
    lugar: form.lugar.trim(),
    multimedia: form.multimedia.map((url) => url.trim()),
    tiposEntrada: form.tiposEntrada.map((t) => ({
      nombre: t.nombre.trim(),
      descripcion: t.descripcion.trim(),
      precio: aNumero(t.precio),
      cupo: aNumero(t.cupo),
    })),
  };
}

export function erroresDelBackend(detalles = []) {
  return Object.fromEntries(detalles.map(({ campo, mensaje }) => [campo, mensaje]));
}
