<script setup>
import { ref, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import api from '../api/client'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'created'])

const loading = ref(false)
const saving = ref(false)
const products = ref([])
const services = ref([])
const origins = ref([])
const destinations = ref([])
const clients = ref([])

const clientMode = ref('registered') // registered | manual
const clientId = ref('')
const clientEmail = ref('')
const clientName = ref('')
const clientPhone = ref('')
const quoteDateRequested = ref('')
const originId = ref('')
const destinationId = ref('')
const deliveryAddress = ref('')
const productQty = ref({})
const selectedServiceIds = ref([])

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function resetForm() {
  clientMode.value = 'registered'
  clientId.value = ''
  clientEmail.value = ''
  clientName.value = ''
  clientPhone.value = ''
  quoteDateRequested.value = todayIso()
  originId.value = ''
  destinationId.value = ''
  deliveryAddress.value = ''
  productQty.value = {}
  selectedServiceIds.value = []
}

function money(n) {
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

const lineItems = computed(() => {
  const rows = []
  for (const p of products.value) {
    const q = Number(productQty.value[p.id] || 0)
    if (q > 0) {
      rows.push({ kind: 'product', label: p.name, qty: q, unit: Number(p.unit_price), total: q * Number(p.unit_price) })
    }
  }
  for (const sid of selectedServiceIds.value) {
    const s = services.value.find((x) => x.id === sid)
    if (s) rows.push({ kind: 'service', label: s.name, qty: 1, unit: Number(s.price), total: Number(s.price) })
  }
  return rows
})

const estimatedTotal = computed(() => lineItems.value.reduce((a, r) => a + r.total, 0))

async function loadCatalog() {
  loading.value = true
  try {
    const [prods, servs, origs, dests, cls] = await Promise.all([
      api.get('/api/cotizaciones-admin/productos'),
      api.get('/api/cotizaciones-admin/servicios'),
      api.get('/api/cotizaciones-admin/origenes'),
      api.get('/api/cotizaciones-admin/destinos'),
      api.get('/api/clientes?limit=200'),
    ])
    products.value = (prods || []).filter((p) => p.active !== false)
    services.value = (servs || []).filter((s) => s.active !== false)
    origins.value = (origs || []).filter((o) => o.active !== false)
    destinations.value = (dests || []).filter((d) => d.active !== false)
    clients.value = cls || []
    if (!quoteDateRequested.value) quoteDateRequested.value = todayIso()
    if (origins.value.length && !originId.value) originId.value = origins.value[0].id
    if (destinations.value.length && !destinationId.value) destinationId.value = destinations.value[0].id
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'No se pudo cargar el catálogo' })
    emit('close')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      resetForm()
      loadCatalog()
    }
  },
)

watch(clientId, (id) => {
  if (!id || clientMode.value !== 'registered') return
  const c = clients.value.find((x) => x.id === id)
  if (!c) return
  clientEmail.value = c.email || ''
  clientName.value = c.nombre_contacto || c.nombre_empresa || ''
  clientPhone.value = c.telefono || ''
})

