<script setup>
const reportes = [
  { titulo: 'Reporte de ventas', desc: 'Análisis mensual de ingresos y facturación', boton: 'Descargar PDF', icono: '📊' },
  { titulo: 'Reporte de envíos', desc: 'Resumen de logística, entregas y tiempos de tránsito', boton: 'Generar Excel', icono: '📦' },
  { titulo: 'Reporte de clientes', desc: 'Crecimiento de base de datos y actividad de usuarios', boton: 'Generar informe', icono: '👥' },
]
const recientes = [
  { id: 'R-102', fecha: '05/03/2026', tipo: 'Ventas mensual', estado: 'Listo' },
  { id: 'R-101', fecha: '04/03/2026', tipo: 'Envíos por destino', estado: 'Listo' },
  { id: 'R-100', fecha: '03/03/2026', tipo: 'Clientes nuevos', estado: 'Listo' },
]
</script>

<template>
  <main class="main">
    <header class="main-header">
      <h1 class="main-title">Reportes</h1>
      <p class="main-subtitle">Gestiona y descarga informes detallados de operación</p>
    </header>
    <div class="main-content">
      <div class="filters-bar">
        <span class="filters-label">Filtros de reporte</span>
        <div class="filters-row">
          <label>Desde <input type="date" class="form-date" value="2026-02-01" /></label>
          <label>Hasta <input type="date" class="form-date" value="2026-03-05" /></label>
          <button type="button" class="btn-primary">Aplicar filtros</button>
        </div>
      </div>
      <div class="report-cards">
        <div v-for="r in reportes" :key="r.titulo" class="report-card">
          <span class="report-icon">{{ r.icono }}</span>
          <h3 class="report-title">{{ r.titulo }}</h3>
          <p class="report-desc">{{ r.desc }}</p>
          <button type="button" class="btn-primary btn-block">{{ r.boton }}</button>
        </div>
      </div>
      <div class="panel">
        <h2 class="panel-title">Vista previa reciente</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Tipo de reporte</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rev in recientes" :key="rev.id">
              <td><strong>{{ rev.id }}</strong></td>
              <td>{{ rev.fecha }}</td>
              <td>{{ rev.tipo }}</td>
              <td><span class="badge badge-success">{{ rev.estado }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<style scoped>
.main { flex: 1; background: var(--layout-bg); min-height: 100vh; display: flex; flex-direction: column; }
.main-header { background: var(--card-bg); padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-color); }
.main-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
.main-subtitle { margin: 0.25rem 0 0; font-size: 0.9rem; color: var(--text-secondary); }
.main-content { padding: 2rem; flex: 1; }
.filters-bar { background: var(--card-bg); border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08); }
.filters-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem; }
.filters-row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
.form-date { padding: 0.5rem; border: 2px solid var(--border-color); border-radius: 8px; margin-left: 0.35rem; color: var(--text-primary); }
.btn-primary { padding: 0.65rem 1.25rem; font-weight: 600; color: var(--latitude-white); background: var(--latitude-orange); border: none; border-radius: 8px; cursor: pointer; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-block { width: 100%; }
.report-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
.report-card { background: var(--card-bg); border-radius: 14px; padding: 1.5rem; box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08); border-left: 4px solid var(--latitude-orange); }
.report-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
.report-title { margin: 0 0 0.35rem; font-size: 1.05rem; font-weight: 700; color: var(--text-primary); }
.report-desc { margin: 0 0 1rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; }
.panel { background: var(--card-bg); border-radius: 14px; padding: 1.5rem; box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08); }
.panel-title { margin: 0 0 1rem; font-size: 1.05rem; font-weight: 700; color: var(--text-primary); }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.data-table th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color); background: rgba(40, 74, 129, 0.04); }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
.badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
.badge-success { background: rgba(34, 197, 94, 0.15); color: #15803d; }
@media (max-width: 900px) { .report-cards { grid-template-columns: 1fr; } }
</style>
