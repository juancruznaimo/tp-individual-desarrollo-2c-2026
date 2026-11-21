# 02 — API REST (back-end)

- URL base: `http://<host>:3000/api`
- Formato: JSON. Las fechas van como strings ISO 8601 (`2026-12-20T21:00:00.000-03:00`).
- **Usuario actual:** header `X-User-Id: <id>`. Es obligatorio en todos los endpoints salvo `GET /health`, `GET /usuarios`, `GET /categorias`, `GET /eventos` y `GET /eventos/:id`. Si falta o el usuario no existe → `401 NO_AUTENTICADO`.
- **IDs del seed:** usuarios, categorías y eventos de ejemplo tienen IDs legibles (`usr-ana`, `usr-bruno`, `usr-carla`, `usr-diego`, `usr-elena`; `cat-recitales`, …; `evt-hamlet`, …) para poder probar a mano. Lo que se crea desde la API usa UUID.

## Formato de error

```json
{
  "error": {
    "codigo": "SIN_CUPO",
    "mensaje": "Quedan 3 entradas de tipo VIP y se pidieron 5",
    "detalles": { "disponibles": 3, "solicitadas": 5 }
  }
}
```

Los errores de validación incluyen `detalles` como lista de `{ campo, mensaje }`.

## Paginación

Los listados aceptan `page` (empieza en 1, por defecto 1) y `limit` (por defecto 20, máximo 50). Responden:

```json
{ "data": [ ... ], "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
```

---

## Sistema

### `GET /health`
`200 { "status": "ok" }`

## Usuarios

### `GET /usuarios`
Lista los usuarios del seed para el selector de "iniciar sesión" de la app. `200 [UsuarioResumen]`

### `GET /usuarios/me`
`200 Usuario` (incluye `favoritos: [eventoId]`).

### `GET /usuarios/me/favoritos` · CU-13
`200 [EventoResumen]`

### `PUT /usuarios/me/favoritos/:eventoId` · CU-13
Agrega el evento a favoritos (idempotente). `204`. `404` si el evento no existe.

### `DELETE /usuarios/me/favoritos/:eventoId` · CU-13
Lo quita de favoritos (idempotente). `204`.

## Categorías

### `GET /categorias`
`200 [{ id, nombre, descripcion }]`

## Eventos

### `GET /eventos` · CU-03, CU-11
Búsqueda y exploración del catálogo.

| Query param | Tipo | Descripción |
|---|---|---|
| `q` | string | Texto libre (ver `Evento.coincideCon`) |
| `categoria` | id | Filtra por categoría |
| `precioMin`, `precioMax` | number | Usa `Evento.tuPrecioEstaEntre` |
| `orden` | `fecha` \| `precio` \| `puntaje` | Por defecto `fecha` |
| `direccion` | `asc` \| `desc` | Por defecto `asc` para fecha y precio, `desc` para puntaje |
| `incluirPasados` | boolean | Por defecto `false` (RN-12) |
| `page`, `limit` | | Paginación |

Ordenamiento:
- `precio` → por `precioMinimo()`.
- `fecha` → por `fecha` del evento.
- `puntaje` → por puntaje del organizador (RN-10). Los eventos de organizadores sin reseñas van **al final** en cualquier dirección.
- Desempate: por `fecha` ascendente y después por `id`.

`200 Paginado<EventoResumen>`

```json
EventoResumen = {
  "id": "…", "nombre": "…", "fecha": "…", "lugar": "…",
  "categoria": { "id": "…", "nombre": "Recitales" },
  "imagen": "https://… | null",          // multimedia[0]
  "precioDesde": 15000,
  "agotado": false,                      // todos los tipos con cupo 0
  "yaOcurrio": false,
  "organizador": { "id": "…", "nombre": "…", "apellido": "…", "puntaje": 4.5, "cantidadResenias": 12 }
}
```

`400` si `orden`/`direccion` no son válidos o `precioMin > precioMax`.

