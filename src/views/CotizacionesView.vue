<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Swal from 'sweetalert2'
import api from '../api/client'

const loading = ref(false)
const items = ref([])
const statusFilter = ref('')
const search = ref('')
const detailOpen = ref(false)
const selected = ref(null)

const filtered = computed(() => {
  let list = items.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (x) =>
        (x.public_number || '').toLowerCase().includes(q) ||
        (x.client_email || '').toLowerCase().includes(q) ||
        (x.client_name || '').toLowerCase().includes(q)
    )
  }
  return list
})

function money(n) {
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

function fmtDate(d) {
  if (!d) return '—'
  const x = typeof d === 'string' ? d.slice(0, 10) : d
  return x
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

async function load() {
  loading.value = true
  try {
    const q = statusFilter.value ? `?status=${encodeURIComponent(statusFilter.value)}` : ''
    items.value = await api.get(`/api/cotizaciones-admin/solicitudes${q}`)
  } catch (e) {
    items.value = []
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'No se pudieron cargar las cotizaciones' })
  } finally {
    loading.value = false
  }
}

async function openDetail(id) {
  try {
    selected.value = await api.get(`/api/cotizaciones-admin/solicitudes/${id}`)
    detailOpen.value = true
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message })
  }
}

function closeDetail() {
  detailOpen.value = false
  selected.value = null
}

async function setStatus(st) {
  if (!selected.value) return
  try {
    await api.patch(`/api/cotizaciones-admin/solicitudes/${selected.value.id}/estado`, { status: st })
    await load()
    selected.value = await api.get(`/api/cotizaciones-admin/solicitudes/${selected.value.id}`)
    await Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1500, showConfirmButton: false })
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message })
  }
}

watch(statusFilter, () => load())
onMounted(load)
</script>

