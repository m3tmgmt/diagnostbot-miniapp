import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/diagnostbot-miniapp/',
  build: {
    outDir: 'dist',
  },
});
