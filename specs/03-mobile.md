# 03 — App mobile (React Native web, responsive)

## Stack

- React Native (JavaScript) renderizado en el navegador con `react-native-web`. **Sin Expo.**
- Vite + `@vitejs/plugin-react`, con el alias `react-native` → `react-native-web` y `resolve.extensions` priorizando `.web.jsx`/`.web.js` (así un componente puede tener una variante solo para web). Los componentes van en archivos `.jsx`.
- React Navigation: `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack` (con `react-native-safe-area-context` y `react-native-screens`, que tienen soporte web; `native-stack` no necesita `react-native-gesture-handler`). Se configura `linking` para que cada pantalla tenga URL (`/eventos/:id`, `/compras/:id`, …) con `initialRouteName` en cada stack: si se entra por URL a un detalle, debajo queda el listado y aparece la flecha para volver.
- Íconos: `lucide-react` envuelto en `components/Icono.jsx`. **[decisión]** `react-native-svg` (que necesita `lucide-react-native`) no compila para web con Vite porque importa módulos nativos (`TurboModuleRegistry`); los íconos se dibujan como SVG del navegador y, si la app pasara a nativo, solo cambia `Icono.jsx`.
- Cliente HTTP: `fetch` a `/api` (ruta relativa, mismo origen) envuelto en `src/api/client.js`, que agrega `X-User-Id` y convierte las respuestas de error en `ApiError { status, codigo, mensaje, detalles }`.
- Estado: React Context para el usuario actual; estado local + hooks (`useApi`) para los datos de cada pantalla. No hace falta Redux.
- Persistencia local: un wrapper `src/utils/storage.js` sobre `localStorage` (con try/catch); solo guarda el usuario elegido.
- Selector de fecha: componente `DateTimeInput.web.jsx` que renderiza un `<input type="datetime-local">` nativo del navegador (en el celular abre el picker del sistema).

## Limitaciones de react-native-web

- `Alert.alert` no hace nada en web: los errores se muestran en línea (`MensajeError`) y las confirmaciones con un `Modal` propio.
- `RefreshControl` (pull-to-refresh) no existe en web: las pantallas se recargan solas al volver a tener foco (`useRecargarAlVolver`).
- `onEndReached` no siempre se dispara si la primera página no llena la pantalla (ej. en escritorio): los listados tienen además un botón "Ver más".

## Responsive

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **Mobile-first:** se diseña para anchos de 360–430 px. Desde 768 px el contenido se centra con un ancho máximo de 480 px, salvo Explorar, que pasa a una grilla de 2 columnas.
- Breakpoints con `useWindowDimensions()` (se recalcula al rotar o redimensionar), sin media queries de CSS.
- Áreas táctiles de al menos 44×44 px; inputs con al menos 16 px de fuente (si no, iOS hace zoom al enfocarlos).
- Respeta las safe areas (notch) con `react-native-safe-area-context`.
- Sin scroll horizontal en ninguna pantalla.
- **Sin conexión:** si `fetch` falla por red, `ErrorView` muestra "Sin conexión con el servidor" con un botón para reintentar.

## Navegación

```
Stack raíz
├── SeleccionUsuario                 (si no hay usuario elegido)
└── Tabs
    ├── Explorar (stack)
    │   ├── Explorar                 CU-03, CU-11
    │   ├── DetalleEvento            CU-10, CU-12, CU-13
    │   └── ReseniasOrganizador      CU-10
    ├── MisCompras (stack)
    │   ├── MisCompras               CU-01
    │   └── DetalleCompra            CU-07, CU-09
    ├── MisEventos (stack)
    │   ├── MisEventos
    │   ├── CrearEvento              CU-04
    │   └── ComprasDelEvento         CU-02
    └── Perfil                       favoritos, cambiar de usuario
Pantallas compartidas (se apilan desde cualquier tab)
├── Chat                             CU-05, CU-06
└── DetalleCompra                    (también la abre el organizador desde ComprasDelEvento)
```

## Componentes comunes

- `EstadoBadge`: chip de color por estado (lo pide explícitamente CU-01 y CU-02).

  | Estado | Color | Ícono |
  |---|---|---|
  | PENDIENTE | ámbar | reloj |
  | CONFIRMADA | verde | check |
  | UTILIZADA | azul | ticket |
  | CANCELADA | gris | cruz |
  | REEMBOLSADA | violeta | flecha de devolución |

  El color nunca es la única señal: el chip siempre lleva texto e ícono.
- `EventoCard`: imagen, nombre, fecha, lugar, "desde $X", puntaje del organizador (★ 4.5 · 12) y una marca de "Agotado".
- `Estrellas` / `SelectorEstrellas`: muestra (solo lectura) o permite elegir una puntuación de 1 a 5 en pasos de 0.5 (tocar la mitad izquierda de una estrella elige la media).
- `Imagen`: imagen remota que, si falla la carga, muestra un ícono en lugar de un recuadro vacío.
- `ErrorView` / `EmptyView` / `Loading`: estados de pantalla uniformes, con botón "Reintentar".
- Formato: moneda `es-AR` (`$ 45.000`) y fechas `es-AR` en la zona de Buenos Aires.

