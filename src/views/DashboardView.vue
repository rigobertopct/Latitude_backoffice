<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Swal from 'sweetalert2'
import api from '../api/client'

const loading = ref(true)
const data = ref(null)

const CIRC = 2 * Math.PI * 48

function money(n) {
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n || 0))
}

function badgeClass(st) {
  if (st === 'aprobada') return 'badge-success'
  if (st === 'rechazada') return 'badge-danger'
  return 'badge-warning'
}

function badgeLabel(st) {
  if (st === 'aprobada') return 'Aprobada'
  if (st === 'rechazada') return 'Rechazada'
  return 'Pendiente'
}

const ventasMeses = computed(() => data.value?.ventas_meses?.values || [0, 0, 0, 0, 0, 0])
const mesesLabels = computed(() => data.value?.ventas_meses?.labels || ['', '', '', '', '', ''])
const chartMax = computed(() => Math.max(...ventasMeses.value, 1))

const trendPct = computed(() => Number(data.value?.ventas_trend_pct || 0))
const trendUp = computed(() => trendPct.value >= 0)

const donut = computed(() => {
  const p = data.value?.por_estado || {}
  const a = Number(p.pct_aprobada || 0)
  const pe = Number(p.pct_pendiente || 0)
  const r = Number(p.pct_rechazada || 0)
  const lenA = (a / 100) * CIRC
  const lenP = (pe / 100) * CIRC
  const lenR = (r / 100) * CIRC
  return {
    a,
    pe,
    r,
    dashA: `${lenA} ${CIRC - lenA}`,
    dashP: `${lenP} ${CIRC - lenP}`,
    dashR: `${lenR} ${CIRC - lenR}`,
    offA: 0,
    offP: -lenA,
    offR: -(lenA + lenP),
  }
})

const recientes = computed(() => data.value?.recientes || [])

