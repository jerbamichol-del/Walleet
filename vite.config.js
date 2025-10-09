import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: './',
  base: './', // base relativa per Android e build locali
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0', // necessario per accedere da browser Android
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'www', // allineato a capacitor.config.json (webDir: "www")
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
});
