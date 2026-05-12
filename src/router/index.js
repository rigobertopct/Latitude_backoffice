import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Iniciar sesión | Latitude Admin', public: true },
    },
    {
      path: '/dashboard',
      redirect: '/admin/dashboard',
    },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      redirect: '/admin/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: 'Dashboard | Latitude Admin' },
        },
        {
          path: 'envios',
          name: 'envios',
          component: () => import('../views/EnviosView.vue'),
          meta: { title: 'Envíos | Latitude Admin' },
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('../views/ClientesView.vue'),
          meta: { title: 'Clientes | Latitude Admin' },
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('../views/ReportesView.vue'),
          meta: { title: 'Reportes | Latitude Admin' },
        },
        {
          path: 'cotizaciones',
          name: 'cotizaciones',
          component: () => import('../views/CotizacionesView.vue'),
          meta: { title: 'Cotizaciones | Latitude Admin' },
        },
        {
          path: 'catalogo-cotizaciones',
          name: 'catalogo-cotizaciones',
          component: () => import('../views/CatalogoCotizacionesView.vue'),
          meta: { title: 'Catálogo cotizaciones | Latitude Admin' },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  const t = auth.token
  const token = (typeof t === 'object' && t !== null && 'value' in t ? t.value : t) || ''
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)

  if (requiresAuth && !token) {
    next({ name: 'login' })
    return
  }
  if (to.name === 'login' && token) {
    next({ path: '/admin/dashboard' })
    return
  }
  next()
})

export default router
