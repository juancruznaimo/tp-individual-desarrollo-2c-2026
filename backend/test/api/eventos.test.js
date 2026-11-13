import request from 'supertest';

import { crearAppDePrueba, ids } from '../helpers/app.js';
import { AHORA, enDias } from '../helpers/fabricas.js';

const { app, como } = crearAppDePrueba();
const buscar = (query = {}) => request(app).get('/api/eventos').query(query);

describe('GET /api/eventos (CU-03, CU-11)', () => {
  test('sin filtros devuelve los eventos futuros ordenados por fecha', async () => {
    const res = await buscar();

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([
      'evt-tributo-soda',
      'evt-standup-jueves',
      'evt-hamlet',
      'evt-pericos-acustico',
      'evt-maraton-10k',
      'evt-jazz-bosque',
      'evt-jsconf-ar',
      'evt-fantasma-opera',
      'evt-cosquin-primavera',
    ]);
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 9, totalPages: 1 });
  });

  test('devuelve el formato EventoResumen', async () => {
    const res = await buscar({ q: 'pericos' });

    expect(res.body.data[0]).toEqual({
      id: 'evt-pericos-acustico',
      nombre: 'Los Pericos Acústico',
      fecha: expect.any(String),
      lugar: 'Teatro Gran Rex, CABA',
      categoria: { id: 'cat-recitales', nombre: 'Recitales' },
      imagen: 'https://picsum.photos/seed/pericos-acustico/800/450',
      precioDesde: 28000,
      agotado: false,
      yaOcurrio: false,
      organizador: {
        id: 'usr-ana',
        nombre: 'Ana',
        apellido: 'Gómez',
        puntaje: 4.5,
        cantidadResenias: 3,
      },
    });
  });

  describe('búsqueda textual y por categoría', () => {
    test('por texto, sin importar mayúsculas ni tildes', async () => {
      expect(ids(await buscar({ q: 'OPERA' }))).toEqual(['evt-fantasma-opera']);
      expect(ids(await buscar({ q: 'teatro' }))).toEqual([
        'evt-hamlet', // categoría Teatro
        'evt-pericos-acustico', // lugar "Teatro Gran Rex"
        'evt-fantasma-opera',
      ]);
    });

    test('por categoría', async () => {
      expect(ids(await buscar({ categoria: 'cat-teatro' }))).toEqual([
        'evt-hamlet',
        'evt-fantasma-opera',
      ]);
    });

    test('texto y categoría combinados', async () => {
      expect(ids(await buscar({ q: 'palermo' }))).toEqual([
        'evt-standup-jueves',
        'evt-maraton-10k',
        'evt-jazz-bosque',
      ]);
      expect(ids(await buscar({ q: 'palermo', categoria: 'cat-recitales' }))).toEqual([
        'evt-jazz-bosque',
      ]);
    });

    test('una categoría inexistente o un texto sin coincidencias devuelven una lista vacía', async () => {
      expect((await buscar({ categoria: 'cat-nada' })).body.total).toBe(0);
      expect((await buscar({ q: 'xyz123' })).body).toMatchObject({
        data: [],
        total: 0,
        totalPages: 0,
      });
    });

    test('los eventos pasados se excluyen salvo con incluirPasados=true (RN-12)', async () => {
      expect(ids(await buscar({ q: 'rock' }))).toEqual(['evt-cosquin-primavera']);

      const res = await buscar({ q: 'rock', incluirPasados: 'true' });
      expect(ids(res)).toEqual(['evt-rock-nacional', 'evt-cosquin-primavera']);
      expect(res.body.data[0].yaOcurrio).toBe(true);
    });

    test('rango de precio: algún tipo de entrada dentro del rango', async () => {
      expect(ids(await buscar({ precioMin: 10000, precioMax: 16000 }))).toEqual([
        'evt-hamlet', // Pullman 16000
        'evt-jazz-bosque', // General 15000
      ]);
      expect(ids(await buscar({ precioMin: 100000 }))).toEqual([
        'evt-fantasma-opera', // Palco 120000
        'evt-cosquin-primavera', // VIP 180000
      ]);
    });
  });

  describe('orden (CU-11)', () => {
    test('por fecha descendente', async () => {
      const res = await buscar({ orden: 'fecha', direccion: 'desc' });

      expect(ids(res)[0]).toBe('evt-cosquin-primavera');
      expect(ids(res).at(-1)).toBe('evt-tributo-soda');
    });

    test('por precio (precio mínimo de cada evento), ascendente por defecto', async () => {
      const res = await buscar({ orden: 'precio' });

      expect(res.body.data.map((e) => e.precioDesde)).toEqual([
        9000, 15000, 16000, 18000, 20000, 28000, 35000, 40000, 60000,
      ]);
    });

    test('por precio descendente', async () => {
      const res = await buscar({ orden: 'precio', direccion: 'desc' });

      expect(res.body.data.map((e) => e.precioDesde)).toEqual([
        60000, 40000, 35000, 28000, 20000, 18000, 16000, 15000, 9000,
      ]);
    });

    test('por puntaje: descendente por defecto, sin puntaje al final, desempate por fecha', async () => {
      const res = await buscar({ orden: 'puntaje' });

      expect(res.body.data.map((e) => [e.organizador.id, e.id])).toEqual([
        ['usr-ana', 'evt-tributo-soda'],
        ['usr-ana', 'evt-pericos-acustico'],
        ['usr-ana', 'evt-jazz-bosque'],
        ['usr-ana', 'evt-cosquin-primavera'],
        ['usr-bruno', 'evt-standup-jueves'],
        ['usr-bruno', 'evt-hamlet'],
        ['usr-bruno', 'evt-fantasma-opera'],
        ['usr-elena', 'evt-maraton-10k'],
        ['usr-elena', 'evt-jsconf-ar'],
      ]);
    });

    test('por puntaje ascendente: los organizadores sin puntaje siguen al final', async () => {
      const res = await buscar({ orden: 'puntaje', direccion: 'asc' });
      const puntajes = res.body.data.map((e) => e.organizador.puntaje);

      expect(puntajes).toEqual([3.5, 3.5, 3.5, 4.5, 4.5, 4.5, 4.5, null, null]);
    });
  });

  describe('paginación', () => {
    test('corta los resultados y avisa el total', async () => {
      const pagina1 = await buscar({ limit: 4 });
      const pagina3 = await buscar({ limit: 4, page: 3 });

      expect(pagina1.body).toMatchObject({ page: 1, limit: 4, total: 9, totalPages: 3 });
      expect(ids(pagina1)).toHaveLength(4);
      expect(ids(pagina3)).toEqual(['evt-cosquin-primavera']);
    });

    test('una página después de la última viene vacía', async () => {
      expect((await buscar({ page: 5 })).body.data).toEqual([]);
    });
  });

  test.each([
    [{ orden: 'nombre' }, 'orden'],
    [{ direccion: 'arriba' }, 'direccion'],
    [{ precioMin: 'barato' }, 'precioMin'],
    [{ precioMax: -1 }, 'precioMax'],
    [{ precioMin: 500, precioMax: 100 }, 'precioMin'],
    [{ incluirPasados: 'si' }, 'incluirPasados'],
    [{ page: 0 }, 'page'],
    [{ limit: 51 }, 'limit'],
    [{ limit: 2.5 }, 'limit'],
  ])('parámetros inválidos %o → 400 en el campo %s', async (query, campo) => {
    const res = await buscar(query);

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('VALIDACION');
    expect(res.body.error.detalles).toEqual([expect.objectContaining({ campo })]);
  });
});

