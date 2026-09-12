import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Raise the warning threshold slightly — the single bundle is ~1 MB due to recharts+leaflet
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Split large vendor libraries into separate chunks for better caching
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-charts':   ['recharts'],
          'vendor-maps':     ['leaflet', 'react-leaflet'],
          'vendor-icons':    ['lucide-react'],
        },
      },
    },
  },
});
