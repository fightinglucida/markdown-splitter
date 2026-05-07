import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

// 构建后将 themes/*.json 复制到 dist/themes/
const copyThemesPlugin = {
  name: 'copy-themes',
  closeBundle() {
    const src = resolve(__dirname, 'themes')
    const dest = resolve(__dirname, 'dist/themes')
    mkdirSync(dest, { recursive: true })
    readdirSync(src)
      .filter(f => f.endsWith('.json'))
      .forEach(f => copyFileSync(join(src, f), join(dest, f)))
  }
}

export default defineConfig({
  plugins: [vue(), copyThemesPlugin],
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