describe('GET /api/eventos/:id (CU-10, CU-12)', () => {
  test('devuelve el detalle con tipos de entrada y reseñas del organizador', async () => {
    const res = await request(app).get('/api/eventos/evt-jazz-bosque');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'evt-jazz-bosque',
      descripcion: expect.any(String),
      multimedia: ['https://picsum.photos/seed/jazz-bosque/800/450'],
      tiposEntrada: [
        { id: expect.any(String), nombre: 'General', descripcion: '', precio: 15000, cupo: 400 },
        {
          id: expect.any(String),
          nombre: 'Mesa VIP',
          descripcion: 'Mesa para hasta 4 personas',
          precio: 45000,
          cupo: 1, // Elena compró 3 de 4
        },
      ],
    });
    // Reseñas de eventos ANTERIORES del mismo organizador, más nuevas primero.
    expect(res.body.reseniasOrganizador.map((r) => [r.evento.id, r.puntuacion])).toEqual([
      ['evt-rock-nacional', 4.5],
      ['evt-rock-nacional', 5],
      ['evt-verano-electronico', 4],
    ]);
    expect(res.body.reseniasOrganizador[0]).toEqual({
      id: expect.any(String),
      puntuacion: 4.5,
      detalle: expect.any(String),
      creadaEn: expect.any(String),
      comprador: { nombre: 'Carla', apellido: 'Pérez' },
      evento: { id: 'evt-rock-nacional', nombre: 'Noche de Rock Nacional' },
    });
  });

  test('sin usuario no informa esFavorito ni esOrganizador', async () => {
    const res = await request(app).get('/api/eventos/evt-cosquin-primavera');

    expect(res.body).not.toHaveProperty('esFavorito');
    expect(res.body).not.toHaveProperty('esOrganizador');
  });

  test('con usuario informa si es favorito y si lo organiza', async () => {
    const deCarla = await como('usr-carla').get('/api/eventos/evt-cosquin-primavera');
    const deAna = await como('usr-ana').get('/api/eventos/evt-cosquin-primavera');

    expect(deCarla.body).toMatchObject({ esFavorito: true, esOrganizador: false });
    expect(deAna.body).toMatchObject({ esFavorito: false, esOrganizador: true });
  });

  test('un organizador sin reseñas tiene puntaje null', async () => {
    const res = await request(app).get('/api/eventos/evt-jsconf-ar');

    expect(res.body.organizador).toMatchObject({ puntaje: null, cantidadResenias: 0 });
    expect(res.body.reseniasOrganizador).toEqual([]);
  });

  test('404 si no existe', async () => {
    const res = await request(app).get('/api/eventos/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({
      codigo: 'NO_ENCONTRADO',
      mensaje: 'El evento con id no-existe no existe',
    });
  });

  test('un X-User-Id inexistente responde 401 aunque la ruta sea pública', async () => {
    const res = await como('usr-nadie').get('/api/eventos/evt-hamlet');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/eventos (CU-04)', () => {
  const eventoValido = () => ({
    nombre: 'Recital de Prueba',
    descripcion: 'Un recital para probar la API',
    categoriaId: 'cat-recitales',
    fecha: enDias(40).toISOString(),
    lugar: 'Teatro Vorterix, CABA',
    multimedia: ['https://img.com/poster.jpg'],
    tiposEntrada: [
      { nombre: 'Campo', descripcion: 'De pie', precio: 20000, cupo: 500 },
      { nombre: 'Platea', precio: 35000, cupo: 200 },
      { nombre: 'VIP', precio: 60000, cupo: 50 },
    ],
  });

  test('crea el evento con el usuario actual como organizador', async () => {
    const { app: appNueva, como: comoNuevo } = crearAppDePrueba();

    const res = await comoNuevo('usr-elena').post('/api/eventos').send(eventoValido());

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/eventos/${res.body.id}`);
    expect(res.body).toMatchObject({
      nombre: 'Recital de Prueba',
      categoria: { id: 'cat-recitales' },
      fecha: enDias(40).toISOString(),
      precioDesde: 20000,
      organizador: { id: 'usr-elena', puntaje: null },
      esOrganizador: true,
      esFavorito: false,
    });
    expect(res.body.tiposEntrada.map((t) => [t.nombre, t.precio, t.cupo])).toEqual([
      ['Campo', 20000, 500],
      ['Platea', 35000, 200],
      ['VIP', 60000, 50],
    ]);

    // Aparece en la búsqueda y en el detalle.
    const busqueda = await request(appNueva).get('/api/eventos').query({ q: 'vorterix' });
    expect(ids(busqueda)).toEqual([res.body.id]);
    expect((await request(appNueva).get(res.headers.location)).status).toBe(200);
  });

  test('ignora campos que asigna el sistema (cupoTotal, id)', async () => {
    const { como: comoNuevo, repos } = crearAppDePrueba();
    const datos = eventoValido();
    datos.tiposEntrada = [{ id: 'mio', nombre: 'General', precio: 100, cupo: 10, cupoTotal: 999 }];

    const res = await comoNuevo('usr-elena').post('/api/eventos').send(datos);

    const [tipo] = repos.eventos.obtenerPorId(res.body.id).tiposEntrada;
    expect(tipo.id).not.toBe('mio');
    expect(tipo.cupoTotal).toBe(10);
  });

  const casosInvalidos = [
    ['sin tipos de entrada', (d) => ({ ...d, tiposEntrada: [] }), ['tiposEntrada']],
    [
      'nombres de tipo repetidos',
      (d) => ({
        ...d,
        tiposEntrada: [
          { nombre: 'General', precio: 1, cupo: 1 },
          { nombre: 'general', precio: 2, cupo: 1 },
        ],
      }),
      ['tiposEntrada[1].nombre'],
    ],
    [
      'precio negativo',
      (d) => ({ ...d, tiposEntrada: [{ nombre: 'General', precio: -10, cupo: 10 }] }),
      ['tiposEntrada[0].precio'],
    ],
    [
      'cupo 0',
      (d) => ({ ...d, tiposEntrada: [{ nombre: 'General', precio: 10, cupo: 0 }] }),
      ['tiposEntrada[0].cupo'],
    ],
    ['fecha pasada', (d) => ({ ...d, fecha: enDias(-1).toISOString() }), ['fecha']],
    ['fecha igual a ahora', (d) => ({ ...d, fecha: AHORA.toISOString() }), ['fecha']],
    ['fecha inválida', (d) => ({ ...d, fecha: '31/12/2026' }), ['fecha']],
    ['categoría inexistente', (d) => ({ ...d, categoriaId: 'cat-nada' }), ['categoriaId']],
    ['sin categoría', (d) => ({ ...d, categoriaId: undefined }), ['categoriaId']],
    ['imagen que no es URL', (d) => ({ ...d, multimedia: ['poster.jpg'] }), ['multimedia[0]']],
    [
      'varios errores a la vez',
      (d) => ({
        ...d,
        nombre: '',
        lugar: '',
        categoriaId: 'cat-nada',
        fecha: enDias(-5).toISOString(),
      }),
      ['categoriaId', 'fecha', 'nombre', 'lugar'],
    ],
  ];

  test.each(casosInvalidos)('%s → 400 con el campo', async (_, modificar, campos) => {
    const res = await como('usr-elena').post('/api/eventos').send(modificar(eventoValido()));

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('VALIDACION');
    expect(res.body.error.detalles.map((e) => e.campo)).toEqual(campos);
  });

  test('un cuerpo que no es un objeto → 400', async () => {
    const res = await como('usr-elena').post('/api/eventos').send([eventoValido()]);

    expect(res.status).toBe(400);
  });

  test('sin X-User-Id → 401', async () => {
    const res = await request(app).post('/api/eventos').send(eventoValido());

    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test('un evento inválido no queda guardado', async () => {
    const { como: comoNuevo, repos } = crearAppDePrueba();
    const antes = repos.eventos.cantidad();

    await comoNuevo('usr-elena').post('/api/eventos').send({ nombre: 'x' });

    expect(repos.eventos.cantidad()).toBe(antes);
  });
});

describe('GET /api/usuarios/me/eventos', () => {
  test('devuelve los eventos del organizador (pasados y futuros) con compras por estado', async () => {
    const res = await como('usr-bruno').get('/api/usuarios/me/eventos');

    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.id)).toEqual([
      'evt-impro-todo-vale',
      'evt-standup-jueves',
      'evt-hamlet',
      'evt-fantasma-opera',
    ]);
    expect(res.body[0].comprasPorEstado).toEqual({
      PENDIENTE: 0,
      CONFIRMADA: 0,
      UTILIZADA: 2,
      CANCELADA: 0,
      REEMBOLSADA: 0,
    });
    expect(res.body[3].comprasPorEstado.REEMBOLSADA).toBe(1);
  });

  test('un usuario sin eventos recibe una lista vacía', async () => {
    expect((await como('usr-carla').get('/api/usuarios/me/eventos')).body).toEqual([]);
  });
});
