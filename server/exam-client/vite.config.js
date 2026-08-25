import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/exam/',
  plugins: [
    react(),
    {
      name: 'redirect-exam-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/exam' || req.url === '') {
            res.writeHead(301, { Location: '/exam/' });
            res.end();
            return;
          }
          if (req.url === '/') {
            res.writeHead(302, { Location: '/exam/' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
