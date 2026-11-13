# 04 — Plan por etapas

Cada etapa termina con algo que se puede ejecutar y probar. Primero se hace el back-end (etapas 1–4), que se prueba con tests y Postman/curl. Después la app (etapas 5–8) consume una API que ya está estable.

```
E0 Setup ─▶ E1 Dominio ─▶ E2 Eventos ─▶ E3 Compras ─▶ E4 Chat y reseñas
                                                          │
            E8 Cierre ◀─ E7 App organizador ◀─ E6 App compras ◀─ E5 App explorar
```

---

## Etapa 0 — Setup del proyecto

**Objetivo:** dejar armado el esqueleto de los dos módulos y verificar que se conectan.

Entregables
- `backend/`: `package.json` (ESM), Express, `cors`, `app.js` / `server.js`, `GET /api/health`, middleware de errores, Jest + Supertest configurados, ESLint + Prettier. Scripts: `dev` (node --watch), `start`, `test`.
- `mobile/`: proyecto Vite + React Native + `react-native-web` (sin Expo). `vite.config.js` con alias, `server.host: true` y proxy `/api` → `http://localhost:3000`. React Navigation instalado. `src/api/client.js` y una pantalla temporal que muestra el resultado de `/api/health`. Scripts: `dev`, `build`.
- `README.md` raíz con instrucciones para levantar los dos módulos y entrar desde el celular.
- `.gitignore`.

Criterios de aceptación
- [x] `npm test` en `backend/` pasa (con el test de `/health`).
- [ ] Desde el navegador del celular, en `http://<IP>:5173`, se ve "Back-end OK" hecho con componentes de React Native.

---

## Etapa 1 — Dominio y persistencia en memoria

**Objetivo:** las clases del diagrama con sus reglas, testeadas sin HTTP.

Entregables
- `domain/`: `Usuario`, `Categoria`, `TipoEntrada`, `Evento`, `Compra`, `Mensaje`, `Resenia`, `CambioEstadoCompra`, `EstadoCompra` (objeto congelado).
- Máquina de estados en `Compra.actualizarEstado` (tabla de transiciones).
- `errors/`: `AppError` y subclases.
- `repositories/`: `RepositorioEnMemoria` genérico (`Map`; `guardar`, `buscarPorId`, `todos`, `filtrar`, `limpiar`) y uno por entidad con consultas específicas (`ComprasRepo.porComprador`, `porEvento`; `ReseniasRepo.porOrganizador`, etc.).
- `seed/`: 6 categorías, 5 usuarios, unos 12 eventos (algunos ya pasados, con compras `UTILIZADA` y reseñas), compras en todos los estados y mensajes.
- `clock` inyectable (`{ ahora: () => new Date() }`).

Tests unitarios (mínimo)
- `TipoEntrada.hayCupoPara` / `reservar` / `liberar` (bordes: igual al cupo, cupo 0).
- `Evento.tuPrecioEstaEntre` (límites inclusivos, sin límite de un lado, varios tipos).
- `Evento.coincideCon` (mayúsculas y tildes: "musica" encuentra "Música").
- Todas las transiciones válidas de `Compra` y al menos 5 inválidas; el historial registra cada cambio.
- `puedeCancelarse`: PENDIENTE/CONFIRMADA con evento futuro → sí; UTILIZADA → no; evento pasado → no.
- `diasRestantes`: hoy = 0, mañana = 1, evento a las 00:30 del día siguiente = 1, no confirmada = `null`.
- Puntaje del organizador: sin reseñas = `null`, promedio redondeado a 1 decimal.

Criterios de aceptación
- [x] Cobertura de `domain/` ≥ 90 % (99 % de líneas al cerrar la etapa).

---

## Etapa 2 — API de eventos · CU-03, CU-04, CU-10 (parcial), CU-11, CU-13

Entregables
- Middleware `usuarioActual` (header `X-User-Id`; obligatorio u opcional según la ruta).
- `GET /usuarios`, `GET /usuarios/me`, `GET /categorias`.
- `GET /eventos` con búsqueda, filtros, orden, dirección y paginación.
- `GET /eventos/:id` (con puntaje del organizador; `reseniasOrganizador` puede quedar vacío hasta E4).
- `POST /eventos` con validación completa.
- `GET /usuarios/me/eventos`.
- Favoritos: `GET`/`PUT`/`DELETE /usuarios/me/favoritos`.

Tests de API (mínimo)
- Búsqueda por texto, por categoría y combinadas.
- Cada orden en ambas direcciones; los organizadores sin puntaje quedan al final.
- Los eventos pasados están excluidos por defecto.
- `POST /eventos`: caso feliz, sin tipos de entrada, nombres de tipo repetidos, precio negativo, cupo 0, fecha pasada, categoría inexistente, sin `X-User-Id`.

Criterios de aceptación
- [x] Colección de Postman (o archivo `.http`) en `backend/requests/` con un ejemplo por endpoint (`api.http`).

---

## Etapa 3 — API de compras · CU-01, CU-02, CU-07, CU-08, CU-12

Entregables
- `POST /compras` (RN-01, RN-02, RN-09, RN-11).
- `GET /usuarios/me/compras` con `diasRestantes` y `puedeCancelarse`.
- `GET /compras/:id` con `historial`, `rol` y `acciones`.
- `POST /compras/:id/pago`, `/cancelacion` (con reembolso automático), `/uso`.
- `GET /eventos/:id/compras` con `disponibilidad` y `resumenPorEstado`.

