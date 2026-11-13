/**
 * Traducen objetos de dominio a la forma JSON que expone la API (ver specs/02-api.md).
 * Nunca devuelven referencias a objetos de dominio, así la respuesta no tiene ciclos.
 */

export function aUsuarioResumen(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
  };
}

export function aUsuario(usuario) {
  return { ...aUsuarioResumen(usuario), favoritos: [...usuario.favoritos] };
}

export function aCategoria(categoria) {
  return { id: categoria.id, nombre: categoria.nombre, descripcion: categoria.descripcion };
}

/** @param {{ puntaje: number|null, cantidadResenias: number }} reputacion */
export function aOrganizador(usuario, reputacion) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    puntaje: reputacion.puntaje,
    cantidadResenias: reputacion.cantidadResenias,
  };
}

export function aEventoResumen(evento, { reputacion, ahora }) {
  return {
    id: evento.id,
    nombre: evento.nombre,
    fecha: evento.fecha,
    lugar: evento.lugar,
    categoria: { id: evento.categoria.id, nombre: evento.categoria.nombre },
    imagen: evento.multimedia[0] ?? null,
    precioDesde: evento.precioMinimo(),
    agotado: evento.agotado,
    yaOcurrio: evento.yaOcurrio(ahora),
    organizador: aOrganizador(evento.organizador, reputacion),
  };
}

export function aTipoEntrada(tipo) {
  return {
    id: tipo.id,
    nombre: tipo.nombre,
    descripcion: tipo.descripcion,
    precio: tipo.precio,
    cupo: tipo.cupo,
  };
}

export function aEventoDetalle(evento, { reputacion, ahora, usuario, resenias }) {
  const detalle = {
    ...aEventoResumen(evento, { reputacion, ahora }),
    descripcion: evento.descripcion,
    multimedia: [...evento.multimedia],
    tiposEntrada: evento.tiposEntrada.map(aTipoEntrada),
    reseniasOrganizador: resenias.map(aResenia),
  };
  if (usuario) {
    detalle.esFavorito = usuario.esFavorito(evento.id);
    detalle.esOrganizador = evento.esOrganizadoPor(usuario);
  }
  return detalle;
}

export function aResenia(resenia) {
  return {
    id: resenia.id,
    puntuacion: resenia.puntuacion,
    detalle: resenia.detalle,
    creadaEn: resenia.creadaEn,
    comprador: { nombre: resenia.comprador.nombre, apellido: resenia.comprador.apellido },
    evento: { id: resenia.evento.id, nombre: resenia.evento.nombre },
  };
}

const aPersona = (usuario) =>
  usuario ? { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido } : null;

export function aCompraResumen(compra, { ahora }) {
  const { evento, tipoEntrada } = compra;
  return {
    id: compra.id,
    estado: compra.estado,
    cantidad: compra.cantidad,
    total: compra.total,
    creadaEn: compra.creadaEn,
    diasRestantes: compra.diasRestantes(ahora),
    puedeCancelarse: compra.puedeCancelarse(ahora),
    tipoEntrada: { id: tipoEntrada.id, nombre: tipoEntrada.nombre, precio: tipoEntrada.precio },
    evento: {
      id: evento.id,
      nombre: evento.nombre,
      fecha: evento.fecha,
      lugar: evento.lugar,
      imagen: evento.multimedia[0] ?? null,
    },
    comprador: aPersona(compra.comprador),
    cantidadMensajes: compra.mensajes.length,
  };
}

export function aCompraDetalle(compra, { ahora, usuario, acciones }) {
  return {
    ...aCompraResumen(compra, { ahora }),
    historial: compra.historial.map((cambio) => ({
      estado: cambio.estado,
      fechaHora: cambio.fechaHora,
      quien: aPersona(cambio.quien),
    })),
    rol: compra.rolDe(usuario),
    acciones,
  };
}
