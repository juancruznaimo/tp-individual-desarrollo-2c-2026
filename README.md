# AI Ticket It

Plataforma de publicación de eventos y venta de entradas. Trabajo Práctico Individual de DDSO.

Los **organizadores** publican eventos con distintos tipos de entrada (precio y cupo) y siguen sus ventas. Los **compradores** exploran el catálogo, compran entradas, siguen el estado de cada compra, chatean con el organizador y, después del evento, dejan una reseña.

- **`backend/`**: API REST en Node.js + Express, con persistencia en memoria.
- **`mobile/`**: front-end en React Native que corre en el navegador con `react-native-web` (empaquetado con Vite). Es mobile-first, pensado para usarlo desde el celular.
- **`specs/`**: especificación funcional y técnica, y plan por etapas. Empezar por [specs/README.md](specs/README.md).

## Arquitectura

```
  Navegador del celular (misma Wi-Fi)
        │ http://<IP-de-la-PC>:5173
        ▼
┌───────────────────────────────┐   /api/* (proxy)   ┌───────────────────────────────────┐
│  mobile/ (Vite) :5173         │ ─────────────────▶ │  backend/ (Node + Express) :3000  │
│  React Native + RN Web        │                    │                                   │
│  React Navigation             │                    │  routes → controllers → services  │
│  screens → hooks → api        │                    │        → repositories (memoria)   │
└───────────────────────────────┘                    │        → domain (modelos)         │
                                                     └───────────────────────────────────┘
```

**Back-end** (`backend/src/`)

| Capa | Responsabilidad |
|---|---|
| `routes/` | Mapea cada endpoint a su controller y aplica el middleware `usuarioActual` (header `X-User-Id`) |
| `controllers/` | Lee y valida los parámetros HTTP y arma la respuesta |
| `services/` | Casos de uso: coordina repositorios, dominio y reloj |
| `domain/` | Entidades con sus reglas de negocio (máquina de estados de `Compra`, cupos, reputación) |
| `repositories/` | Persistencia en memoria (`Map`), una por entidad |
| `mappers/` | Traducen el dominio al JSON de la API |
| `seed/` | Datos de ejemplo que se cargan al arrancar |

La compra devuelve las `acciones` que el usuario puede hacer en ese momento (pagar, cancelar, marcar utilizada, reseñar), así la app no repite las reglas del dominio: solo muestra los botones que llegan.

**App** (`mobile/src/`)

| Carpeta | Contenido |
|---|---|
| `api/` | Cliente HTTP (`fetch` a `/api`, agrega `X-User-Id`, detecta la falta de conexión) y una función por endpoint |
| `navigation/` | Tabs (Explorar, Mis compras, Mis eventos, Perfil) con un stack cada una; cada pantalla tiene su URL |
| `screens/` | Pantallas agrupadas por tab |
| `components/` | Componentes comunes: `EventoCard`, `CompraItem`, `EstadoBadge`, `Estrellas`, `Dialogo`, estados de carga, error y vacío, banner de sin conexión |
| `hooks/` | `useApi`, `usePaginado`, `useMensajes` (polling del chat), utilidades |
| `context/` | Usuario actual (se recuerda en `localStorage`) |

No hay login: al entrar se elige uno de los usuarios de ejemplo.

## Requisitos

- Node.js 20 o superior (probado con Node 24).
- El celular y la PC en la misma red Wi-Fi.

## Cómo levantarlo

En dos terminales:

```bash
# 1. Back-end → http://localhost:3000/api
cd backend
npm install
npm run dev
```

```bash
# 2. Front-end → http://localhost:5173
cd mobile
npm install
npm run dev
```

Vite imprime dos URLs:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

**Desde el celular** abrí la URL de `Network`. El front-end le pasa las llamadas a `/api` al back-end (proxy de Vite), así que el celular no necesita conocer el puerto del back-end.

### Si los puertos están ocupados

Si otra aplicación ya usa el puerto 3000, levantá el back-end en otro y avisale al proxy:

```bash
cd backend && PORT=3100 npm run dev
cd mobile && API_URL=http://localhost:3100 npm run dev
```

Si el 5173 está ocupado, Vite toma el siguiente libre; la URL correcta es la que imprime.

