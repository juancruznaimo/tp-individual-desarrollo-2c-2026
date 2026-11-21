import request from 'supertest';

import { compraDe, crearAppDePrueba } from '../helpers/app.js';
import { AHORA } from '../helpers/fabricas.js';

const tipoId = (repos, eventoId, nombre) =>
  repos.eventos.obtenerPorId(eventoId).tiposEntrada.find((t) => t.nombre === nombre).id;

const cupoDe = async (app, eventoId, nombre) =>
  (await request(app).get(`/api/eventos/${eventoId}`)).body.tiposEntrada.find(
    (t) => t.nombre === nombre,
  ).cupo;

describe('POST /api/compras (CU-12)', () => {
  test('crea la compra PENDIENTE y descuenta el cupo', async () => {
    const { app, repos, como } = crearAppDePrueba();

    const res = await como('usr-diego')
      .post('/api/compras')
      .send({
        eventoId: 'evt-pericos-acustico',
        tipoEntradaId: tipoId(repos, 'evt-pericos-acustico', 'Platea Alta'),
        cantidad: 2,
      });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/compras/${res.body.id}`);
    expect(res.body).toMatchObject({
      estado: 'PENDIENTE',
      cantidad: 2,
      total: 76000,
      diasRestantes: null,
      puedeCancelarse: true,
      tipoEntrada: { nombre: 'Platea Alta', precio: 38000 },
      evento: { id: 'evt-pericos-acustico', nombre: 'Los Pericos Acústico' },
      comprador: { id: 'usr-diego', nombre: 'Diego', apellido: 'Fernández' },
      cantidadMensajes: 0,
      rol: 'COMPRADOR',
      acciones: ['PAGAR', 'CANCELAR'],
      historial: [
        {
          estado: 'PENDIENTE',
          fechaHora: AHORA.toISOString(),
          quien: { id: 'usr-diego', nombre: 'Diego', apellido: 'Fernández' },
        },
      ],
    });
    expect(await cupoDe(app, 'evt-pericos-acustico', 'Platea Alta')).toBe(1198);
  });

  test('se puede comprar exactamente el cupo restante; uno más → 409 SIN_CUPO', async () => {
    const { app, repos, como } = crearAppDePrueba();
    const compra = {
      eventoId: 'evt-jazz-bosque',
      tipoEntradaId: tipoId(repos, 'evt-jazz-bosque', 'Mesa VIP'), // queda 1 lugar
    };

    const deDos = await como('usr-carla')
      .post('/api/compras')
      .send({ ...compra, cantidad: 2 });
    expect(deDos.status).toBe(409);
    expect(deDos.body.error).toEqual({
      codigo: 'SIN_CUPO',
      mensaje: 'Queda 1 entrada de tipo Mesa VIP y se pidieron 2',
      detalles: { disponibles: 1, solicitadas: 2 },
    });
    expect(await cupoDe(app, 'evt-jazz-bosque', 'Mesa VIP')).toBe(1); // no cambió

    const deUna = await como('usr-carla')
      .post('/api/compras')
      .send({ ...compra, cantidad: 1 });
    expect(deUna.status).toBe(201);
    expect(await cupoDe(app, 'evt-jazz-bosque', 'Mesa VIP')).toBe(0);

    const otra = await como('usr-diego')
      .post('/api/compras')
      .send({ ...compra, cantidad: 1 });
    expect(otra.status).toBe(409);
    expect(otra.body.error.codigo).toBe('SIN_CUPO');
    expect(await cupoDe(app, 'evt-jazz-bosque', 'Mesa VIP')).toBe(0);
  });

  test('un evento que ya ocurrió → 409', async () => {
    const { repos, como } = crearAppDePrueba();

    const res = await como('usr-carla')
      .post('/api/compras')
      .send({
        eventoId: 'evt-rock-nacional',
        tipoEntradaId: tipoId(repos, 'evt-rock-nacional', 'Campo'),
        cantidad: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      codigo: 'REGLA_NEGOCIO',
      mensaje: 'El evento ya se realizó',
    });
  });

  test('el organizador no puede comprar su propio evento → 409', async () => {
    const { repos, como } = crearAppDePrueba();

    const res = await como('usr-ana')
      .post('/api/compras')
      .send({
        eventoId: 'evt-pericos-acustico',
        tipoEntradaId: tipoId(repos, 'evt-pericos-acustico', 'Pullman'),
        cantidad: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.mensaje).toBe('No podés comprar entradas de tu propio evento');
  });

  test('evento o tipo de entrada inexistente → 404', async () => {
    const { repos, como } = crearAppDePrueba();
    const tipo = tipoId(repos, 'evt-hamlet', 'Platea');

    const sinEvento = await como('usr-carla')
      .post('/api/compras')
      .send({ eventoId: 'evt-nada', tipoEntradaId: tipo, cantidad: 1 });
    const sinTipo = await como('usr-carla')
      .post('/api/compras')
      .send({ eventoId: 'evt-pericos-acustico', tipoEntradaId: tipo, cantidad: 1 });

    expect(sinEvento.status).toBe(404);
    expect(sinTipo.status).toBe(404);
  });

  test.each([
    [{}, ['eventoId', 'tipoEntradaId', 'cantidad']],
    [{ eventoId: 'evt-hamlet', tipoEntradaId: 'x', cantidad: 11 }, ['cantidad']],
    [{ eventoId: 'evt-hamlet', tipoEntradaId: 'x', cantidad: '2' }, ['cantidad']],
    [{ eventoId: 42, tipoEntradaId: 'x', cantidad: 1 }, ['eventoId']],
  ])('cuerpo inválido %o → 400 en %p', async (cuerpo, campos) => {
    const { como } = crearAppDePrueba();

    const res = await como('usr-carla').post('/api/compras').send(cuerpo);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((e) => e.campo)).toEqual(campos);
  });

  test('sin usuario → 401', async () => {
    const { app } = crearAppDePrueba();

    expect((await request(app).post('/api/compras').send({})).status).toBe(401);
  });
});

describe('GET /api/usuarios/me/compras (CU-01)', () => {
  const { como } = crearAppDePrueba();

  test('lista las compras del usuario por fecha del evento, con días restantes si están confirmadas', async () => {
    const res = await como('usr-carla').get('/api/usuarios/me/compras');

    expect(res.status).toBe(200);
    expect(res.body.map((c) => [c.evento.id, c.estado, c.diasRestantes])).toEqual([
      ['evt-verano-electronico', 'REEMBOLSADA', null],
      ['evt-rock-nacional', 'UTILIZADA', null],
      ['evt-impro-todo-vale', 'UTILIZADA', null],
      ['evt-tributo-soda', 'CONFIRMADA', 0], // es hoy
      ['evt-standup-jueves', 'CANCELADA', null],
      ['evt-hamlet', 'PENDIENTE', null],
      ['evt-pericos-acustico', 'CONFIRMADA', 12],
      ['evt-jsconf-ar', 'CONFIRMADA', 25],
    ]);
  });

  test('devuelve el formato CompraResumen', async () => {
    const res = await como('usr-carla').get('/api/usuarios/me/compras');
    const pericos = res.body.find((c) => c.evento.id === 'evt-pericos-acustico');

    expect(pericos).toEqual({
      id: expect.any(String),
      estado: 'CONFIRMADA',
      cantidad: 2,
      total: 110000,
      creadaEn: expect.any(String),
      diasRestantes: 12,
      puedeCancelarse: true,
      tipoEntrada: { id: expect.any(String), nombre: 'Platea Baja', precio: 55000 },
      evento: {
        id: 'evt-pericos-acustico',
        nombre: 'Los Pericos Acústico',
        fecha: expect.any(String),
        lugar: 'Teatro Gran Rex, CABA',
        imagen: expect.stringContaining('https://'),
        organizador: { id: 'usr-ana', nombre: 'Ana', apellido: 'Gómez' },
      },
      comprador: { id: 'usr-carla', nombre: 'Carla', apellido: 'Pérez' },
      cantidadMensajes: 3,
    });
  });

  test('filtra por estado', async () => {
    const res = await como('usr-carla').get('/api/usuarios/me/compras?estado=CONFIRMADA');

    expect(res.body.map((c) => c.evento.id)).toEqual([
      'evt-tributo-soda',
      'evt-pericos-acustico',
      'evt-jsconf-ar',
    ]);
  });

  test('un estado inválido → 400', async () => {
    const res = await como('usr-carla').get('/api/usuarios/me/compras?estado=PAGADA');

    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('estado');
  });

  test('las compras de un organizador como comprador no incluyen las de sus eventos', async () => {
    const res = await como('usr-ana').get('/api/usuarios/me/compras');

    expect(res.body).toEqual([]);
  });
});

describe('GET /api/compras/:id', () => {
  const { repos, como } = crearAppDePrueba();
  const pericosDeCarla = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

  test('el comprador ve su compra con historial, rol y acciones', async () => {
    const res = await como('usr-carla').get(`/api/compras/${pericosDeCarla}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rol: 'COMPRADOR', acciones: ['CANCELAR'] });
    expect(res.body.historial.map((h) => [h.estado, h.quien.id])).toEqual([
      ['PENDIENTE', 'usr-carla'],
      ['CONFIRMADA', 'usr-carla'],
    ]);
  });

  test('el organizador ve la misma compra con sus propias acciones', async () => {
    const res = await como('usr-ana').get(`/api/compras/${pericosDeCarla}`);

    expect(res.body).toMatchObject({ rol: 'ORGANIZADOR', acciones: ['MARCAR_UTILIZADA'] });
  });

  test('una compra utilizada sin reseña ofrece reseñar; con reseña no', async () => {
    const deDiego = await como('usr-diego').get(
      `/api/compras/${compraDe(repos, 'usr-diego', 'evt-impro-todo-vale')}`,
    );
    const deCarla = await como('usr-carla').get(
      `/api/compras/${compraDe(repos, 'usr-carla', 'evt-impro-todo-vale')}`,
    );

    expect(deDiego.body.acciones).toEqual(['RESENIAR']);
    expect(deCarla.body.acciones).toEqual([]);
  });

  test('un tercero no puede verla → 403', async () => {
    const res = await como('usr-diego').get(`/api/compras/${pericosDeCarla}`);

    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('PROHIBIDO');
  });

  test('inexistente → 404', async () => {
    expect((await como('usr-carla').get('/api/compras/nada')).status).toBe(404);
  });
});

