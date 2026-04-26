import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    // 防止 Phaser 依賴的圖片或音效被意外 inline 成 Base64 導致錯誤
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});