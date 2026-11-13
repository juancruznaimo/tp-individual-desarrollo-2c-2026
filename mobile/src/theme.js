export const colores = {
  primario: '#4f46e5',
  primarioSuave: '#eef2ff',
  sobrePrimario: '#ffffff',
  fondo: '#f5f5f7',
  superficie: '#ffffff',
  texto: '#1c1c1e',
  textoSecundario: '#6b6b70',
  exito: '#15803d',
  error: '#b91c1c',
  errorSuave: '#fef2f2',
  advertencia: '#b45309',
  borde: '#e4e4e7',
  estrella: '#f59e0b',
  favorito: '#e11d48',
};

/** Color, fondo y etiqueta de cada estado de compra (ver specs/03-mobile.md → EstadoBadge). */
export const estadosCompra = {
  PENDIENTE: { etiqueta: 'Pendiente de pago', color: '#b45309', fondo: '#fef3c7' },
  CONFIRMADA: { etiqueta: 'Confirmada', color: '#15803d', fondo: '#dcfce7' },
  UTILIZADA: { etiqueta: 'Utilizada', color: '#1d4ed8', fondo: '#dbeafe' },
  CANCELADA: { etiqueta: 'Cancelada', color: '#52525b', fondo: '#f4f4f5' },
  REEMBOLSADA: { etiqueta: 'Reembolsada', color: '#7e22ce', fondo: '#f3e8ff' },
};

export const espaciado = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radios = { sm: 8, md: 12, lg: 16, pill: 999 };

/** Ancho máximo del contenido en pantallas anchas (ver specs/03-mobile.md → Responsive). */
export const ANCHO_MAXIMO = 480;

/** Desde este ancho Explorar pasa a 2 columnas. */
export const BREAKPOINT_ANCHO = 768;
export const ANCHO_MAXIMO_GRILLA = 960;
