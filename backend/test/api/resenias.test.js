import request from 'supertest';

import { compraDe, crearAppDePrueba } from '../helpers/app.js';
import { AHORA } from '../helpers/fabricas.js';

const reseniar = (como, usuario, eventoId, cuerpo) =>
  como(usuario).post(`/api/eventos/${eventoId}/resenias`).send(cuerpo);

describe('POST /api/eventos/:id/resenias (CU-09)', () => {
  test('con una entrada utilizada se puede reseñar y deja de ofrecerse la acción', async () => {
    const { repos, como } = crearAppDePrueba();

    const res = await reseniar(como, 'usr-diego', 'evt-impro-todo-vale', {
      puntuacion: 5,
      detalle: '  Me reí toda la noche.  ',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      puntuacion: 5,
      detalle: 'Me reí toda la noche.',
      creadaEn: AHORA.toISOString(),
      comprador: { nombre: 'Diego', apellido: 'Fernández' },
      evento: { id: 'evt-impro-todo-vale', nombre: 'Impro Show: Todo Vale' },
    });

    const compra = compraDe(repos, 'usr-diego', 'evt-impro-todo-vale');
    expect((await como('usr-diego').get(`/api/compras/${compra}`)).body.acciones).toEqual([]);
  });

  test('la reseña actualiza el puntaje y aparece en los eventos del organizador (CU-10)', async () => {
    const { app, como } = crearAppDePrueba();

    await reseniar(como, 'usr-diego', 'evt-impro-todo-vale', { puntuacion: 5, detalle: 'Genial' });

    // (3.5 + 5) / 2 = 4.25 → 4.3
    const hamlet = await request(app).get('/api/eventos/evt-hamlet');
    expect(hamlet.body.organizador).toMatchObject({ puntaje: 4.3, cantidadResenias: 2 });
    expect(hamlet.body.reseniasOrganizador[0]).toMatchObject({
      detalle: 'Genial',
      evento: { id: 'evt-impro-todo-vale' },
    });
  });

  test('cambia el orden por puntaje del organizador (CU-11)', async () => {
    const { app, repos, como } = crearAppDePrueba();
    const primerOrganizador = async () =>
      (await request(app).get('/api/eventos?orden=puntaje')).body.data[0].organizador;

    expect(await primerOrganizador()).toMatchObject({ id: 'usr-ana', puntaje: 4.5 });

    // Carla asiste a Los Pericos y lo califica con 1; Diego califica el Impro con 5.
    const pericos = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');
    await como('usr-ana').post(`/api/compras/${pericos}/uso`);
    await reseniar(como, 'usr-carla', 'evt-pericos-acustico', { puntuacion: 1, detalle: 'Mal' });
    await reseniar(como, 'usr-diego', 'evt-impro-todo-vale', { puntuacion: 5, detalle: 'Bien' });

    // Ana: (4.5 + 5 + 4 + 1) / 4 = 3.6; Bruno: 4.3
    expect(await primerOrganizador()).toMatchObject({ id: 'usr-bruno', puntaje: 4.3 });
    const ana = await request(app).get('/api/eventos/evt-jazz-bosque');
    expect(ana.body.organizador.puntaje).toBe(3.6);
  });

  test('no se puede reseñar dos veces → 409', async () => {
    const { como } = crearAppDePrueba();

    const res = await reseniar(como, 'usr-carla', 'evt-rock-nacional', {
      puntuacion: 3,
      detalle: 'Otra vez',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      codigo: 'REGLA_NEGOCIO',
      mensaje: 'Ya reseñaste este evento',
    });
  });

  test.each([
    ['con la compra solo confirmada', 'usr-carla', 'evt-pericos-acustico'],
    ['sin compras del evento', 'usr-elena', 'evt-hamlet'],
    ['con la compra reembolsada', 'usr-carla', 'evt-verano-electronico'],
  ])('%s → 409', async (_, usuario, eventoId) => {
    const { como } = crearAppDePrueba();

    const res = await reseniar(como, usuario, eventoId, { puntuacion: 4, detalle: 'Bien' });

    expect(res.status).toBe(409);
    expect(res.body.error.mensaje).toBe(
      'Solo podés reseñar eventos a los que asististe (con una entrada utilizada)',
    );
  });

  test('el organizador no puede reseñar su propio evento → 409', async () => {
    const { como } = crearAppDePrueba();

    const res = await reseniar(como, 'usr-bruno', 'evt-impro-todo-vale', {
      puntuacion: 5,
      detalle: 'El mejor',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.mensaje).toBe('No podés reseñar tu propio evento');
  });

  test.each([
    [{ puntuacion: 0, detalle: 'x' }, 'puntuacion'],
    [{ puntuacion: 5.5, detalle: 'x' }, 'puntuacion'],
    [{ puntuacion: 3.3, detalle: 'x' }, 'puntuacion'],
    [{ puntuacion: '4', detalle: 'x' }, 'puntuacion'],
    [{ puntuacion: 4, detalle: '' }, 'detalle'],
    [{ puntuacion: 4 }, 'detalle'],
  ])('datos inválidos %o → 400 en %s y no se guarda', async (cuerpo, campo) => {
    const { repos, como } = crearAppDePrueba();
    const antes = repos.resenias.cantidad();

    const res = await reseniar(como, 'usr-diego', 'evt-impro-todo-vale', cuerpo);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((e) => e.campo)).toEqual([campo]);
    expect(repos.resenias.cantidad()).toBe(antes);
  });

  test('evento inexistente → 404; sin usuario → 401; cuerpo no objeto → 400', async () => {
    const { app, como } = crearAppDePrueba();

    expect((await reseniar(como, 'usr-diego', 'evt-nada', { puntuacion: 4 })).status).toBe(404);
    expect(
      (await request(app).post('/api/eventos/evt-impro-todo-vale/resenias').send({})).status,
    ).toBe(401);
    expect((await reseniar(como, 'usr-diego', 'evt-impro-todo-vale', [1])).status).toBe(400);
  });
});

describe('GET /api/organizadores/:id/resenias (CU-10)', () => {
  const { app } = crearAppDePrueba();

  test('devuelve puntaje, cantidad y reseñas paginadas, más nuevas primero (sin usuario)', async () => {
    const res = await request(app).get('/api/organizadores/usr-ana/resenias');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      puntaje: 4.5,
      cantidadResenias: 3,
      resenias: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });
    expect(res.body.resenias.data.map((r) => [r.evento.id, r.puntuacion])).toEqual([
      ['evt-rock-nacional', 4.5],
      ['evt-rock-nacional', 5],
      ['evt-verano-electronico', 4],
    ]);
  });

  test('pagina', async () => {
    const res = await request(app).get('/api/organizadores/usr-ana/resenias?limit=2&page=2');

    expect(res.body.resenias).toMatchObject({ page: 2, totalPages: 2 });
    expect(res.body.resenias.data).toHaveLength(1);
  });

  test('un organizador sin reseñas', async () => {
    const res = await request(app).get('/api/organizadores/usr-elena/resenias');

    expect(res.body).toMatchObject({
      puntaje: null,
      cantidadResenias: 0,
      resenias: { data: [], total: 0 },
    });
  });

  test('usuario inexistente → 404; paginación inválida → 400', async () => {
    expect((await request(app).get('/api/organizadores/usr-nadie/resenias')).status).toBe(404);
    expect((await request(app).get('/api/organizadores/usr-ana/resenias?limit=0')).status).toBe(
      400,
    );
  });
});
