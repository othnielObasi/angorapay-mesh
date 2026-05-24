import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/angora-app/',
  root: 'src/dashboard/frontend',
  build: {
    outDir: '../public/angora-app',
    emptyOutDir: true,
  },
});
