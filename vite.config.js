import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_PROXY_API || env.VITE_API_URL || 'http://127.0.0.1:8000'

  const plugins = [vue()]
  if (mode !== 'production') {
    plugins.push(vueDevTools())
  }

  return {
    base: mode === 'production' ? '/backoffice/' : '/',
    plugins,
    server: {
      proxy: {
        '/api': {
          target: apiTarget.replace(/\/+$/, ''),
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiTarget.replace(/\/+$/, ''),
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
