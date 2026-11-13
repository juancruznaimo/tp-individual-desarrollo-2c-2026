# AI Ticket It

Plataforma de publicación de eventos y venta de entradas. Trabajo Práctico Individual de DDSO.

- **`backend/`**: API REST en Node.js + Express, con persistencia en memoria.
- **`mobile/`**: front-end en React Native, que corre en el navegador con `react-native-web` (empaquetado con Vite). Es responsive para usarlo desde el celular.
- **`specs/`**: especificación funcional y técnica, y plan por etapas. Empezar por [specs/README.md](specs/README.md).

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

**Desde el celular** abrí la URL de `Network`. El front-end le pasa las llamadas a `/api` al back-end (proxy de Vite), así que el celular no necesita conocer el puerto 3000.

Si el celular no carga la página, probablemente el firewall esté bloqueando el puerto. En Fedora:

```bash
sudo firewall-cmd --add-port=5173/tcp                 # hasta reiniciar
sudo firewall-cmd --add-port=5173/tcp --permanent     # permanente
```

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

## Datos de ejemplo

Al arrancar, el back-end carga datos de ejemplo en memoria (se pierden al reiniciar). Las fechas son relativas al día en que se levanta, así que siempre hay eventos pasados y futuros.

| Usuario | ID (`X-User-Id`) | Rol en los datos |
|---|---|---|
| Ana Gómez | `usr-ana` | Organiza recitales y festivales (puntaje 4.5) |
| Bruno Díaz | `usr-bruno` | Organiza teatro y stand-up (puntaje 3.5) |
| Carla Pérez | `usr-carla` | Compradora con compras en todos los estados |
| Diego Fernández | `usr-diego` | Comprador; tiene una entrada utilizada sin reseñar |
| Elena Ruiz | `usr-elena` | Compradora y organizadora de una conferencia y una carrera |

## Variables de entorno

| Variable | Módulo | Por defecto | Uso |
|---|---|---|---|
| `PORT` | backend | `3000` | Puerto de la API |
| `HOST` | backend | `0.0.0.0` | Interfaz donde escucha |
| `API_URL` | mobile | `http://localhost:3000` | Destino del proxy `/api` de Vite |

## Estado

| Etapa | Estado |
|---|---|
| E0 — Setup del proyecto | ✅ |
| E1 — Dominio y persistencia en memoria | ✅ |
| E2 — API de eventos | ✅ |
| E3 — API de compras | ⏳ |
| E4 – E8 | Pendientes (ver [specs/04-etapas.md](specs/04-etapas.md)) |
