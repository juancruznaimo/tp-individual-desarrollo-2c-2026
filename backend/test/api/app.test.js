import request from 'supertest';

import { crearApp } from '../../src/app.js';

describe('API base', () => {
  const app = crearApp();

  test('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('una ruta inexistente responde 404 con el formato de error', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { codigo: 'NO_ENCONTRADO', mensaje: 'No existe la ruta GET /api/no-existe' },
    });
  });

  test('un JSON mal formado responde 400 VALIDACION', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ esto no es json');

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('VALIDACION');
  });

  test('habilita CORS', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://otro-origen');

    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