Tests de API (mínimo)
- Comprar exactamente el cupo restante → OK; uno más → `409 SIN_CUPO`; el cupo no cambia si la compra falla.
- Comprar un evento pasado o propio → `409`.
- Cancelar PENDIENTE → `CANCELADA`; cancelar CONFIRMADA → `REEMBOLSADA` con 2 entradas nuevas en el historial; el cupo se repone.
- Cancelar UTILIZADA o con el evento pasado → `409` con el mensaje correspondiente (CU-08).
- Un tercero no puede ver ni operar la compra → `403`.
- El invariante `disponibles + vendidas = cupoTotal` se cumple después de una secuencia de compras y cancelaciones.

---

## Etapa 4 — API de mensajes y reseñas · CU-05, CU-06, CU-09, CU-10

Entregables
- `GET`/`POST /compras/:id/mensajes` (con `desde` y `esMio`).
- `POST /eventos/:id/resenias` (RN-08, RN-09).
- `GET /organizadores/:id/resenias`.
- `reseniasOrganizador` completo en `GET /eventos/:id`; la acción `RESENIAR` en `acciones`.

Tests de API (mínimo)
- Comprador y organizador escriben en una compra cancelada → OK; un tercero → `403`; mensaje vacío → `400`.
- `desde` devuelve solo los mensajes posteriores.
- Reseñar sin compra UTILIZADA → `409`; dos veces → `409`; puntuación 0, 5.5 o 3.3 → `400`.
- Después de reseñar cambian el puntaje del organizador y el orden por puntaje en `GET /eventos`.

Criterios de aceptación
- [x] Back-end completo: todos los endpoints de [02-api.md](02-api.md) implementados y testeados.

---

## Etapa 5 — App: base, explorar y comprar · CU-03, CU-10, CU-11, CU-12, CU-13

Entregables
- `UsuarioContext` + SeleccionUsuario (persistido en `localStorage`).
- `linking` de React Navigation: cada pantalla tiene URL y funciona el botón "atrás" del navegador.
- Tabs y stacks de navegación (con pantallas placeholder donde todavía no hay nada).
- Componentes comunes: `EventoCard`, `EstadoBadge`, `Estrellas`, `Loading`/`ErrorView`/`EmptyView`, formateadores.
- Explorar (búsqueda con debounce, categorías, orden, rango de precio, scroll infinito).
- DetalleEvento con reseñas, favorito y flujo de compra.
- ReseniasOrganizador.
- DetalleCompra básico (resumen después de comprar); la Etapa 6 le suma historial, acciones y chat.

Criterios de aceptación
- [x] Buscar "rock", filtrar por Recitales, ordenar por puntaje y comprar 2 entradas desde el celular (verificado con un navegador automatizado a 390 px de ancho).
- [x] Intentar comprar más que el cupo no es posible desde la UI (el stepper está limitado).

---

## Etapa 6 — App: mis compras, detalle, chat · CU-01, CU-05, CU-07, CU-09

Entregables
- MisCompras (filtros, agrupado, días restantes).
- DetalleCompra (historial, botones según `acciones`, diálogo de cancelación, modal de reseña).
- Chat con polling.
- Perfil con favoritos.

Criterios de aceptación
- [ ] Pagar una compra muestra "Faltan N días"; cancelarla la deja en REEMBOLSADA.
- [ ] Una compra UTILIZADA del seed permite dejar una reseña, que aparece en el detalle del evento.
- [ ] Con dos dispositivos (o cambiando de usuario), los mensajes aparecen del otro lado en ≤ 5 s.

---

## Etapa 7 — App: organizador · CU-02, CU-04, CU-06

Entregables
- MisEventos.
- CrearEvento con tipos de entrada dinámicos y errores por campo.
- ComprasDelEvento (disponibilidad por tipo, contadores y filtro por estado).
- Desde DetalleCompra como organizador: marcar utilizada y responder el chat.

Criterios de aceptación
- [ ] Crear un evento con 3 tipos de entrada y verlo en Explorar con otro usuario.
- [ ] Después de una compra, ComprasDelEvento muestra la disponibilidad actualizada.

---

## Etapa 8 — Cierre

Entregables
- Pasada de responsive en todas las pantallas: 360 px, 430 px, horizontal y escritorio.
- Pantalla de "Sin conexión con el servidor".
- README final: arquitectura, cómo correr, usuarios del seed y guion de demo.
- Revisión de estados vacíos y de error en todas las pantallas.
- Pasada de lint en los dos módulos.
- Checklist de demo que recorra CU-01 a CU-12.

Criterios de aceptación
- [ ] `npm test` en verde y cada CU demostrable en la app.
- [ ] Todo el guion de demo se puede recorrer desde el navegador del celular, sin scroll horizontal ni zoom.

---

## Matriz de cobertura

| CU | Back-end | App |
|---|---|---|
| CU-01 | E3 | E6 |
| CU-02 | E3 | E7 |
| CU-03 | E2 | E5 |
| CU-04 | E2 | E7 |
| CU-05 | E4 | E6 |
| CU-06 | E4 | E7 |
| CU-07 | E3 | E6 |
| CU-08 | E1, E3 | E6 |
| CU-09 | E4 | E6 |
| CU-10 | E2, E4 | E5 |
| CU-11 | E2 | E5 |
| CU-12 | E1, E3 | E5 |
| CU-13 | E2 | E5, E6 |