<template>
  <main class="main mdc-page">
    <header class="main-header">
      <div class="header-row">
        <div>
          <h1 class="main-title">Cotizaciones del portal</h1>
          <p class="main-subtitle">Solicitudes con productos, servicios extra, origen y destino</p>
        </div>
        <RouterLink to="/admin/catalogo-cotizaciones" class="btn-tonal">Gestionar catálogo</RouterLink>
      </div>
    </header>
    <div class="main-content">
      <div class="toolbar mdc-elevated">
        <input v-model="search" type="search" class="field-input" placeholder="Buscar por número, correo o nombre…" />
        <select v-model="statusFilter" class="field-input narrow">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <button type="button" class="btn-icon-text" :disabled="loading" @click="load">Actualizar</button>
      </div>

      <div v-if="loading" class="loading">Cargando…</div>
      <div v-else class="panel mdc-elevated">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Origen → Destino</th>
              <th>Fecha servicio</th>
              <th>Estado</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filtered" :key="c.id">
              <td><strong>{{ c.public_number }}</strong></td>
              <td>
                {{ c.client_name || '—' }}<br />
                <span class="muted">{{ c.client_email }}</span>
              </td>
              <td>{{ c.origin_name || '—' }} → {{ c.destination_name || '—' }}</td>
              <td>{{ fmtDate(c.quote_date_requested) }}</td>
              <td><span class="badge" :class="badgeClass(c.status)">{{ badgeLabel(c.status) }}</span></td>
              <td>{{ money(c.total) }}</td>
              <td>
                <button type="button" class="btn-text" @click="openDetail(c.id)">Ver detalle</button>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="7" class="empty">No hay cotizaciones. Configure el catálogo y espere solicitudes desde el sitio web.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="detailOpen && selected" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal-sheet mdc-elevated">
        <div class="sheet-head">
          <h2>{{ selected.public_number }}</h2>
          <button type="button" class="icon-close" aria-label="Cerrar" @click="closeDetail">×</button>
        </div>
        <div class="sheet-body">
          <section class="block">
            <h3>Cliente</h3>
            <p>{{ selected.client_name || '—' }}</p>
            <p class="muted">{{ selected.client_email }}</p>
            <p v-if="selected.client_phone" class="muted">{{ selected.client_phone }}</p>
          </section>
          <section class="block">
            <h3>Envío</h3>
            <p><strong>Origen:</strong> {{ selected.origin_name }}</p>
            <p><strong>Destino (ruta):</strong> {{ selected.destination_name }}</p>
            <p><strong>Dirección de entrega:</strong></p>
            <p class="address">{{ selected.delivery_address }}</p>
            <p><strong>Fecha solicitada:</strong> {{ fmtDate(selected.quote_date_requested) }}</p>
          </section>
          <section class="block">
            <h3>Desglose</h3>
            <table class="lines">
              <tbody>
                <tr v-for="ln in selected.lines" :key="ln.id">
                  <td>
                    <span class="kind">{{ ln.line_kind === 'product' ? 'Producto' : 'Servicio' }}</span>
                    {{ ln.label }}
                  </td>
                  <td class="num">{{ Number(ln.quantity) }} × {{ money(ln.unit_price) }}</td>
                  <td class="num strong">{{ money(ln.line_total) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="totals">
              <div><span>Subtotal productos</span><span>{{ money(selected.subtotal_products) }}</span></div>
              <div><span>Servicios extra</span><span>{{ money(selected.subtotal_services) }}</span></div>
              <div class="grand"><span>Total</span><span>{{ money(selected.total) }}</span></div>
            </div>
          </section>
          <div class="status-actions">
            <span class="muted">Cambiar estado:</span>
            <button type="button" class="btn-small" :disabled="selected.status === 'pendiente'" @click="setStatus('pendiente')">Pendiente</button>
            <button type="button" class="btn-small success" :disabled="selected.status === 'aprobada'" @click="setStatus('aprobada')">Aprobar</button>
            <button type="button" class="btn-small danger" :disabled="selected.status === 'rechazada'" @click="setStatus('rechazada')">Rechazar</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.main { flex: 1; background: var(--layout-bg); min-height: 100vh; display: flex; flex-direction: column; }
.mdc-page { font-family: 'Roboto', system-ui, sans-serif; }
.main-header {
  background: var(--card-bg);
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}
.header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.main-title { margin: 0; font-size: 1.35rem; font-weight: 500; color: var(--text-primary); }
.main-subtitle { margin: 0.35rem 0 0; font-size: 0.875rem; color: var(--text-secondary); }
.btn-tonal {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  color: var(--latitude-deep-blue);
  background: rgba(40, 74, 129, 0.1);
  border-radius: 20px;
  text-decoration: none;
}
.btn-tonal:hover { background: rgba(255, 153, 51, 0.2); color: var(--latitude-orange); }
.main-content { padding: 1.5rem; flex: 1; }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  background: var(--card-bg);
  border-radius: 12px;
}
.mdc-elevated { box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06); }
.field-input {
  flex: 1;
  min-width: 200px;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.875rem;
  background: var(--card-bg);
  color: var(--text-primary);
}
.field-input.narrow { flex: 0 0 180px; min-width: 140px; }
.field-input:focus { outline: none; border-color: var(--latitude-orange); }
.btn-icon-text {
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--card-bg);
  cursor: pointer;
  color: var(--text-primary);
}
.loading { padding: 2rem; text-align: center; color: var(--text-secondary); }
.panel { background: var(--card-bg); border-radius: 12px; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); vertical-align: top; }
.muted { font-size: 0.8125rem; color: var(--text-secondary); }
.empty { text-align: center; color: var(--text-secondary); padding: 2rem !important; }
.badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 8px; font-size: 0.75rem; font-weight: 500; }
.badge-success { background: rgba(34, 197, 94, 0.15); color: #15803d; }
.badge-warning { background: rgba(255, 153, 51, 0.2); color: var(--latitude-orange); }
.badge-danger { background: rgba(185, 28, 28, 0.12); color: #b91c1c; }
.btn-text {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--latitude-deep-blue);
  cursor: pointer;
}
.btn-text:hover { color: var(--latitude-orange); }
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}
@media (min-width: 720px) {
  .modal-backdrop { align-items: center; padding: 1rem; }
}
.modal-sheet {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--card-bg);
  border-radius: 16px 16px 0 0;
}
@media (min-width: 720px) {
  .modal-sheet { border-radius: 16px; }
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--card-bg);
}
.sheet-head h2 { margin: 0; font-size: 1.125rem; font-weight: 500; }
.icon-close {
  border: none;
  background: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-secondary);
}
.sheet-body { padding: 1rem 1.25rem 1.5rem; }
.block { margin-bottom: 1.25rem; }
.block h3 { margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.block p { margin: 0.25rem 0; font-size: 0.9375rem; }
.address { white-space: pre-wrap; font-size: 0.875rem; }
.lines { width: 100%; font-size: 0.875rem; margin-top: 0.5rem; }
.lines td { padding: 0.35rem 0; border: none; }
.lines .kind { font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); margin-right: 0.35rem; }
.lines .num { text-align: right; white-space: nowrap; }
.lines .strong { font-weight: 600; }
.totals { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); font-size: 0.875rem; }
.totals > div { display: flex; justify-content: space-between; margin: 0.35rem 0; }
.totals .grand { font-weight: 600; font-size: 1rem; margin-top: 0.5rem; }
.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
.btn-small {
  padding: 0.4rem 0.85rem;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--card-bg);
  cursor: pointer;
}
.btn-small:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-small.success { border-color: #15803d; color: #15803d; }
.btn-small.danger { border-color: #b91c1c; color: #b91c1c; }
</style>
