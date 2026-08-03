<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import Swal from 'sweetalert2'
import api from '../api/client'

const REPORT_DEFS = [
  {
    id: 'ventas',
    titulo: 'Reporte de ventas',
    desc: 'Cotizaciones aprobadas e ingresos del período',
    icono: '📊',
  },
  {
    id: 'cotizaciones',
    titulo: 'Reporte de cotizaciones',
    desc: 'Todas las solicitudes: origen, destino y estado',
    icono: '📦',
  },
  {
    id: 'clientes',
    titulo: 'Reporte de clientes',
    desc: 'Altas de clientes en el período seleccionado',
    icono: '👥',
  },
]

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthStartIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const desde = ref(monthStartIso())
const hasta = ref(todayIso())
const loading = ref(false)
const preview = ref(null)
const previewRef = ref(null)

function money(n) {
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))
}

function formatCell(col, row) {
  const v = row[col.key]
  if (col.key === 'total' && typeof v === 'number') return money(v)
  return v == null || v === '' ? '—' : String(v)
}

const periodLabel = computed(() => {
  if (!preview.value) return ''
  const a = preview.value.desde || 'inicio'
  const b = preview.value.hasta || 'hoy'
  return `${a} → ${b}`
})

async function loadReport(tipo) {
  if (desde.value && hasta.value && desde.value > hasta.value) {
    await Swal.fire({
      icon: 'warning',
      title: 'Fechas',
      text: 'La fecha «Desde» no puede ser posterior a «Hasta».',
    })
    return
  }
  loading.value = true
  preview.value = null
  try {
    const q = new URLSearchParams()
    if (desde.value) q.set('desde', desde.value)
    if (hasta.value) q.set('hasta', hasta.value)
    const path = `/api/cotizaciones-admin/reportes/${tipo}?${q}`
    preview.value = await api.get(path)
    await nextTick()
    previewRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (e) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: e.message || 'No se pudo generar el reporte',
    })
  } finally {
    loading.value = false
  }
}

