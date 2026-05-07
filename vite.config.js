import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // 不内联任何资源，字体文件单独输出
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          libs: ['marked', 'html-to-image', 'jszip', 'file-saver']
        }
      }
    }
  },
  // 开发时允许访问 assets/font
  server: {
    fs: {
      allow: ['.']
    }
  }
})
