import { crearApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

crearApp().listen(PORT, HOST, () => {
  console.log(`AI Ticket It API escuchando en http://localhost:${PORT}/api`);
});
