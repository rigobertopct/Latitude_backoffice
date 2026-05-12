import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setAuthStore, setRouter } from './api/client'

const THEME_KEY = 'latitude-admin-theme'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Inyectar store y router en el cliente API (tras tener pinia montado)
setAuthStore(useAuthStore())
setRouter(router)

app.mount('#app')

// Aplicar tema guardado al cargar
try {
  if (localStorage.getItem(THEME_KEY) === 'dark') {
    document.documentElement.classList.add('theme-dark')
  }
} catch (_) {}