describe('POST /api/compras/:id/pago', () => {
  test('el comprador paga una compra pendiente', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-hamlet');

    const res = await como('usr-carla').post(`/api/compras/${id}/pago`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      estado: 'CONFIRMADA',
      diasRestantes: 8,
      acciones: ['CANCELAR'],
    });
  });

  test('pagar dos veces → 409 TRANSICION_INVALIDA', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    const res = await como('usr-carla').post(`/api/compras/${id}/pago`);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      codigo: 'TRANSICION_INVALIDA',
      detalles: { desde: 'CONFIRMADA', hacia: 'CONFIRMADA' },
    });
  });

  test.each(['usr-bruno', 'usr-diego'])('%s no puede pagar la compra de otro → 403', async (u) => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-hamlet');

    expect((await como(u).post(`/api/compras/${id}/pago`)).status).toBe(403);
  });
});

describe('POST /api/compras/:id/cancelacion (CU-07, CU-08)', () => {
  test('una compra PENDIENTE queda CANCELADA y se repone el cupo', async () => {
    const { app, repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-hamlet');
    expect(await cupoDe(app, 'evt-hamlet', 'Platea')).toBe(499);

    const res = await como('usr-carla').post(`/api/compras/${id}/cancelacion`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'CANCELADA', puedeCancelarse: false, acciones: [] });
    expect(await cupoDe(app, 'evt-hamlet', 'Platea')).toBe(500);
  });

  test('una compra CONFIRMADA se reembolsa automáticamente', async () => {
    const { app, repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    const res = await como('usr-carla').post(`/api/compras/${id}/cancelacion`);

    expect(res.body.estado).toBe('REEMBOLSADA');
    expect(res.body.historial.map((h) => [h.estado, h.quien?.id ?? null])).toEqual([
      ['PENDIENTE', 'usr-carla'],
      ['CONFIRMADA', 'usr-carla'],
      ['CANCELADA', 'usr-carla'],
      ['REEMBOLSADA', null], // lo hace el sistema
    ]);
    expect(await cupoDe(app, 'evt-pericos-acustico', 'Platea Baja')).toBe(800);
  });

  test('una compra UTILIZADA no se puede cancelar → 409', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-diego', 'evt-impro-todo-vale');

    const res = await como('usr-diego').post(`/api/compras/${id}/cancelacion`);

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      codigo: 'REGLA_NEGOCIO',
      mensaje: 'La compra ya fue utilizada',
    });
  });

  test('si el evento ya se realizó no se puede cancelar → 409', async () => {
    // El Tributo a Soda es a las 15:00; consultamos a las 17:00 del mismo día.
    const { repos, como } = crearAppDePrueba({
      relojEn: new Date(AHORA.getTime() + 5 * 60 * 60 * 1000),
    });
    const id = compraDe(repos, 'usr-carla', 'evt-tributo-soda');

    const detalle = await como('usr-carla').get(`/api/compras/${id}`);
    expect(detalle.body).toMatchObject({ puedeCancelarse: false, acciones: [] });

    const res = await como('usr-carla').post(`/api/compras/${id}/cancelacion`);
    expect(res.status).toBe(409);
    expect(res.body.error.mensaje).toBe('El evento ya se realizó');
  });

  test('cancelar dos veces → 409', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-standup-jueves'); // ya cancelada

    const res = await como('usr-carla').post(`/api/compras/${id}/cancelacion`);

    expect(res.status).toBe(409);
    expect(res.body.error.mensaje).toBe('La compra ya está cancelada');
  });

  test('el organizador no puede cancelar la compra de un comprador → 403', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    expect((await como('usr-ana').post(`/api/compras/${id}/cancelacion`)).status).toBe(403);
  });
});