### Si el celular no carga la página

Probablemente el firewall esté bloqueando el puerto de Vite. En Fedora:

```bash
sudo firewall-cmd --add-port=5173/tcp                 # hasta reiniciar
sudo firewall-cmd --add-port=5173/tcp --permanent     # permanente
```

En macOS: Ajustes del Sistema → Red → Firewall, y permitir conexiones entrantes a `node`.

## Scripts

| Módulo | Script | Qué hace |
|---|---|---|
| backend | `npm run dev` | Levanta la API y la reinicia al guardar cambios |
| backend | `npm start` | Levanta la API |
| backend | `npm test` | Corre los tests (Jest + Supertest) |
| backend | `npm run lint` / `npm run format` | ESLint / Prettier |
| backend | `requests/api.http` | Requests de ejemplo para REST Client (VS Code) o el cliente HTTP de JetBrains |
| mobile | `npm run dev` | Servidor de desarrollo, accesible desde la red local |
| mobile | `npm run build` | Build de producción en `mobile/dist/` |
| mobile | `npm run lint` / `npm run format` | ESLint / Prettier |

## Variables de entorno

| Variable | Módulo | Por defecto | Uso |
|---|---|---|---|
| `PORT` | backend | `3000` | Puerto de la API |
| `HOST` | backend | `0.0.0.0` | Interfaz donde escucha |
| `API_URL` | mobile | `http://localhost:3000` | Destino del proxy `/api` de Vite |

## Datos de ejemplo

Al arrancar, el back-end carga datos de ejemplo en memoria. Las fechas son relativas al día en que se levanta, así que siempre hay eventos pasados y futuros. **Los cambios se pierden al reiniciar el back-end**: reiniciarlo es la forma de volver a empezar la demo.

| Usuario | Rol en los datos |
|---|---|
| Ana Gómez | Organiza recitales y festivales (puntaje 4.5): Los Pericos, Tributo a Soda Stereo, Jazz en el Bosque, Cosquín Rock |
| Bruno Díaz | Organiza teatro y stand-up (puntaje 3.5): Hamlet, El Fantasma de la Ópera, Stand-up de los Jueves |
| Carla Pérez | Compradora con compras en todos los estados; su compra de Los Pericos tiene un chat con Ana |
| Diego Fernández | Comprador; tiene una entrada utilizada de Impro Show sin reseñar |
| Elena Ruiz | Compradora y organizadora (sin reseñas todavía): JSConf Argentina, Maratón Nocturna 10K |

## Guion de demo

Recorre todos los casos de uso. Conviene hacerlo con el back-end recién levantado. Para cambiar de usuario: Perfil → **Cambiar de usuario**.

**1. Explorar y comprar (Carla)**

1. Entrar como **Carla Pérez**.
2. **Explorar**: escribir "rock" en el buscador (aparece Cosquín Rock); borrar el texto y tocar la categoría **Recitales** (CU-03).
3. Ordenar por **Puntaje**, después por **Precio** y por **Fecha**, e invertir la dirección con el botón de orden (CU-11).
4. Quitar los filtros y abrir **Jazz en el Bosque**: la **Mesa VIP** dice "¡Últimas 1!" y el stepper de cantidad no deja pasar de 1 (CU-12).
5. Tocar el organizador (Ana): se ven sus reseñas de eventos anteriores (CU-10). Volver.
6. Marcar el evento como favorito con el corazón (CU-13).
7. Elegir **General**, subir la cantidad a 2 y **Comprar 2 entradas**: abre el detalle de la compra en estado **Pendiente de pago** (CU-12).

**2. Seguir la compra (Carla)**

1. **Pagar**: pasa a **Confirmada** y muestra "Faltan N días".
2. **Mis compras**: las compras se distinguen por estado (chips de colores) y las confirmadas muestran los días que faltan; "Tributo a Soda Stereo" dice "¡Es hoy!" (CU-01). Probar los filtros por estado.
3. Abrir **Los Pericos Acústico** → **Chat**: escribir una consulta al organizador (CU-05).
4. Abrir la compra pendiente de **Hamlet** → **Cancelar compra**: el diálogo aclara que no hay reembolso porque no se pagó; queda **Cancelada** (CU-07).
5. Abrir **Jazz en el Bosque** (la recién pagada) → **Cancelar compra**: el diálogo informa el reintegro; queda **Reembolsada** y el historial muestra los dos pasos (CU-07).
6. Abrir **Noche de Rock Nacional** (utilizada) o **Festival Verano Electrónico** (reembolsada): no aparece **Cancelar compra**, porque ya se usó o el evento ya pasó (CU-08).
7. **Perfil**: Jazz en el Bosque aparece en favoritos.

