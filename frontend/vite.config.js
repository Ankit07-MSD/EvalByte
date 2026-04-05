import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: set VITE_BASE=/your-repo-name/ (leading + trailing slash)
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