## Pantallas

### SeleccionUsuario
Lista de `GET /usuarios`. Al tocar uno, se guarda en el contexto (y en `localStorage`) y se entra a las tabs.

### Explorar · CU-03, CU-11
- Barra de búsqueda con debounce de 400 ms → `q`.
- Chips horizontales de categorías (`GET /categorias`) con "Todas" al principio; elegir una filtra por `categoria`.
- Selector de orden: **Fecha** · **Precio** · **Puntaje del organizador**, más un botón para invertir la dirección.
- Filtro opcional de rango de precio: chip "Rango de precio" que abre un bottom sheet con mínimo y máximo (valida que el mínimo no supere al máximo).
- Lista con scroll infinito (`page`, 12 por página) más un botón "Ver más eventos"; se recarga al volver a la pantalla.
- Vacío: "No encontramos eventos para «texto»".

### DetalleEvento · CU-10, CU-12, CU-13
- Carrusel de `multimedia` (si una imagen no carga se muestra un ícono de reemplazo), nombre, categoría, fecha, lugar, descripción.
- Organizador con su puntaje → navega a ReseniasOrganizador.
- Sección **Reseñas de eventos anteriores** (`reseniasOrganizador`), con "Ver todas".
- Corazón de favorito (PUT/DELETE).
- **Comprar:** lista de tipos de entrada (precio y cupo disponible; deshabilitados si el cupo es 0). Al elegir uno aparece un stepper de cantidad, limitado a `min(cupo, 10)`, con el total en vivo. "Comprar" → `POST /compras` → navega a DetalleCompra.
- Si el evento ya ocurrió o el usuario es el organizador, no se muestra la sección de compra.
- Un `409 SIN_CUPO` muestra el mensaje y recarga el detalle (el cupo cambió).

### MisCompras · CU-01
- Filtro por estado (chips: Todas, Pendientes, Confirmadas, Utilizadas, Canceladas/Reembolsadas).
- Cada item muestra imagen, evento, fecha, tipo × cantidad, total, `EstadoBadge` y, **si está CONFIRMADA**, una etiqueta destacada con los días: "Faltan 12 días" / "Falta 1 día" / "¡Es hoy!".
- Agrupado en "Próximos" (el evento no ocurrió) y "Pasados".

### DetalleCompra · CU-07, CU-09
- Encabezado con el evento y `EstadoBadge` grande; días restantes si está confirmada.
- Resumen: tipo, cantidad, precio unitario, total.
- Línea de tiempo del `historial`.
- Botones según `acciones` del back-end:
  - **Pagar** (PAGAR).
  - **Cancelar compra** (CANCELAR): diálogo de confirmación que aclara si habrá reembolso.
  - **Marcar como utilizada** (MARCAR_UTILIZADA), solo para el organizador.
  - **Calificar evento** (RESENIAR): modal con estrellas y comentario → `POST /eventos/:id/resenias`.
- Botón **Chat** con la cantidad de mensajes.

### Chat · CU-05, CU-06
- Burbujas: las propias a la derecha (`esMio`); arriba, el nombre del otro participante.
- Input + enviar (deshabilitado si el texto está vacío; máximo 1000 caracteres).
- Polling cada 5 s con `desde = enviado del último mensaje`, solo mientras la pantalla tiene foco (`useFocusEffect`) **y** la pestaña está visible (`document.visibilityState === "visible"`). Al volver a la pestaña se consulta en el momento.
- Disponible en cualquier estado de la compra.

### MisEventos
- Eventos del organizador con un resumen de compras por estado.
- Botón flotante "+" → CrearEvento.
- Tocar un evento → ComprasDelEvento.

### CrearEvento · CU-04
- Campos: nombre, descripción, categoría (picker), fecha y hora (`DateTimeInput`), lugar y URLs de imágenes (lista donde se agregan y quitan).
- **Tipos de entrada:** lista dinámica con nombre, descripción, precio y cupo; "Agregar tipo"; mínimo 1.
- Validación en el cliente con las mismas reglas del dominio. Los errores del back-end (`detalles[].campo`) se muestran junto al campo que corresponde.
- Al crear → vuelve a MisEventos y lo refresca.

### ComprasDelEvento · CU-02
- Tarjetas de **disponibilidad por tipo**: barra de progreso vendidas/total, con "quedan N" en grande.
- Contadores por estado (con colores de `EstadoBadge`) que también sirven de filtro.
- Lista de compras: comprador, tipo × cantidad, total y `EstadoBadge`. Tocar → DetalleCompra (como organizador: marcar utilizada, chat).

### ReseniasOrganizador · CU-10
Puntaje promedio, cantidad de reseñas y lista paginada (evento, estrellas, comentario, autor, fecha).

### Perfil
Datos del usuario, lista de favoritos (→ DetalleEvento) y "Cambiar de usuario".
