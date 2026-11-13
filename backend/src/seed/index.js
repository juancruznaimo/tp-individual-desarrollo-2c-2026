import { Categoria, Compra, Evento, Resenia, Usuario } from '../domain/index.js';
import { ZONA_HORARIA } from '../domain/fechas.js';

/**
 * Datos de ejemplo que se cargan al iniciar el servidor.
 *
 * Todas las fechas son relativas a `ahora`, así siempre hay eventos pasados
 * (con compras utilizadas y reseñas) y futuros, sin importar cuándo se levante.
 * Usuarios, categorías y eventos tienen IDs legibles para probar la API a mano
 * (ej. `X-User-Id: usr-carla`).
 *
 * Todo se crea con los mismos métodos de dominio que usa la API, así que el seed
 * respeta las reglas de negocio (cupos, transiciones, historial).
 */
export function cargarDatosDeEjemplo(repos, ahora = new Date()) {
  const H = 60 * 60 * 1000;
  const D = 24 * H;
  /** Fecha a `dias` de hoy, a la hora indicada de Buenos Aires. */
  const enDias = (dias, hora = 21, minutos = 0) => fechaArgentina(ahora, dias, hora, minutos);
  /** Instante relativo a `ahora` (para compras, pagos y mensajes). */
  const haceDias = (dias, horas = 0) => new Date(ahora.getTime() - dias * D + horas * H);

  // ------------------------------------------------------------ Categorías
  const categorias = Object.fromEntries(
    [
      ['recitales', 'Recitales', 'Shows en vivo de bandas y solistas'],
      ['teatro', 'Teatro', 'Obras, musicales y espectáculos teatrales'],
      ['festivales', 'Festivales', 'Eventos de varios días o varios artistas'],
      ['conferencias', 'Conferencias', 'Charlas, congresos y meetups'],
      ['deportes', 'Deportes', 'Partidos, carreras y competencias'],
      ['standup', 'Stand-up', 'Comedia e improvisación'],
    ].map(([clave, nombre, descripcion]) => [
      clave,
      repos.categorias.guardar(new Categoria({ id: `cat-${clave}`, nombre, descripcion })),
    ]),
  );

  // ------------------------------------------------------------ Usuarios
  const usuario = (clave, nombre, apellido) =>
    repos.usuarios.guardar(
      new Usuario({ id: `usr-${clave}`, nombre, apellido, email: `${clave}@aiticketit.com` }),
    );
  const ana = usuario('ana', 'Ana', 'Gómez'); // organizadora de recitales y festivales
  const bruno = usuario('bruno', 'Bruno', 'Díaz'); // organizador de teatro y stand-up
  const carla = usuario('carla', 'Carla', 'Pérez'); // compradora
  const diego = usuario('diego', 'Diego', 'Fernández'); // comprador
  const elena = usuario('elena', 'Elena', 'Ruiz'); // compradora y organizadora

  // ------------------------------------------------------------ Eventos
  const evento = (clave, datos) => {
    const fecha = datos.fecha;
    return repos.eventos.guardar(
      new Evento({
        id: `evt-${clave}`,
        multimedia: [`https://picsum.photos/seed/${clave}/800/450`],
        creadoEn: new Date(Math.min(fecha.getTime(), ahora.getTime()) - 30 * D),
        ...datos,
      }),
    );
  };

  // Pasados
  const rock = evento('rock-nacional', {
    nombre: 'Noche de Rock Nacional',
    descripcion: 'Un repaso por los clásicos del rock argentino con bandas invitadas.',
    categoria: categorias.recitales,
    fecha: enDias(-30, 21),
    lugar: 'Estadio Obras, CABA',
    organizador: ana,
    tiposEntrada: [
      { nombre: 'Campo', descripcion: 'De pie', precio: 25000, cupo: 3000 },
      { nombre: 'Platea', descripcion: 'Asiento numerado', precio: 40000, cupo: 1000 },
    ],
  });
  const verano = evento('verano-electronico', {
    nombre: 'Festival Verano Electrónico',
    descripcion:
      'Doce horas de música electrónica frente al río con DJs nacionales e internacionales.',
    categoria: categorias.festivales,
    fecha: enDias(-60, 18),
    lugar: 'Costanera Sur, CABA',
    organizador: ana,
    tiposEntrada: [
      { nombre: 'General', precio: 30000, cupo: 5000 },
      {
        nombre: 'VIP',
        descripcion: 'Acceso a sector elevado y barra exclusiva',
        precio: 70000,
        cupo: 300,
      },
    ],
  });
  const impro = evento('impro-todo-vale', {
    nombre: 'Impro Show: Todo Vale',
    descripcion: 'Improvisación teatral a partir de las sugerencias del público.',
    categoria: categorias.standup,
    fecha: enDias(-15, 22),
    lugar: 'Paseo La Plaza, CABA',
    organizador: bruno,
    tiposEntrada: [{ nombre: 'General', precio: 12000, cupo: 200 }],
  });

  // Futuros
  const pericos = evento('pericos-acustico', {
    nombre: 'Los Pericos Acústico',
    descripcion: 'La banda presenta versiones acústicas de sus grandes éxitos.',
    categoria: categorias.recitales,
    fecha: enDias(12, 21),
    lugar: 'Teatro Gran Rex, CABA',
    organizador: ana,
    tiposEntrada: [
      { nombre: 'Platea Baja', precio: 55000, cupo: 800 },
      { nombre: 'Platea Alta', precio: 38000, cupo: 1200 },
      { nombre: 'Pullman', precio: 28000, cupo: 600 },
    ],
  });
  const cosquin = evento('cosquin-primavera', {
    nombre: 'Cosquín Rock Edición Primavera',
    descripcion: 'Dos días de rock, pop y música urbana en las sierras de Córdoba.',
    categoria: categorias.festivales,
    fecha: enDias(45, 14),
    lugar: 'Aeródromo de Santa María de Punilla, Córdoba',
    organizador: ana,
    tiposEntrada: [
      { nombre: 'Abono 1 día', precio: 60000, cupo: 20000 },
      { nombre: 'Abono 2 días', precio: 105000, cupo: 15000 },
      {
        nombre: 'VIP',
        descripcion: 'Incluye estacionamiento y sector con sombra',
        precio: 180000,
        cupo: 1000,
      },
    ],
  });
  const soda = evento('tributo-soda', {
    nombre: 'Tributo a Soda Stereo',
    descripcion: 'La mejor banda tributo del país recorre toda la discografía de Soda.',
    categoria: categorias.recitales,
    // Siempre "hoy" (o mañana temprano si se levanta muy tarde): sirve para ver "¡Es hoy!".
    fecha: new Date(ahora.getTime() + 3 * H),
    lugar: 'Niceto Club, CABA',
    organizador: ana,
    tiposEntrada: [{ nombre: 'General', precio: 18000, cupo: 500 }],
  });
  const jazz = evento('jazz-bosque', {
    nombre: 'Jazz en el Bosque',
    descripcion: 'Jazz al aire libre al atardecer, con food trucks y mesas junto al lago.',
    categoria: categorias.recitales,
    fecha: enDias(20, 19),
    lugar: 'Bosques de Palermo, CABA',
    organizador: ana,
    tiposEntrada: [
      { nombre: 'General', precio: 15000, cupo: 400 },
      // Cupo chico a propósito: queda 1 lugar, sirve para probar SIN_CUPO.
      { nombre: 'Mesa VIP', descripcion: 'Mesa para hasta 4 personas', precio: 45000, cupo: 4 },
    ],
  });
  const hamlet = evento('hamlet', {
    nombre: 'Hamlet',
    descripcion: 'La tragedia de Shakespeare en una puesta contemporánea.',
    categoria: categorias.teatro,
    fecha: enDias(8, 20, 30),
    lugar: 'Teatro San Martín, CABA',
    organizador: bruno,
    tiposEntrada: [
      { nombre: 'Platea', precio: 22000, cupo: 500 },
      { nombre: 'Pullman', precio: 16000, cupo: 300 },
    ],
  });
  const standup = evento('standup-jueves', {
    nombre: 'Stand-up de los Jueves',
    descripcion: 'Cuatro comediantes, una noche. Humor para mayores de 18.',
    categoria: categorias.standup,
    fecha: enDias(5, 21, 30),
    lugar: 'Bar Kumo, Palermo',
    organizador: bruno,
    tiposEntrada: [{ nombre: 'General', precio: 9000, cupo: 120 }],
  });
  const fantasma = evento('fantasma-opera', {
    nombre: 'El Fantasma de la Ópera',
    descripcion: 'El musical más visto de la historia, con orquesta en vivo.',
    categoria: categorias.teatro,
    fecha: enDias(30, 20),
    lugar: 'Teatro Ópera, CABA',
    organizador: bruno,
    tiposEntrada: [
      { nombre: 'Platea', precio: 65000, cupo: 900 },
      { nombre: 'Superpullman', precio: 35000, cupo: 700 },
      { nombre: 'Palco', descripcion: 'Palco para 4 personas', precio: 120000, cupo: 40 },
    ],
  });
  const jsconf = evento('jsconf-ar', {
    nombre: 'JSConf Argentina',
    descripcion:
      'La conferencia de JavaScript más grande de la región: charlas, talleres y networking.',
    categoria: categorias.conferencias,
    fecha: enDias(25, 9),
    lugar: 'Ciudad Cultural Konex, CABA',
    organizador: elena,
    tiposEntrada: [
      { nombre: 'Early bird', precio: 40000, cupo: 100 },
      { nombre: 'General', precio: 60000, cupo: 400 },
    ],
  });
  const maraton = evento('maraton-10k', {
    nombre: 'Maratón Nocturna 10K',
    descripcion: 'Carrera nocturna de 10 km por los bosques de Palermo. Incluye remera y medalla.',
    categoria: categorias.deportes,
    fecha: enDias(18, 20),
    lugar: 'Parque Tres de Febrero, CABA',
    organizador: elena,
    tiposEntrada: [
      { nombre: 'Inscripción', precio: 20000, cupo: 2000 },
      { nombre: 'Kit Premium', descripcion: 'Incluye campera técnica', precio: 35000, cupo: 300 },
    ],
  });

  // ------------------------------------------------------------ Compras
  const tipo = (ev, nombre) => ev.tiposEntrada.find((t) => t.nombre === nombre).id;
  const comprar = (comprador, ev, nombreTipo, cantidad, cuando) =>
    repos.compras.guardar(
      Compra.realizar({
        comprador,
        evento: ev,
        tipoEntradaId: tipo(ev, nombreTipo),
        cantidad,
        ahora: cuando,
      }),
    );
  const resenia = (comprador, ev, puntuacion, detalle) =>
    repos.resenias.guardar(
      new Resenia({
        comprador,
        evento: ev,
        puntuacion,
        detalle,
        creadaEn: new Date(ev.fecha.getTime() + D),
      }),
    );

  // Eventos pasados: compras utilizadas (con reseña), una cancelada y una reembolsada.
  let c = comprar(carla, rock, 'Campo', 2, new Date(rock.fecha.getTime() - 10 * D));
  c.pagar(carla, new Date(rock.fecha.getTime() - 10 * D + H));
  c.marcarUtilizada(ana, rock.fecha);
  resenia(carla, rock, 4.5, 'Sonido impecable y muy buena organización en el ingreso.');

  c = comprar(diego, rock, 'Platea', 1, new Date(rock.fecha.getTime() - 5 * D));
  c.pagar(diego, new Date(rock.fecha.getTime() - 5 * D + H));
  c.marcarUtilizada(ana, rock.fecha);
  resenia(diego, rock, 5, 'Una noche inolvidable, la platea tenía una vista perfecta.');

  c = comprar(elena, rock, 'Campo', 3, new Date(rock.fecha.getTime() - 15 * D));
  c.cancelar(elena, new Date(rock.fecha.getTime() - 14 * D));

  c = comprar(carla, verano, 'General', 2, new Date(verano.fecha.getTime() - 10 * D));
  c.pagar(carla, new Date(verano.fecha.getTime() - 10 * D + H));
  c.cancelar(carla, new Date(verano.fecha.getTime() - 5 * D));

  c = comprar(diego, verano, 'VIP', 1, new Date(verano.fecha.getTime() - 15 * D));
  c.pagar(diego, new Date(verano.fecha.getTime() - 15 * D + H));
  c.marcarUtilizada(ana, verano.fecha);
  resenia(diego, verano, 4, 'Muy buen line-up. Las filas para la barra eran largas.');

  c = comprar(carla, impro, 'General', 2, new Date(impro.fecha.getTime() - 5 * D));
  c.pagar(carla, new Date(impro.fecha.getTime() - 5 * D + H));
  c.marcarUtilizada(bruno, impro.fecha);
  resenia(carla, impro, 3.5, 'Divertido, aunque la sala era chica y hacía mucho calor.');

  // Utilizada sin reseña: Diego puede reseñarla en la demo.
  c = comprar(diego, impro, 'General', 1, new Date(impro.fecha.getTime() - 3 * D));
  c.pagar(diego, new Date(impro.fecha.getTime() - 3 * D + H));
  c.marcarUtilizada(bruno, impro.fecha);

  // Eventos futuros: compras en todos los estados.
  c = comprar(carla, pericos, 'Platea Baja', 2, haceDias(3));
  c.pagar(carla, haceDias(3, 1));
  c.agregarMensaje(carla, '¡Hola! ¿A qué hora abren las puertas?', haceDias(2));
  c.agregarMensaje(
    ana,
    'Hola Carla, las puertas abren a las 19:30. ¡Te esperamos!',
    haceDias(2, 1),
  );
  c.agregarMensaje(carla, 'Genial, ¡gracias!', haceDias(2, 2));

  comprar(carla, hamlet, 'Platea', 1, haceDias(1)); // PENDIENTE

  c = comprar(carla, standup, 'General', 2, haceDias(6));
  c.cancelar(carla, haceDias(5)); // CANCELADA sin pago

  c = comprar(carla, soda, 'General', 2, haceDias(10));
  c.pagar(carla, haceDias(10, 1)); // CONFIRMADA, el evento es hoy

  c = comprar(carla, jsconf, 'Early bird', 1, haceDias(4));
  c.pagar(carla, haceDias(4, 1));

  c = comprar(diego, cosquin, 'Abono 2 días', 2, haceDias(7));
  c.pagar(diego, haceDias(7, 1));
  c.agregarMensaje(diego, '¿Se puede ingresar con reposera?', haceDias(1));

  c = comprar(diego, fantasma, 'Platea', 2, haceDias(9));
  c.pagar(diego, haceDias(9, 1));
  c.cancelar(diego, haceDias(4)); // REEMBOLSADA
  c.agregarMensaje(
    diego,
    'Tuve que cancelar por un viaje, ¿el reembolso es automático?',
    haceDias(4, 1),
  );
  c.agregarMensaje(bruno, 'Sí Diego, ya quedó reembolsado. ¡Gracias por avisar!', haceDias(3));

  comprar(diego, maraton, 'Inscripción', 1, haceDias(2)); // PENDIENTE

  comprar(elena, pericos, 'Pullman', 4, haceDias(2)); // PENDIENTE

  c = comprar(elena, jazz, 'Mesa VIP', 3, haceDias(5));
  c.pagar(elena, haceDias(5, 1));

  // ------------------------------------------------------------ Favoritos
  carla.agregarFavorito(cosquin.id);
  carla.agregarFavorito(fantasma.id);
  diego.agregarFavorito(jazz.id);

  return {
    categorias: repos.categorias.cantidad(),
    usuarios: repos.usuarios.cantidad(),
    eventos: repos.eventos.cantidad(),
    compras: repos.compras.cantidad(),
    resenias: repos.resenias.cantidad(),
  };
}

/**
 * Devuelve el instante correspondiente a las `hora:minutos` de Buenos Aires,
 * `dias` días después (o antes) del día calendario de `ahora` en esa zona.
 * Argentina no tiene horario de verano, así que el offset es siempre -03:00.
 */
function fechaArgentina(ahora, dias, hora, minutos) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA_HORARIA,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
      .formatToParts(ahora)
      .map(({ type, value }) => [type, Number(value)]),
  );
  return new Date(Date.UTC(partes.year, partes.month - 1, partes.day + dias, hora + 3, minutos));
}