### `GET /eventos/:id` · CU-10, CU-12
`200 EventoDetalle` = `EventoResumen` + `descripcion`, `multimedia[]`, `tiposEntrada[{ id, nombre, descripcion, precio, cupo }]`, `esFavorito` y `esOrganizador` (solo si llega `X-User-Id`; la app usa `esOrganizador` para ocultar la compra) y `reseniasOrganizador`: las 5 reseñas más recientes del organizador (de cualquiera de sus eventos), cada una con `{ id, puntuacion, detalle, creadaEn, comprador: { nombre, apellido }, evento: { id, nombre } }`.

`404` si no existe.

### `POST /eventos` · CU-04
El usuario actual pasa a ser el organizador.

```json
{
  "nombre": "Los Piojos en River",
  "descripcion": "…",
  "categoriaId": "…",
  "fecha": "2026-12-20T21:00:00-03:00",
  "lugar": "Estadio Monumental, CABA",
  "multimedia": ["https://…/poster.jpg"],
  "tiposEntrada": [
    { "nombre": "Campo", "descripcion": "De pie", "precio": 45000, "cupo": 20000 },
    { "nombre": "Platea", "precio": 80000, "cupo": 5000 }
  ]
}
```

Validaciones: las de [01-dominio.md](01-dominio.md#evento). El `cupo` enviado inicializa `cupo` y `cupoTotal`.
`201 EventoDetalle` (con header `Location`) · `400 VALIDACION`. Una categoría inexistente también es `400`, con `campo: "categoriaId"`, para que el formulario lo muestre junto al campo. Se ignoran `id` y `cupoTotal` de los tipos de entrada: los asigna el sistema.

### `GET /usuarios/me/eventos`
Eventos que organiza el usuario actual, ordenados por fecha. `200 [EventoResumen + { comprasPorEstado: { PENDIENTE: n, … } }]`

### `GET /eventos/:id/compras` · CU-02
Solo el organizador del evento (RN-06), si no `403`.

| Query param | Descripción |
|---|---|
| `estado` | Filtra por `EstadoCompra` (opcional) |

```json
200 {
  "evento": { "id": "…", "nombre": "…", "fecha": "…" },
  "disponibilidad": [
    { "tipoEntradaId": "…", "nombre": "Campo", "precio": 45000, "cupoTotal": 20000, "vendidas": 1520, "disponibles": 18480 }
  ],
  "resumenPorEstado": { "PENDIENTE": 3, "CONFIRMADA": 40, "UTILIZADA": 0, "CANCELADA": 2, "REEMBOLSADA": 1 },
  "compras": [ CompraResumen ]          // más nuevas primero
}
```

El filtro `estado` solo afecta a `compras`: `disponibilidad` y `resumenPorEstado` siempre son del evento completo.

### `GET /organizadores/:id/resenias` · CU-10
Pública. Todas las reseñas de los eventos del organizador, de más nueva a más vieja. `200 { puntaje, cantidadResenias, resenias: Paginado<Resenia> }` · `404` si el usuario no existe.

### `POST /eventos/:id/resenias` · CU-09
```json
{ "puntuacion": 4.5, "detalle": "Excelente sonido, muy organizado." }
```
Primero se validan los datos y después si puede reseñar. `201 Resenia` · `400` validación · `404` evento inexistente · `409 REGLA_NEGOCIO` si no tiene compra `UTILIZADA` del evento, si ya lo reseñó o si es el organizador (RN-08, RN-09).

## Compras

```json
CompraResumen = {
  "id": "…", "estado": "CONFIRMADA", "cantidad": 2, "total": 90000, "creadaEn": "…",
  "diasRestantes": 12,                         // null si no está CONFIRMADA
  "puedeCancelarse": true,
  "tipoEntrada": { "id": "…", "nombre": "Campo", "precio": 45000 },
  "evento": { "id": "…", "nombre": "…", "fecha": "…", "lugar": "…", "imagen": "…",
             "organizador": { "id": "…", "nombre": "…", "apellido": "…" } },
  "comprador": { "id": "…", "nombre": "…", "apellido": "…" },
  "cantidadMensajes": 3
}
```

### `POST /compras` · CU-12
```json
{ "eventoId": "…", "tipoEntradaId": "…", "cantidad": 2 }
```
Crea la compra en `PENDIENTE` y reserva cupo (RN-01, RN-02, RN-09, RN-11).
`201 CompraDetalle` (con header `Location`) · `400` validación · `404` evento/tipo inexistente · `409 SIN_CUPO` · `409 REGLA_NEGOCIO` (el evento ya ocurrió o el usuario es el organizador).

### `GET /usuarios/me/compras` · CU-01
Compras del usuario actual como comprador. Por defecto ordenadas por fecha del evento ascendente.
Query: `estado` (opcional). `200 [CompraResumen]`

### `GET /compras/:id`
Solo los participantes (comprador u organizador), si no `403`.
`200 CompraDetalle` = `CompraResumen` + `historial: [{ estado, fechaHora, quien: { id, nombre, apellido } | null }]` + `rol: "COMPRADOR" | "ORGANIZADOR"` (el rol del usuario actual en esta compra) + `acciones: ["PAGAR","CANCELAR","MARCAR_UTILIZADA","RESENIAR"]` (las que el usuario actual puede hacer ahora).

`acciones` evita repetir las reglas en la app: el front-end solo muestra los botones que llegan. Lo calcula `Compra.accionesPara(usuario, ahora)` en el dominio:

| Acción | Para | Cuándo |
|---|---|---|
| `PAGAR` | comprador | `PENDIENTE` y el evento no ocurrió |
| `CANCELAR` | comprador | `puedeCancelarse` (RN-04) |
| `RESENIAR` | comprador | `UTILIZADA` y todavía no reseñó el evento |
| `MARCAR_UTILIZADA` | organizador | `CONFIRMADA` |

### `POST /compras/:id/pago`
Comprador. `PENDIENTE → CONFIRMADA`. `200 CompraDetalle` · `403` · `409 TRANSICION_INVALIDA`.

### `POST /compras/:id/cancelacion` · CU-07, CU-08
Comprador. Aplica RN-04; si la compra estaba `CONFIRMADA` termina en `REEMBOLSADA`, si estaba `PENDIENTE` en `CANCELADA`. Repone cupo (RN-03).
`200 CompraDetalle` · `403` · `409 REGLA_NEGOCIO` con mensaje explícito ("La compra ya fue utilizada" / "El evento ya se realizó").

### `POST /compras/:id/uso`
Organizador del evento. `CONFIRMADA → UTILIZADA`. `200 CompraDetalle` · `403` · `409 TRANSICION_INVALIDA`.

## Mensajes

### `GET /compras/:id/mensajes` · CU-05, CU-06
Participantes. Ordenados por `enviado` ascendente.
Query opcional `desde` (ISO): solo mensajes estrictamente posteriores, para que el polling traiga solo lo nuevo (`400` si no es una fecha).
`200 [{ id, mensaje, enviado, usuario: { id, nombre, apellido }, esMio: boolean }]`

### `POST /compras/:id/mensajes` · CU-05, CU-06
```json
{ "mensaje": "¿A qué hora abren las puertas?" }
```
Participantes, en cualquier estado (RN-07). `201 Mensaje` · `400` · `403`.

---

## Trazabilidad CU → endpoints

| CU | Endpoints |
|---|---|
| CU-01 | `GET /usuarios/me/compras` |
| CU-02 | `GET /eventos/:id/compras` |
| CU-03 | `GET /eventos?q=&categoria=`, `GET /categorias` |
| CU-04 | `POST /eventos` |
| CU-05 / CU-06 | `GET`, `POST /compras/:id/mensajes` |
| CU-07 / CU-08 | `POST /compras/:id/cancelacion` |
| CU-09 | `POST /eventos/:id/resenias`, `POST /compras/:id/uso` |
| CU-10 | `GET /eventos/:id` (`reseniasOrganizador`), `GET /organizadores/:id/resenias` |
| CU-11 | `GET /eventos?orden=&direccion=` |
| CU-12 | `GET /eventos/:id`, `POST /compras` |
| CU-13 | `/usuarios/me/favoritos` |