**3. Organizar (Ana)**

1. Cambiar a **Ana Gómez** → **Mis eventos**: cada evento muestra sus compras por estado.
2. Abrir **Los Pericos Acústico**: disponibilidad por tipo de entrada (quedan N, barra de vendidas) y compras filtrables por estado (CU-02).
3. Abrir la compra de Carla → **Chat**: está el mensaje del paso 2.3; responderlo (CU-06). Con dos dispositivos, el mensaje aparece del otro lado en hasta 5 segundos.
4. Volver a **Mis eventos** → **Tributo a Soda Stereo** → compra de Carla → **Marcar como utilizada**.
5. **+** (crear evento): probar **Publicar evento** con el formulario vacío para ver los errores por campo. Después completar nombre, descripción, categoría, fecha futura, lugar y **3 tipos de entrada** con precio y cupo, y publicarlo (CU-04).

**4. Reseñar (Carla)**

1. Cambiar a **Carla** → **Mis compras** → **Tributo a Soda Stereo** (ahora utilizada) → **Calificar evento**: elegir 3 estrellas y escribir un comentario (CU-09).
2. Tocar el nombre del evento: la reseña aparece en **Reseñas de eventos anteriores** y el puntaje de Ana baja de 4.5 a 4.1 (CU-10).
3. **Explorar**: buscar el evento creado por Ana en el paso 3.5; se puede comprar (CU-04). Volver a Ana → **Mis eventos** → ese evento: la disponibilidad se actualizó (CU-02).

**5. Sin conexión**

1. Detener el back-end con la app abierta y navegar: aparece el banner **Sin conexión con el servidor**, y las pantallas que no habían cargado muestran **Reintentar**.
2. Levantarlo de nuevo: el banner desaparece solo en unos segundos.

### Checklist de casos de uso

| CU | Caso de uso | Paso del guion |
|---|---|---|
| CU-01 | Ver mis compras con su estado y los días que faltan si están confirmadas | 2.1, 2.2 |
| CU-02 | Ver las compras de un evento y la disponibilidad por tipo | 3.2, 4.3 |
| CU-03 | Buscar eventos por texto o por categoría | 1.2 |
| CU-04 | Crear un evento con varios tipos de entrada | 3.5, 4.3 |
| CU-05 | El comprador escribe en el chat de una compra | 2.3 |
| CU-06 | El organizador responde en el chat de una compra | 3.3 |
| CU-07 | Cancelar una compra y obtener el reembolso | 2.4, 2.5 |
| CU-08 | No se puede cancelar una compra utilizada o con el evento ya realizado | 2.6 |
| CU-09 | Puntuar y comentar un evento con la entrada utilizada | 3.4, 4.1 |
| CU-10 | Ver las reseñas de los eventos anteriores del organizador | 1.5, 4.2 |
| CU-11 | Ordenar por precio, fecha y puntaje del organizador | 1.3 |
| CU-12 | Comprar eligiendo tipo y cantidad sin superar el cupo | 1.4, 1.7 |
| CU-13 | *(Extra)* Guardar eventos favoritos | 1.6, 2.7 |

## Estado

| Etapa | Estado |
|---|---|
| E0 — Setup del proyecto | ✅ |
| E1 — Dominio y persistencia en memoria | ✅ |
| E2 — API de eventos | ✅ |
| E3 — API de compras | ✅ |
| E4 — API de mensajes y reseñas | ✅ |
| E5 — App: base, explorar y comprar | ✅ |
| E6 — App: mis compras, detalle, chat | ✅ |
| E7 — App: organizador | ✅ |
| E8 — Cierre | ✅ (falta recorrer el guion desde el celular) |
