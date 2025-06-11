import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    open: true,
    port: 5173,
    cors: true,
    proxy: {
      '/h3-js': {
        target: 'https://unpkg.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/h3-js/, '/h3-js@4.2.1/dist/h3-js.es.js')
      },
      '/s2js': {
        target: 'https://esm.sh',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s2js/, '/s2js@1.43.6')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      'vgrid-maplibre': resolve(__dirname, '../'),
      'h3-js': '/h3-js',
      's2js': '/s2js'
    }
  }
}); 