function toggleService(id) {
  const set = new Set(selectedServiceIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  selectedServiceIds.value = [...set]
}

function setQty(productId, raw) {
  const n = Math.max(0, Number(raw) || 0)
  productQty.value = { ...productQty.value, [productId]: n }
}

async function submit() {
  const items = products.value
    .map((p) => ({ product_id: p.id, quantity: Number(productQty.value[p.id] || 0) }))
    .filter((x) => x.quantity > 0)

  if (clientMode.value === 'registered' && !clientId.value) {
    await Swal.fire({ icon: 'warning', title: 'Cliente', text: 'Seleccione un cliente o use contacto manual.' })
    return
  }
  if (clientMode.value === 'manual' && !clientEmail.value.trim()) {
    await Swal.fire({ icon: 'warning', title: 'Email', text: 'El email del contacto es obligatorio.' })
    return
  }
  if (!originId.value || !destinationId.value || !quoteDateRequested.value) {
    await Swal.fire({ icon: 'warning', title: 'Ruta', text: 'Complete origen, destino y fecha.' })
    return
  }
  if ((deliveryAddress.value || '').trim().length < 5) {
    await Swal.fire({ icon: 'warning', title: 'Dirección', text: 'Indique la dirección de entrega (mín. 5 caracteres).' })
    return
  }
  if (!items.length) {
    await Swal.fire({ icon: 'warning', title: 'Productos', text: 'Agregue al menos un producto con cantidad mayor a 0.' })
    return
  }

  const body = {
    quote_date_requested: quoteDateRequested.value,
    origin_id: originId.value,
    destination_id: destinationId.value,
    delivery_address: deliveryAddress.value.trim(),
    items,
    extra_service_ids: selectedServiceIds.value,
  }
  if (clientMode.value === 'registered') {
    body.client_id = clientId.value
  } else {
    body.client_email = clientEmail.value.trim()
    body.client_name = clientName.value.trim() || null
    body.client_phone = clientPhone.value.trim() || null
  }

  saving.value = true
  try {
    const created = await api.post('/api/cotizaciones-admin/solicitudes', body)
    emit('created', created)
    emit('close')
    await Swal.fire({
      icon: 'success',
      title: 'Cotización creada',
      text: created.public_number ? `Nº ${created.public_number}` : 'Registrada correctamente.',
      timer: 2500,
      showConfirmButton: false,
    })
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'No se pudo crear' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-sheet mdc-elevated">
      <div class="sheet-head">
        <h2>Nueva cotización</h2>
        <button type="button" class="icon-close" aria-label="Cerrar" @click="emit('close')">×</button>
      </div>
      <div v-if="loading" class="sheet-loading">Cargando catálogo…</div>
      <form v-else class="sheet-body" @submit.prevent="submit">
        <section class="block">
          <h3>Cliente</h3>
          <div class="mode-row">
            <label class="radio-wrap">
              <input v-model="clientMode" type="radio" value="registered" />
              Cliente registrado
            </label>
            <label class="radio-wrap">
              <input v-model="clientMode" type="radio" value="manual" />
              Contacto manual
            </label>
          </div>
          <div v-if="clientMode === 'registered'" class="form-group">
            <select v-model="clientId" class="field-input full" required>
              <option value="">— Seleccionar —</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.nombre_empresa }} ({{ c.email }})
              </option>
            </select>
          </div>
          <template v-else>
            <div class="form-group">
              <label class="lbl">Email *</label>
              <input v-model="clientEmail" type="email" class="field-input full" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="lbl">Nombre</label>
                <input v-model="clientName" type="text" class="field-input full" />
              </div>
              <div class="form-group">
                <label class="lbl">Teléfono</label>
                <input v-model="clientPhone" type="text" class="field-input full" />
              </div>
            </div>
          </template>
        </section>

        <section class="block">
          <h3>Ruta y entrega</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="lbl">Origen</label>
              <select v-model="originId" class="field-input full" required>
                <option v-for="o in origins" :key="o.id" :value="o.id">{{ o.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="lbl">Destino</label>
              <select v-model="destinationId" class="field-input full" required>
                <option v-for="d in destinations" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="lbl">Fecha de servicio</label>
            <input v-model="quoteDateRequested" type="date" class="field-input full" required />
          </div>
          <div class="form-group">
            <label class="lbl">Dirección de entrega</label>
            <textarea v-model="deliveryAddress" class="field-input full textarea" rows="3" required />
          </div>
        </section>

        <section class="block">
          <h3>Productos</h3>
          <p v-if="!products.length" class="muted">No hay productos activos. Configúrelos en Catálogo cotizar.</p>
          <table v-else class="pick-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cant.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.id">
                <td>{{ p.name }}</td>
                <td>{{ money(p.unit_price) }}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    class="qty-input"
                    :value="productQty[p.id] || 0"
                    @input="setQty(p.id, $event.target.value)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-if="services.length" class="block">
          <h3>Servicios extra</h3>
          <label v-for="s in services" :key="s.id" class="check-row">
            <input
              type="checkbox"
              :checked="selectedServiceIds.includes(s.id)"
              @change="toggleService(s.id)"
            />
            {{ s.name }} — {{ money(s.price) }}
          </label>
        </section>

        <div v-if="lineItems.length" class="estimate">
          <span>Total estimado</span>
          <strong>{{ money(estimatedTotal) }}</strong>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Creando…' : 'Crear cotización' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-sheet {
  width: 100%;
  max-width: 640px;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);
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
  z-index: 1;
}
.sheet-head h2 { margin: 0; font-size: 1.125rem; font-weight: 500; }
.icon-close {
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}
.sheet-loading { padding: 2rem; text-align: center; color: var(--text-secondary); }
.sheet-body { padding: 1rem 1.25rem 1.5rem; }
.block { margin-bottom: 1.25rem; }
.block h3 {
  margin: 0 0 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.mode-row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.875rem; }
.radio-wrap { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; }
.form-group { margin-bottom: 0.75rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
@media (max-width: 560px) { .form-row { grid-template-columns: 1fr; } }
.lbl { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.35rem; color: var(--text-primary); }
.field-input.full { width: 100%; box-sizing: border-box; }
.field-input {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.875rem;
  background: var(--card-bg);
  color: var(--text-primary);
}
.textarea { resize: vertical; min-height: 4rem; }
.muted { font-size: 0.875rem; color: var(--text-secondary); }
.pick-table { width: 100%; font-size: 0.8125rem; border-collapse: collapse; }
.pick-table th, .pick-table td { padding: 0.4rem 0.35rem; border-bottom: 1px solid var(--border-color); text-align: left; }
.qty-input { width: 4.5rem; padding: 0.35rem 0.5rem; border: 1px solid var(--border-color); border-radius: 6px; }
.check-row { display: flex; align-items: center; gap: 0.5rem; margin: 0.35rem 0; font-size: 0.875rem; }
.estimate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border-color);
  font-size: 0.9375rem;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
.btn-primary {
  padding: 0.55rem 1.15rem;
  font-weight: 600;
  color: var(--latitude-white);
  background: var(--latitude-orange);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-secondary {
  padding: 0.55rem 1.15rem;
  font-weight: 600;
  background: var(--latitude-blue-gray);
  color: var(--latitude-deep-blue);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