describe('POST /api/compras/:id/uso', () => {
  test('el organizador marca la entrada como utilizada y el comprador puede reseñar', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    const res = await como('usr-ana').post(`/api/compras/${id}/uso`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'UTILIZADA', rol: 'ORGANIZADOR', acciones: [] });
    expect((await como('usr-carla').get(`/api/compras/${id}`)).body.acciones).toEqual(['RESENIAR']);
  });

  test('el comprador no puede marcarla → 403', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-carla', 'evt-pericos-acustico');

    expect((await como('usr-carla').post(`/api/compras/${id}/uso`)).status).toBe(403);
  });

  test('una compra pendiente no se puede utilizar → 409', async () => {
    const { repos, como } = crearAppDePrueba();
    const id = compraDe(repos, 'usr-elena', 'evt-pericos-acustico');

    const res = await como('usr-ana').post(`/api/compras/${id}/uso`);

    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('TRANSICION_INVALIDA');
  });
});

describe('GET /api/eventos/:id/compras (CU-02)', () => {
  const { app, como } = crearAppDePrueba();

  test('el organizador ve disponibilidad por tipo, resumen por estado y las compras', async () => {
    const res = await como('usr-ana').get('/api/eventos/evt-pericos-acustico/compras');

    expect(res.status).toBe(200);
    expect(res.body.evento).toEqual({
      id: 'evt-pericos-acustico',
      nombre: 'Los Pericos Acústico',
      fecha: expect.any(String),
    });
    expect(res.body.disponibilidad.map(({ tipoEntradaId, ...resto }) => resto)).toEqual([
      { nombre: 'Platea Baja', precio: 55000, cupoTotal: 800, vendidas: 2, disponibles: 798 },
      { nombre: 'Platea Alta', precio: 38000, cupoTotal: 1200, vendidas: 0, disponibles: 1200 },
      { nombre: 'Pullman', precio: 28000, cupoTotal: 600, vendidas: 4, disponibles: 596 },
    ]);
    expect(res.body.resumenPorEstado).toEqual({
      PENDIENTE: 1,
      CONFIRMADA: 1,
      UTILIZADA: 0,
      CANCELADA: 0,
      REEMBOLSADA: 0,
    });
    // Más nuevas primero.
    expect(res.body.compras.map((c) => [c.comprador.id, c.estado])).toEqual([
      ['usr-elena', 'PENDIENTE'],
      ['usr-carla', 'CONFIRMADA'],
    ]);
  });

  test('las compras canceladas no cuentan como vendidas', async () => {
    const res = await como('usr-ana').get('/api/eventos/evt-rock-nacional/compras');

    expect(res.body.resumenPorEstado).toMatchObject({ UTILIZADA: 2, CANCELADA: 1 });
    expect(res.body.disponibilidad.map((d) => [d.nombre, d.vendidas, d.disponibles])).toEqual([
      ['Campo', 2, 2998], // Elena canceló 3
      ['Platea', 1, 999],
    ]);
  });

  test('filtrar por estado no cambia el resumen ni la disponibilidad', async () => {
    const res = await como('usr-ana').get(
      '/api/eventos/evt-pericos-acustico/compras?estado=PENDIENTE',
    );

    expect(res.body.compras.map((c) => c.comprador.id)).toEqual(['usr-elena']);
    expect(res.body.resumenPorEstado.CONFIRMADA).toBe(1);
  });

  test.each(['usr-bruno', 'usr-carla'])('%s no es el organizador → 403', async (u) => {
    expect((await como(u).get('/api/eventos/evt-pericos-acustico/compras')).status).toBe(403);
  });

  test('evento inexistente → 404; sin usuario → 401; estado inválido → 400', async () => {
    expect((await como('usr-ana').get('/api/eventos/nada/compras')).status).toBe(404);
    expect((await request(app).get('/api/eventos/evt-pericos-acustico/compras')).status).toBe(401);
    expect(
      (await como('usr-ana').get('/api/eventos/evt-pericos-acustico/compras?estado=x')).status,
    ).toBe(400);
  });
});

