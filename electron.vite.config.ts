import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  main: {
    //  v5中默认开启了外部依赖自动外置化，如果需要在主进程中使用某些依赖（如 puppeteer），需要手动取消外置化：
    // plugins: [externalizeDepsPlugin()]
    build: {
      externalizeDeps: {}
    }
  },
  preload: {
    // plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: resolve('src/renderer'),
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [vue()]
  }
})
