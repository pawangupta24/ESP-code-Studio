import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@esp-studio/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@esp-studio/protocol': path.resolve(__dirname, '../../packages/protocol/src'),
      '@esp-studio/project-core': path.resolve(__dirname, '../../packages/project-core/src'),
      '@esp-studio/device-core': path.resolve(__dirname, '../../packages/device-core/src'),
      '@esp-studio/serial-core': path.resolve(__dirname, '../../packages/serial-core/src'),
      '@esp-studio/build-core': path.resolve(__dirname, '../../packages/build-core/src'),
      '@esp-studio/flash-core': path.resolve(__dirname, '../../packages/flash-core/src'),
      '@esp-studio/sync-core': path.resolve(__dirname, '../../packages/sync-core/src'),
      '@esp-studio/editor': path.resolve(__dirname, '../../packages/editor/src'),
      '@esp-studio/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
