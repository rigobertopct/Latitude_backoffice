<script setup>
import { RouterLink } from 'vue-router'

// Datos de ejemplo para gráficos
const ventasMeses = [42, 58, 65, 72, 68, 85]
const mesesLabels = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar']
const ultimosEnvios = [
  { id: 'LT-2847', cliente: 'Importadora Costa', destino: 'Guatemala', estado: 'En tránsito', fecha: '05/03/2026' },
  { id: 'LT-2846', cliente: 'Auto Express', destino: 'Colombia', estado: 'Entregado', fecha: '04/03/2026' },
  { id: 'LT-2845', cliente: 'Carga Sur', destino: 'Honduras', estado: 'En tránsito', fecha: '04/03/2026' },
  { id: 'LT-2844', cliente: 'Logística Caribe', destino: 'Rep. Dom.', estado: 'Entregado', fecha: '03/03/2026' },
]
</script>

<template>
  <main class="main">
      <header class="main-header">
        <div>
          <h1 class="main-title">Panel de control</h1>
          <p class="main-subtitle">Resumen de ventas y actividad</p>
        </div>
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
            <RouterLink :to="{ name: 'reportes' }" class="action-card">
              <span class="action-icon">📋</span>
              <span class="action-label">Reportes</span>
              <span class="action-desc">Ventas, envios y lientes activos</span>
            </RouterLink>
          </div>
        </section>

        <!-- Cards de métricas -->
        <div class="stats-cards">
          <div class="stat-card stat-card-highlight">
            <div class="stat-card-header">
              <span class="stat-label">Ventas del mes</span>
              <span class="stat-trend">↑ 12%</span>
            </div>
            <span class="stat-value">$ 24,580</span>
            <span class="stat-sublabel">vs mes anterior</span>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-label">Envíos totales</span>
              <span class="stat-icon stat-icon-blue">📦</span>
            </div>
            <span class="stat-value">156</span>
            <span class="stat-sublabel">este mes</span>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-label">Clientes nuevos</span>
              <span class="stat-icon stat-icon-orange">👤</span>
            </div>
            <span class="stat-value">23</span>
            <span class="stat-sublabel">últimos 30 días</span>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-label">Ingresos totales</span>
              <span class="stat-icon stat-icon-green">💰</span>
            </div>
            <span class="stat-value">$ 89,200</span>
            <span class="stat-sublabel">acumulado</span>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="charts-row">
          <div class="chart-card chart-card-bar">
            <h2 class="chart-title">Ventas - Últimos 6 meses</h2>
            <div class="bar-chart-wrap">
              <svg class="bar-chart" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stop-color="var(--latitude-orange)" stop-opacity="0.9" />
                    <stop offset="100%" stop-color="var(--latitude-orange)" stop-opacity="1" />
                  </linearGradient>
                </defs>
                <!-- Grid -->
                <line v-for="i in 5" :key="'h' + i" :y1="40 + (i - 1) * 36" :y2="40 + (i - 1) * 36" x1="40" x2="380" stroke="var(--latitude-blue-gray)" stroke-opacity="0.3" stroke-dasharray="4 4" />
                <line v-for="i in 6" :key="'v' + i" :x1="40 + (i - 1) * 56" :x2="40 + (i - 1) * 56" y1="40" y2="196" stroke="var(--latitude-blue-gray)" stroke-opacity="0.2" />
                <!-- Bars -->
                <rect
                  v-for="(val, i) in ventasMeses"
                  :key="i"
                  :x="52 + i * 56"
                  :y="196 - (val / 100) * 156"
                  width="32"
                  :height="(val / 100) * 156"
                  rx="4"
                  fill="url(#barGrad)"
                />
                <!-- Labels -->
                <text v-for="(label, i) in mesesLabels" :key="'l' + i" :x="68 + i * 56" y="212" text-anchor="middle" font-size="11" fill="var(--latitude-deep-blue)" font-weight="600">{{ label }}</text>
              </svg>
            </div>
          </div>
          <div class="chart-card chart-card-donut">
            <h2 class="chart-title">Distribución de carga</h2>
            <div class="donut-wrap">
              <svg class="donut-chart" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--latitude-blue-gray)" stroke-width="14" stroke-opacity="0.3" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--latitude-orange)" stroke-width="14" stroke-dasharray="135 245" stroke-dashoffset="-25" stroke-linecap="round" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--latitude-deep-blue)" stroke-width="14" stroke-dasharray="110 270" stroke-dashoffset="-160" stroke-linecap="round" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--latitude-blue-gray)" stroke-width="14" stroke-dasharray="70 310" stroke-dashoffset="-270" stroke-linecap="round" />
              </svg>
              <div class="donut-legend">
                <div class="donut-legend-item"><span class="dot dot-orange"></span> Terrestre 45%</div>
                <div class="donut-legend-item"><span class="dot dot-blue"></span> Marítimo 35%</div>
                <div class="donut-legend-item"><span class="dot dot-gray"></span> Aéreo 20%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla últimos envíos -->
        <div class="panel panel-table">
          <h2 class="panel-title">Últimos envíos</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Destino</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="envio in ultimosEnvios" :key="envio.id">
                  <td><strong>{{ envio.id }}</strong></td>
                  <td>{{ envio.cliente }}</td>
                  <td>{{ envio.destino }}</td>
                  <td>
                    <span class="badge" :class="envio.estado === 'Entregado' ? 'badge-success' : 'badge-warning'">
                      {{ envio.estado }}
                    </span>
                  </td>
                  <td>{{ envio.fecha }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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

.main-content {
  padding: 2rem;
  flex: 1;
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
  grid-template-columns: repeat(3, 1fr);
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
    grid-template-columns: 1fr;
  }
}

/* Stats cards */
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
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(40, 74, 129, 0.12);
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

.stat-icon {
  font-size: 1.1rem;
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

/* Charts */
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
  transition: box-shadow 0.2s;
}

.chart-card:hover {
  box-shadow: 0 8px 24px rgba(40, 74, 129, 0.1);
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

.dot-orange { background: var(--latitude-orange); }
.dot-blue { background: var(--latitude-deep-blue); }
.dot-gray { background: var(--latitude-blue-gray); }

/* Table */
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

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  .donut-legend {
    flex-direction: column;
    align-items: center;
  }
}
</style>
