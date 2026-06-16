import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'electron-vite';

const root = __dirname;

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@': path.resolve(root, './src'),
      },
    },
    build: {
      rollupOptions: {
        input: path.resolve(root, 'electron/main/main.ts'),
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: path.resolve(root, 'electron/preload/preload.ts'),
      },
    },
  },
  renderer: {
    root: path.resolve(root, 'electron/renderer'),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(root, './src'),
      },
    },
    build: {
      outDir: path.resolve(root, 'out/renderer'),
      rollupOptions: {
        input: {
          desktop: path.resolve(root, 'electron/renderer/desktop.html'),
          overlay: path.resolve(root, 'electron/renderer/desktop-overlay.html'),
        },
      },
    },
  },
});