describe('invariante de cupo a través de la API', () => {
  test('disponibles + vendidas = cupoTotal después de compras, pagos y cancelaciones', async () => {
    const { repos, como } = crearAppDePrueba();
    const eventoId = 'evt-standup-jueves';
    const tipoEntradaId = tipoId(repos, eventoId, 'General');
    const comprar = async (u, cantidad) =>
      (await como(u).post('/api/compras').send({ eventoId, tipoEntradaId, cantidad })).body.id;

    const a = await comprar('usr-carla', 3);
    const b = await comprar('usr-diego', 5);
    const c = await comprar('usr-elena', 10);
    await como('usr-diego').post(`/api/compras/${b}/pago`);
    await como('usr-carla').post(`/api/compras/${a}/cancelacion`); // PENDIENTE → CANCELADA
    await como('usr-diego').post(`/api/compras/${b}/cancelacion`); // CONFIRMADA → REEMBOLSADA
    await como('usr-elena').post(`/api/compras/${c}/pago`);
    await como('usr-bruno').post(`/api/compras/${c}/uso`);
    await comprar('usr-ana', 2);

    const res = await como('usr-bruno').get(`/api/eventos/${eventoId}/compras`);
    const [general] = res.body.disponibilidad;

    expect(general).toMatchObject({ cupoTotal: 120, vendidas: 12, disponibles: 108 });
    expect(general.disponibles + general.vendidas).toBe(general.cupoTotal);
  });
});
