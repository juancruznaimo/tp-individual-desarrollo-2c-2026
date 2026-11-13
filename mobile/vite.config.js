import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Las variantes `.web.*` tienen prioridad: así un componente puede tener una versión solo para web.
const extensions = ['.web.jsx', '.web.js', '.web.mjs', '.jsx', '.js', '.mjs', '.json'];

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    // Todo `import ... from 'react-native'` (nuestro y de las librerías) usa react-native-web.
    alias: { 'react-native': 'react-native-web' },
    extensions,
  },
  define: {
    // Globales que asumen algunas librerías de React Native.
    global: 'globalThis',
    __DEV__: JSON.stringify(mode !== 'production'),
  },
  optimizeDeps: {
    rolldownOptions: { resolve: { extensions } },
  },
  server: {
    host: true, // escucha en la red local para entrar desde el celular
    port: 5173,
    proxy: {
      '/api': process.env.API_URL || 'http://localhost:3000',
    },
  },
}));