async function load() {
  loading.value = true
  try {
    data.value = await api.get('/api/cotizaciones-admin/dashboard')
  } catch (e) {
    data.value = null
    await Swal.fire({
      icon: 'error',
      title: 'Dashboard',
      text: e.message || 'No se pudieron cargar las métricas',
    })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="main">
    <header class="main-header">
      <div>
        <h1 class="main-title">Panel de control</h1>
        <p class="main-subtitle">Resumen de cotizaciones, clientes e ingresos (datos reales)</p>
      </div>
      <button type="button" class="btn-refresh" :disabled="loading" @click="load">
        {{ loading ? 'Cargando…' : 'Actualizar' }}
      </button>
    </header>

    <div class="main-content">
      <section class="quick-actions">
        <h2 class="quick-actions-title">Acciones rápidas</h2>
        <div class="quick-actions-grid">
          <RouterLink :to="{ name: 'clientes', query: { nuevo: '1' } }" class="action-card">
            <span class="action-icon">👤</span>
            <span class="action-label">Nuevo cliente</span>
            <span class="action-desc">Alta manual en la base de clientes</span>
          </RouterLink>
          <RouterLink :to="{ name: 'cotizaciones', query: { nueva: '1' } }" class="action-card action-card-highlight">
            <span class="action-icon">📋</span>
            <span class="action-label">Nueva cotización</span>
            <span class="action-desc">Crear solicitud desde administración</span>
          </RouterLink>
          <RouterLink :to="{ name: 'catalogo-cotizaciones' }" class="action-card">
            <span class="action-icon">📦</span>
            <span class="action-label">Catálogo cotizar</span>
            <span class="action-desc">Productos, rutas y servicios</span>
          </RouterLink>
          <RouterLink :to="{ name: 'cotizaciones' }" class="action-card">
            <span class="action-icon">📑</span>
            <span class="action-label">Cotizaciones</span>
            <span class="action-desc">Listado y estados</span>
          </RouterLink>
        </div>
      </section>

      <div v-if="loading && !data" class="loading-block">Cargando métricas…</div>

      <template v-else-if="data">
        <div class="stats-cards">
          <div class="stat-card stat-card-highlight">
            <div class="stat-card-header">
              <span class="stat-label">Ventas del mes</span>
              <span class="stat-trend" :class="{ down: !trendUp }">
                {{ trendUp ? '↑' : '↓' }} {{ Math.abs(trendPct) }}%
              </span>
            </div>
            <span class="stat-value">{{ money(data.ventas_mes) }}</span>
            <span class="stat-sublabel">aprobadas vs mes anterior</span>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-label">Cotizaciones</span>
              <span class="stat-icon">📦</span>
            </div>
            <span class="stat-value">{{ data.cotizaciones_mes }}</span>
            <span class="stat-sublabel">este mes</span>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-label">Clientes nuevos</span>
              <span class="stat-icon">👤</span>
            </div>
            <span class="stat-value">{{ data.clientes_nuevos_30d }}</span>
            <span class="stat-sublabel">últimos 30 días · {{ data.clientes_totales }} total</span>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-label">Ingresos totales</span>
              <span class="stat-icon">💰</span>
            </div>
            <span class="stat-value">{{ money(data.ingresos_totales) }}</span>
            <span class="stat-sublabel">cotizaciones aprobadas</span>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card chart-card-bar">
            <h2 class="chart-title">Ventas aprobadas — últimos 6 meses</h2>
            <div class="bar-chart-wrap">
              <svg class="bar-chart" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stop-color="var(--latitude-orange)" stop-opacity="0.9" />
                    <stop offset="100%" stop-color="var(--latitude-orange)" stop-opacity="1" />
                  </linearGradient>
                </defs>
                <line
                  v-for="i in 5"
                  :key="'h' + i"
                  :y1="40 + (i - 1) * 36"
                  :y2="40 + (i - 1) * 36"
                  x1="40"
                  x2="380"
                  stroke="var(--latitude-blue-gray)"
                  stroke-opacity="0.3"
                  stroke-dasharray="4 4"
                />
                <rect
                  v-for="(val, i) in ventasMeses"
                  :key="i"
                  :x="52 + i * 56"
                  :y="196 - (val / chartMax) * 156"
                  width="32"
                  :height="Math.max((val / chartMax) * 156, 0)"
                  rx="4"
                  fill="url(#barGrad)"
                />
                <text
                  v-for="(label, i) in mesesLabels"
                  :key="'l' + i"
                  :x="68 + i * 56"
                  y="212"
                  text-anchor="middle"
                  font-size="11"
                  fill="var(--latitude-deep-blue)"
                  font-weight="600"
                >
                  {{ label }}
                </text>
              </svg>
            </div>
          </div>
          <div class="chart-card chart-card-donut">
            <h2 class="chart-title">Cotizaciones por estado</h2>
            <div class="donut-wrap">
              <svg class="donut-chart" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--latitude-blue-gray)" stroke-width="14" stroke-opacity="0.25" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="var(--latitude-orange)"
                  stroke-width="14"
                  :stroke-dasharray="donut.dashA"
                  :stroke-dashoffset="donut.offA"
                  stroke-linecap="butt"
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="var(--latitude-deep-blue)"
                  stroke-width="14"
                  :stroke-dasharray="donut.dashP"
                  :stroke-dashoffset="donut.offP"
                  stroke-linecap="butt"
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#b91c1c"
                  stroke-width="14"
                  :stroke-dasharray="donut.dashR"
                  :stroke-dashoffset="donut.offR"
                  stroke-linecap="butt"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="donut-legend">
                <div class="donut-legend-item">
                  <span class="dot dot-orange"></span> Aprobada {{ donut.a }}%
                </div>
                <div class="donut-legend-item">
                  <span class="dot dot-blue"></span> Pendiente {{ donut.pe }}%
                </div>
                <div class="donut-legend-item">
                  <span class="dot dot-gray"></span> Rechazada {{ donut.r }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel panel-table">
          <h2 class="panel-title">Últimas cotizaciones</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Cliente</th>
                  <th>Destino</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in recientes" :key="row.id">
                  <td>
                    <RouterLink :to="{ name: 'cotizaciones' }" class="link-num">
                      <strong>{{ row.public_number }}</strong>
                    </RouterLink>
                  </td>
                  <td>{{ row.cliente }}</td>
                  <td>{{ row.destino }}</td>
                  <td>
                    <span class="badge" :class="badgeClass(row.status)">{{ badgeLabel(row.status) }}</span>
                  </td>
                  <td>{{ money(row.total) }}</td>
                  <td>{{ row.fecha }}</td>
                </tr>
                <tr v-if="!recientes.length">
                  <td colspan="6" class="empty">Aún no hay cotizaciones en la base de datos.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.main {
  flex: 1;
  background: var(--layout-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-header {
  background: var(--card-bg);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.main-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.main-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.btn-refresh {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main-content {
  padding: 2rem;
  flex: 1;
}

.loading-block {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions-title {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.25rem;
  background: var(--card-bg);
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  border-left: 4px solid var(--latitude-blue-gray);
  box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(40, 74, 129, 0.12);
}

.action-card-highlight {
  border-left-color: var(--latitude-orange);
}

.action-icon {
  font-size: 1.5rem;
}

.action-label {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}

.action-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .quick-actions-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 1.35rem;
  box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08);
  border-left: 4px solid var(--latitude-blue-gray);
}

.stat-card-highlight {
  border-left-color: var(--latitude-orange);
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(255, 153, 51, 0.06) 100%);
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-trend {
  font-size: 0.8rem;
  font-weight: 700;
  color: #22c55e;
}

.stat-trend.down {
  color: #b91c1c;
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.stat-sublabel {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08);
}

.chart-title {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.bar-chart-wrap {
  width: 100%;
  min-height: 220px;
}

.bar-chart {
  width: 100%;
  height: auto;
}

.donut-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.donut-chart {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

.donut-legend {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.5rem;
}

.donut-legend-item {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-orange {
  background: var(--latitude-orange);
}
.dot-blue {
  background: var(--latitude-deep-blue);
}
.dot-gray {
  background: #b91c1c;
}

.panel-table {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08);
}

.panel-title {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  background: rgba(40, 74, 129, 0.04);
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.data-table tbody tr:hover {
  background: rgba(255, 153, 51, 0.06);
}

.link-num {
  color: inherit;
  text-decoration: none;
}

.link-num:hover {
  color: var(--latitude-orange);
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem !important;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.badge-warning {
  background: rgba(255, 153, 51, 0.2);
  color: var(--latitude-orange);
}

.badge-danger {
  background: rgba(185, 28, 28, 0.12);
  color: #b91c1c;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-cards,
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  .donut-legend {
    flex-direction: column;
    align-items: center;
  }
}
</style>
