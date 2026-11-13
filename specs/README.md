# AI Ticket It — Especificación

Plataforma para publicar eventos y vender entradas. Los **organizadores** publican eventos con distintos tipos de entrada y gestionan las ventas. Los **compradores** exploran el catálogo, compran entradas, siguen el estado de sus compras, chatean con el organizador y dejan reseñas.

## Índice

| Documento | Contenido |
|---|---|
| [01-dominio.md](01-dominio.md) | Modelo de dominio, reglas de negocio, máquina de estados de la compra |
| [02-api.md](02-api.md) | API REST del back-end: endpoints, requests, responses y errores |
| [03-mobile.md](03-mobile.md) | App React Native: navegación, pantallas y comportamiento |
| [04-etapas.md](04-etapas.md) | Plan de implementación por etapas, con entregables y criterios de aceptación |

## Restricciones del trabajo

- **Back-end:** Node.js + Express.
- **Front-end:** React Native compilado para web con `react-native-web`, como app web **responsive (mobile-first)**. Se usa desde el navegador del celular conectado a la misma red. No se usa Expo.
- **Persistencia:** en memoria. Los datos se pierden al reiniciar el servidor; al arrancar se cargan datos de ejemplo (seed).

## Casos de uso

A cada caso de uso del enunciado le asignamos un ID para poder referenciarlo desde el resto de los specs.

| ID | Actor | Caso de uso |
|---|---|---|
| CU-01 | Comprador | Ver mis compras, diferenciando el estado y, si están **confirmadas**, cuántos días faltan para el evento |
| CU-02 | Organizador | Ver las compras de un evento, diferenciando el estado y cuántas entradas quedan disponibles de cada tipo |
| CU-03 | Comprador | Buscar eventos por texto o explorarlos por categoría |
| CU-04 | Organizador | Crear un evento con distintos tipos de entrada, cada uno con su precio y cupo |
| CU-05 | Comprador | Enviar mensajes en cualquier momento en el chat de una compra |
| CU-06 | Organizador | Responder mensajes en cualquier momento en el chat de una compra |
| CU-07 | Comprador | Cancelar una compra para obtener el reembolso |
| CU-08 | Organizador | Que solo se pueda cancelar si la compra no está **utilizada** y el evento todavía no ocurrió |
| CU-09 | Organizador | Que, una vez utilizada la entrada, el comprador pueda puntuar el evento y dejar un comentario |
| CU-10 | Comprador | Ver, en los eventos de cada organizador, las reseñas de sus eventos anteriores |
| CU-11 | Comprador | Ordenar los resultados de búsqueda por precio, fecha del evento y puntaje del organizador |
| CU-12 | Comprador | Comprar entradas eligiendo un tipo de entrada y una cantidad, sin superar el cupo disponible |
| CU-13 | Comprador | *(Extra, sale del enunciado y del diagrama)* Guardar eventos favoritos |

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

### Estructura del repositorio

```
tp-individual/
├── specs/                  # Este directorio
├── backend/
│   ├── src/
│   │   ├── domain/         # Clases del diagrama + reglas de negocio (sin Express)
│   │   ├── repositories/   # Repositorios en memoria (Map por entidad)
│   │   ├── services/       # Casos de uso: coordinan repositorios y dominio
│   │   ├── controllers/    # Traducen HTTP ⇄ servicios (parseo de query params)
│   │   ├── mappers/        # Dominio → JSON de la API
│   │   ├── routes/         # Routers de Express
│   │   ├── middlewares/    # auth (usuario actual), manejo de errores, validación
│   │   ├── errors/         # Jerarquía de errores de la aplicación
│   │   ├── seed/           # Datos iniciales
│   │   ├── app.js          # Construye la app de Express (sin listen, para tests)
│   │   └── server.js       # Punto de entrada: seed + listen
│   ├── requests/           # api.http: un ejemplo por endpoint
│   └── test/
│       ├── unit/           # Dominio y servicios
│       └── api/            # Supertest contra app.js
└── mobile/
    ├── index.html
    ├── vite.config.js      # alias react-native → react-native-web, proxy /api
    └── src/
        ├── api/            # Cliente HTTP y una función por endpoint
        ├── context/        # Usuario actual
        ├── navigation/
        ├── screens/
        ├── components/
        └── utils/          # Formato de fechas, moneda, colores por estado
```

### Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Lenguaje | JavaScript con ES Modules (`"type": "module"`) | Es lo que pide la cátedra (Node); no se agrega un paso de compilación |
| Tests back-end | Jest + Supertest | Unitarios para el dominio, de integración para la API |
| Front-end | React Native + `react-native-web`, empaquetado con Vite | Se escribe en React Native (`View`, `Text`, `FlatList`…) y corre en el navegador sin herramientas nativas ni Expo |
| Responsive | Diseño mobile-first; en pantallas anchas el contenido se centra con un ancho máximo | El uso principal es desde el celular, pero también se puede abrir en la PC |
| Navegación | React Navigation (bottom tabs + native stack) con `linking` | Funciona en web y le da a cada pantalla su URL (sirve el botón "atrás" del navegador) |
| IDs | `crypto.randomUUID()` | Nativo de Node, no hace falta generar IDs en el cliente |
| Fechas | ISO 8601 en la API; zona `America/Argentina/Buenos_Aires` para calcular días | Evita discrepancias entre servidor y dispositivo |
| Autenticación | Simulada: header `X-User-Id` con un usuario del seed | El enunciado no pide autenticación; alcanza con identificar al usuario actual |
| Chat | Polling cada 5 s mientras la pantalla del chat está abierta y la pestaña visible | Alcanza para "en cualquier momento" sin sumar WebSockets |
| Origen de la API | El front-end llama a `/api` relativo; Vite lo reenvía (proxy) al back-end | Un solo origen: no hay problemas de CORS y el celular solo necesita conocer una URL |
| Concurrencia de cupo | La verificación y el descuento de cupo ocurren de forma sincrónica (sin `await` entre medio) | Node es single-thread, así que la operación queda atómica sobre el repositorio en memoria |

### Acceder desde el celular

1. Levantar el back-end (`npm run dev` en `backend/`, puerto 3000).
2. Levantar el front-end (`npm run dev` en `mobile/`). Vite escucha en todas las interfaces (`server.host: true`) e imprime la URL de red.
3. Con el celular en la misma Wi-Fi, abrir `http://<IP-LAN-de-la-PC>:5173`.

El celular solo habla con Vite, que reenvía `/api/*` a `http://localhost:3000`. Si no carga, revisar que el firewall de la PC permita el puerto 5173 (en Fedora: `sudo firewall-cmd --add-port=5173/tcp`). El back-end habilita CORS de todas formas, por si se le pega directo (Postman, tests).
