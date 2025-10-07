import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: "Walleet - Gestore Spese",
        short_name: "Walleet",
        description: "App per tracciare le spese, funziona offline",
        start_url: "/",
        display: "standalone",
        background_color: "#f1f5f9",
        theme_color: "#4f46e5",
        icons: [
          { src: "assets/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "assets/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      // Disabilita Workbox su Termux per evitare crash
      workbox: false
    })
  ],
  build: {
    chunkSizeWarningLimit: 2000
  }
});

