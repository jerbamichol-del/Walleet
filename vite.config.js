import { defineConfig } from 'vite';
// import { VitePWA } from 'vite-plugin-pwa'; // disattivato per debug
import path from 'path';

export default defineConfig({
  root: './', // cartella principale del progetto
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // se hai una cartella src
    },
  },
  plugins: [
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: 'Gestore Spese',
    //     short_name: 'Spese',
    //     description: 'App per gestire le spese',
    //     theme_color: '#ffffff',
    //     icons: [
    //       { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    //       { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    //     ]
    //   }
    // }),
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
