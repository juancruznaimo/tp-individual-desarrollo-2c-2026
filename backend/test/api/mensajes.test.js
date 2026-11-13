import request from 'supertest';

import { compraDe, crearAppDePrueba } from '../helpers/app.js';
import { AHORA } from '../helpers/fabricas.js';

describe('Chat de la compra (CU-05, CU-06)', () => {
  test('GET lista los mensajes en orden, marcando los propios', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    const deCarla = await como('usr-carla').get(`/api/compras/${id}/mensajes`);
    const deAna = await como('usr-ana').get(`/api/compras/${id}/mensajes`);

    expect(deCarla.status).toBe(200);
    expect(deCarla.body.map((m) => [m.usuario.id, m.esMio])).toEqual([
      ['usr-carla', true],
      ['usr-ana', false],
      ['usr-carla', true],
    ]);
    expect(deAna.body.map((m) => m.esMio)).toEqual([false, true, false]);
    expect(deCarla.body[0]).toEqual({
      id: expect.any(String),
      mensaje: '¡Hola! ¿A qué hora abren las puertas?',
      enviado: expect.any(String),
      usuario: { id: 'usr-carla', nombre: 'Carla', apellido: 'Pérez' },
      esMio: true,
    });
  });

  test('desde devuelve solo los mensajes posteriores (polling)', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');
    const todos = (await como('usr-carla').get(`/api/compras/${id}/mensajes`)).body;

    const nuevos = await como('usr-carla')
      .get(`/api/compras/${id}/mensajes`)
      .query({ desde: todos[1].enviado });

    expect(nuevos.body.map((m) => m.id)).toEqual([todos[2].id]);

    const ninguno = await como('usr-carla')
      .get(`/api/compras/${id}/mensajes`)
      .query({ desde: todos[2].enviado });
    expect(ninguno.body).toEqual([]);
  });

  test('desde inválido → 400', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    const res = await como('usr-carla').get(`/api/compras/${id}/mensajes?desde=ayer`);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('desde');
  });

  test('el comprador escribe y el organizador lo ve y responde', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-diego', 'evt-cosquin-primavera');

    const enviado = await como('usr-diego')
      .post(`/api/compras/${id}/mensajes`)
      .send({ mensaje: '  ¿Hay estacionamiento?  ' });

    expect(enviado.status).toBe(201);
    expect(enviado.body).toMatchObject({
      mensaje: '¿Hay estacionamiento?',
      enviado: AHORA.toISOString(),
      usuario: { id: 'usr-diego' },
      esMio: true,
    });

    const respuesta = await como('usr-ana')
      .post(`/api/compras/${id}/mensajes`)
      .send({ mensaje: 'Sí, el VIP incluye estacionamiento.' });
    expect(respuesta.status).toBe(201);

    const chat = await como('usr-diego').get(`/api/compras/${id}/mensajes`);
    expect(chat.body.map((m) => [m.usuario.id, m.esMio])).toEqual([
      ['usr-diego', true], // del seed
      ['usr-diego', true],
      ['usr-ana', false],
    ]);
    expect((await como('usr-diego').get(`/api/compras/${id}`)).body.cantidadMensajes).toBe(3);
  });

  test('se puede escribir aunque la compra esté cancelada (en cualquier momento)', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-standup-jueves'); // CANCELADA

    expect(
      (await como('usr-carla').post(`/api/compras/${id}/mensajes`).send({ mensaje: 'Hola' }))
        .status,
    ).toBe(201);
    expect(
      (await como('usr-bruno').post(`/api/compras/${id}/mensajes`).send({ mensaje: 'Hola!' }))
        .status,
    ).toBe(201);
  });

  test('un tercero no puede leer ni escribir → 403', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    expect((await como('usr-diego').get(`/api/compras/${id}/mensajes`)).status).toBe(403);
    expect(
      (await como('usr-bruno').post(`/api/compras/${id}/mensajes`).send({ mensaje: 'x' })).status,
    ).toBe(403);
  });

  test.each([
    [{ mensaje: '' }],
    [{ mensaje: '    ' }],
    [{ mensaje: 'x'.repeat(1001) }],
    [{ mensaje: 42 }],
    [{}],
    [['hola']],
  ])('mensaje inválido %j → 400 y no se guarda', async (cuerpo) => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    const res = await como('usr-carla').post(`/api/compras/${id}/mensajes`).send(cuerpo);

    expect(res.status).toBe(400);
    expect(repos.compras.obtenerPorId(id).mensajes).toHaveLength(3);
  });

  test('compra inexistente → 404; sin usuario → 401', async () => {
    const { app, repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    expect((await como('usr-carla').get('/api/compras/nada/mensajes')).status).toBe(404);
    expect((await request(app).get(`/api/compras/${id}/mensajes`)).status).toBe(401);
  });
});
