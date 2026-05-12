<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useThemeStore } from '../stores/theme'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const theme = useThemeStore()
const auth = useAuthStore()

const navItems = [
  { name: 'dashboard', path: '/admin/dashboard', label: 'Dashboard' },
  { name: 'envios', path: '/admin/envios', label: 'Envíos' },
  { name: 'clientes', path: '/admin/clientes', label: 'Clientes' },
  { name: 'reportes', path: '/admin/reportes', label: 'Reportes' },
  { name: 'cotizaciones', path: '/admin/cotizaciones', label: 'Cotizaciones' },
  { name: 'catalogo-cotizaciones', path: '/admin/catalogo-cotizaciones', label: 'Catálogo cotizar' },
]

function isActive(path) {
  return route.path === path
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-main">LATITUDE</span>
        <span class="brand-tag">Admin</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-item"
          :class="{ 'nav-item-active': isActive(item.path) }"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button type="button" class="btn-logout" @click="logout">Cerrar sesión</button>
      </div>
    </aside>
    <div class="main-area">
      <header class="top-bar">
        <span></span>
        <button type="button" class="theme-toggle" :aria-label="theme.isDark ? 'Usar tema claro' : 'Usar tema oscuro'" @click="theme.toggle()">
          <svg v-if="theme.isDark" class="theme-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg v-else class="theme-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </header>
      <router-view :key="route.path" />
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--layout-bg);
}

.top-bar {
  flex-shrink: 0;
  height: 56px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--layout-bg);
  border-bottom: 1px solid var(--border-color);
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: var(--latitude-blue-gray);
  color: var(--latitude-deep-blue);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.theme-toggle:hover {
  background: var(--latitude-orange);
  color: var(--latitude-white);
}

.theme-icon {
  width: 22px;
  height: 22px;
}

.sidebar {
  width: 260px;
  background: var(--latitude-deep-blue);
  color: var(--latitude-white);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-brand {
  padding: 1.5rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-main {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  font-style: italic;
  letter-spacing: 0.02em;
}

.brand-tag {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.85;
  letter-spacing: 0.05em;
  margin-top: 0.15rem;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: block;
  padding: 0.65rem 1.25rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--latitude-white);
}

.nav-item-active {
  background: rgba(255, 153, 51, 0.2);
  color: var(--latitude-orange);
  border-left: 3px solid var(--latitude-orange);
}

.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-logout {
  width: 100%;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--latitude-deep-blue);
  background: var(--latitude-white);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.2s;
}

.btn-logout:hover {
  filter: brightness(0.95);
}
</style>
