import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    entry: resolve(__dirname, 'src/main/index.ts'),
  },
  preload: {
    input: {
      index: resolve(__dirname, 'src/preload/index.ts'),
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
      },
    },
  },
});
