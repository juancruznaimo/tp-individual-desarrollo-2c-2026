import request from 'supertest';

import { crearAppDePrueba } from '../helpers/app.js';

describe('Usuarios y categorías', () => {
  const { app, como } = crearAppDePrueba();

  test('GET /api/usuarios lista los usuarios ordenados por nombre (no requiere usuario)', async () => {
    const res = await request(app).get('/api/usuarios');

    expect(res.status).toBe(200);
    expect(res.body.map((u) => u.id)).toEqual([
      'usr-ana',
      'usr-bruno',
      'usr-carla',
      'usr-diego',
      'usr-elena',
    ]);
    expect(res.body[0]).toEqual({
      id: 'usr-ana',
      nombre: 'Ana',
      apellido: 'Gómez',
      email: 'ana@aiticketit.com',
    });
  });

  test('GET /api/usuarios/me devuelve el usuario actual con sus favoritos', async () => {
    const res = await como('usr-carla').get('/api/usuarios/me');

    expect(res.body).toEqual({
      id: 'usr-carla',
      nombre: 'Carla',
      apellido: 'Pérez',
      email: 'carla@aiticketit.com',
      favoritos: ['evt-cosquin-primavera', 'evt-fantasma-opera'],
    });
  });

  test.each(['/api/usuarios/me', '/api/usuarios/me/eventos', '/api/usuarios/me/favoritos'])(
    'GET %s sin X-User-Id → 401',
    async (url) => {
      const res = await request(app).get(url);

      expect(res.status).toBe(401);
      expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
    },
  );

  test('un X-User-Id inexistente → 401', async () => {
    const res = await como('usr-nadie').get('/api/usuarios/me');

    expect(res.status).toBe(401);
    expect(res.body.error.mensaje).toBe('El usuario usr-nadie no existe');
  });

  test('GET /api/categorias lista las categorías ordenadas por nombre', async () => {
    const res = await request(app).get('/api/categorias');

    expect(res.body.map((c) => c.nombre)).toEqual([
      'Conferencias',
      'Deportes',
      'Festivales',
      'Recitales',
      'Stand-up',
      'Teatro',
    ]);
    expect(res.body[0]).toEqual({
      id: 'cat-conferencias',
      nombre: 'Conferencias',
      descripcion: expect.any(String),
    });
  });
});

describe('Favoritos (CU-13)', () => {
  test('agregar, listar y quitar', async () => {
    const { como } = crearAppDePrueba();
    const diego = como('usr-diego');

    expect((await diego.get('/api/usuarios/me/favoritos')).body.map((e) => e.id)).toEqual([
      'evt-jazz-bosque',
    ]);

    expect((await diego.put('/api/usuarios/me/favoritos/evt-hamlet')).status).toBe(204);
    expect((await diego.put('/api/usuarios/me/favoritos/evt-hamlet')).status).toBe(204); // idempotente

    const conHamlet = await diego.get('/api/usuarios/me/favoritos');
    expect(conHamlet.body.map((e) => e.id)).toEqual(['evt-jazz-bosque', 'evt-hamlet']);
    expect(conHamlet.body[1]).toMatchObject({ nombre: 'Hamlet', precioDesde: 16000 });
    expect((await diego.get('/api/eventos/evt-hamlet')).body.esFavorito).toBe(true);

    expect((await diego.delete('/api/usuarios/me/favoritos/evt-jazz-bosque')).status).toBe(204);
    expect((await diego.delete('/api/usuarios/me/favoritos/evt-jazz-bosque')).status).toBe(204);

    expect((await diego.get('/api/usuarios/me')).body.favoritos).toEqual(['evt-hamlet']);
  });

  test('agregar un evento inexistente → 404', async () => {
    const { como } = crearAppDePrueba();

    const res = await como('usr-diego').put('/api/usuarios/me/favoritos/evt-nada');

    expect(res.status).toBe(404);
  });

  test('sin usuario → 401', async () => {
    const { app } = crearAppDePrueba();

    expect((await request(app).put('/api/usuarios/me/favoritos/evt-hamlet')).status).toBe(401);
  });
});
