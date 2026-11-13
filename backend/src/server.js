import { crearApp } from './app.js';
import { relojDelSistema } from './reloj.js';
import { crearRepositorios } from './repositories/index.js';
import { cargarDatosDeEjemplo } from './seed/index.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const repos = crearRepositorios();
const reloj = relojDelSistema;
const resumen = cargarDatosDeEjemplo(repos, reloj.ahora());

crearApp({ repos, reloj }).listen(PORT, HOST, () => {
  console.log(`AI Ticket It API escuchando en http://localhost:${PORT}/api`);
  console.log('Datos de ejemplo cargados:', resumen);
});
