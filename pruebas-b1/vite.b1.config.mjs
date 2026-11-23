// Sirve el frontend del proyecto contra el API de PRUEBAS (puerto 3100, base farcorners_test).
// No modifica la configuración de Vite del frontend.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const front = path.resolve(import.meta.dirname, '../frontend');
const { default: react } = await import(
  pathToFileURL(path.join(front, 'node_modules/@vitejs/plugin-react/dist/index.js')).href
);

export default {
  root: front,
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    open: false,
    proxy: { '/api': { target: 'http://127.0.0.1:3100', changeOrigin: true } },
  },
};
