import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './', 
  base: './', // percorso relativo per Android
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    // VitePWA rimosso per evitare schermata bianca
  ],
  build: {
    outDir: 'dist', 
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), 
      },
    },
  },
});