function csvEscape(val) {
  const s = val == null ? '' : String(val)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function exportExcel() {
  if (!preview.value?.rows) return
  const cols = preview.value.columns
  const lines = []
  lines.push(cols.map((c) => csvEscape(c.label)).join(','))
  for (const row of preview.value.rows) {
    lines.push(cols.map((c) => csvEscape(formatCell(c, row))).join(','))
  }
  const sum = preview.value.summary || {}
  lines.push('')
  lines.push(csvEscape('Resumen'))
  lines.push(`Cantidad,${sum.cantidad ?? preview.value.rows.length}`)
  if (sum.total != null) lines.push(`Total USD,${sum.total}`)
  if (sum.activos != null) lines.push(`Activos,${sum.activos}`)
  if (sum.inactivos != null) lines.push(`Inactivos,${sum.inactivos}`)

  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${preview.value.tipo}_${desde.value || 'inicio'}_${hasta.value || 'hoy'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function buildPrintHtml() {
  const p = preview.value
  if (!p) return ''
  const cols = p.columns
  const head = cols.map((c) => `<th>${c.label}</th>`).join('')
  const body = p.rows
    .map(
      (row) =>
        `<tr>${cols.map((c) => `<td>${escapeHtml(formatCell(c, row))}</td>`).join('')}</tr>`
    )
    .join('')
  const sum = p.summary || {}
  let resumen = `<p><strong>Registros:</strong> ${sum.cantidad ?? p.rows.length}</p>`
  if (sum.total != null) resumen += `<p><strong>Total:</strong> ${money(sum.total)}</p>`
  if (sum.activos != null) {
    resumen += `<p><strong>Activos:</strong> ${sum.activos} · <strong>Inactivos:</strong> ${sum.inactivos ?? 0}</p>`
  }
  if (sum.por_estado) {
    resumen += `<p><strong>Por estado:</strong> ${Object.entries(sum.por_estado)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ')}</p>`
  }
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(p.titulo)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 24px; }
    h1 { font-size: 1.35rem; margin: 0 0 0.25rem; }
    .meta { color: #555; margin-bottom: 1.25rem; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { border: 1px solid #ccc; padding: 0.45rem 0.6rem; text-align: left; }
    th { background: #f0f2f5; }
    .summary { margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid #ddd; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(p.titulo)}</h1>
  <p class="meta">${escapeHtml(p.descripcion || '')}<br/>Período: ${escapeHtml(periodLabel.value)}</p>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body || '<tr><td colspan="' + cols.length + '">Sin datos</td></tr>'}</tbody>
  </table>
  <div class="summary">${resumen}</div>
  <script>window.onload = function () { window.focus(); window.print(); }<\/script>
</body>
</html>`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function exportPdfOrPrint() {
  if (!preview.value) return
  const w = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720')
  if (!w) {
    Swal.fire({
      icon: 'warning',
      title: 'Ventana bloqueada',
      text: 'Permite ventanas emergentes para imprimir o guardar como PDF.',
    })
    return
  }
  w.document.open()
  w.document.write(buildPrintHtml())
  w.document.close()
}

onMounted(() => {
  // fechas por defecto ya cargadas
})
</script>

<template>
  <main class="main">
    <header class="main-header">
      <h1 class="main-title">Reportes</h1>
      <p class="main-subtitle">Genera una vista previa con datos reales y exporta a Excel, PDF o imprime</p>
    </header>
    <div class="main-content">
      <div class="filters-bar">
        <span class="filters-label">Período del reporte</span>
        <div class="filters-row">
          <label>
            Desde
            <input v-model="desde" type="date" class="form-date" />
          </label>
          <label>
            Hasta
            <input v-model="hasta" type="date" class="form-date" />
          </label>
        </div>
        <p class="filters-hint">Elige el rango y luego pulsa «Ver vista previa» en el reporte deseado.</p>
      </div>

      <div class="report-cards">
        <div v-for="r in REPORT_DEFS" :key="r.id" class="report-card">
          <span class="report-icon">{{ r.icono }}</span>
          <h3 class="report-title">{{ r.titulo }}</h3>
          <p class="report-desc">{{ r.desc }}</p>
          <button
            type="button"
            class="btn-primary btn-block"
            :disabled="loading"
            @click="loadReport(r.id)"
          >
            {{ loading ? 'Cargando…' : 'Ver vista previa' }}
          </button>
        </div>
      </div>

      <div v-if="preview" ref="previewRef" class="panel preview-panel">
        <div class="preview-head">
          <div>
            <h2 class="panel-title">{{ preview.titulo }}</h2>
            <p class="preview-meta">{{ preview.descripcion }}</p>
            <p class="preview-meta"><strong>Período:</strong> {{ periodLabel }}</p>
          </div>
          <div class="export-actions">
            <button type="button" class="btn-secondary" @click="exportExcel">Exportar Excel (CSV)</button>
            <button type="button" class="btn-secondary" @click="exportPdfOrPrint">PDF / Imprimir</button>
          </div>
        </div>

        <div class="summary-chips">
          <span class="chip">Registros: <strong>{{ preview.summary?.cantidad ?? preview.rows?.length ?? 0 }}</strong></span>
          <span v-if="preview.summary?.total != null" class="chip">
            Total: <strong>{{ money(preview.summary.total) }}</strong>
          </span>
          <span v-if="preview.summary?.activos != null" class="chip">
            Activos: <strong>{{ preview.summary.activos }}</strong>
          </span>
          <span v-if="preview.summary?.clientes_totales_bd != null" class="chip">
            Total en BD: <strong>{{ preview.summary.clientes_totales_bd }}</strong>
          </span>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="col in preview.columns" :key="col.key">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in preview.rows" :key="idx">
                <td v-for="col in preview.columns" :key="col.key">{{ formatCell(col, row) }}</td>
              </tr>
              <tr v-if="!preview.rows?.length">
                <td :colspan="preview.columns.length" class="empty">
                  No hay datos en este período. Ajusta las fechas o genera actividad en el sistema.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="panel empty-hint">
        <p>Selecciona un reporte para ver la vista previa aquí. Luego podrás exportar a Excel o abrir PDF/impresión.</p>
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
.filters-bar {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08);
}
.filters-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}
.filters-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}
.form-date {
  padding: 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  margin-left: 0.35rem;
  color: var(--text-primary);
  background: var(--card-bg);
}
.btn-primary {
  padding: 0.65rem 1.25rem;
  font-weight: 600;
  color: var(--latitude-white);
  background: var(--latitude-orange);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn-primary:hover {
  filter: brightness(1.08);
}
.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.btn-block {
  width: 100%;
}
.btn-secondary {
  padding: 0.55rem 1rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
}
.btn-secondary:hover {
  border-color: var(--latitude-orange);
  color: var(--latitude-orange);
}
.report-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.report-card {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08);
  border-left: 4px solid var(--latitude-orange);
}
.report-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}
.report-title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}
.report-desc {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
.panel {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08);
}
.preview-panel {
  margin-top: 0.5rem;
}
.preview-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.panel-title {
  margin: 0 0 0.35rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}
.preview-meta {
  margin: 0.2rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}
.export-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
}
.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.chip {
  font-size: 0.8125rem;
  background: rgba(40, 74, 129, 0.08);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
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
.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem !important;
}
.empty-hint {
  color: var(--text-secondary);
  text-align: center;
}
@media (max-width: 900px) {
  .report-cards {
    grid-template-columns: 1fr;
  }
}
</style>
