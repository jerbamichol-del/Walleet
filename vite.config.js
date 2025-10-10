import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: './',                 // IMPORTANTISSIMO per APK & preview fedele
  plugins: [react()],
  build: { outDir: 'www', emptyOutDir: true },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
