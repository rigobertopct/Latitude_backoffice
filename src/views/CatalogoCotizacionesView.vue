<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Swal from 'sweetalert2'
import api from '../api/client'

const tab = ref('productos')
const loading = ref(false)

const productImageInput = ref(null)
const pendingImageFile = ref(null)

const productos = ref([])
const servicios = ref([])
const origenes = ref([])
const destinos = ref([])

const modalOpen = ref(false)
const modalKind = ref('productos')
const editingId = ref(null)
const saving = ref(false)

const form = ref({
  name: '',
  description: '',
  unit_price: '',
  price: '',
  address: '',
  details: '',
  active: true,
})

const tabs = [
  { id: 'productos', label: 'Productos' },
  { id: 'servicios', label: 'Servicios extra' },
  { id: 'origenes', label: 'Orígenes' },
  { id: 'destinos', label: 'Destinos' },
]

const modalTitle = computed(() => {
  const t = modalKind.value
  const labels = { productos: 'producto', servicios: 'servicio', origenes: 'origen', destinos: 'destino' }
  const l = labels[t] || 'ítem'
  return editingId.value ? `Editar ${l}` : `Nuevo ${l}`
})

const editingProductImageUrl = computed(() => {
  if (modalKind.value !== 'productos' || !editingId.value) return null
  const p = productos.value.find((x) => x.id === editingId.value)
  return p?.image_url || null
})

function resolveMediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const raw = String(import.meta.env.VITE_API_URL || '').trim()
  if (!import.meta.env.DEV && raw) {
    const base = raw.startsWith('http') ? raw : `http://${raw}`
    return `${base.replace(/\/+$/, '')}${path}`
  }
  return path
}

function money(n) {
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

async function loadAll() {
  loading.value = true
  try {
    const [p, s, o, d] = await Promise.all([
      api.get('/api/cotizaciones-admin/productos'),
      api.get('/api/cotizaciones-admin/servicios'),
      api.get('/api/cotizaciones-admin/origenes'),
      api.get('/api/cotizaciones-admin/destinos'),
    ])
    productos.value = p
    servicios.value = s
    origenes.value = o
    destinos.value = d
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'No se pudo cargar el catálogo' })
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  form.value = { name: '', description: '', unit_price: '', price: '', address: '', details: '', active: true }
  pendingImageFile.value = null
  if (productImageInput.value) productImageInput.value.value = ''
}

function onProductImageChange(e) {
  const f = e.target.files?.[0]
  pendingImageFile.value = f || null
}

function openNew(kind) {
  modalKind.value = kind
  resetForm()
  modalOpen.value = true
}

function openEdit(kind, row) {
  modalKind.value = kind
  editingId.value = row.id
  pendingImageFile.value = null
  if (productImageInput.value) productImageInput.value.value = ''
  if (kind === 'productos') {
    form.value = {
      name: row.name || '',
      description: row.description || '',
      unit_price: String(row.unit_price),
      price: '',
      address: '',
      details: '',
      active: row.active,
    }
  } else if (kind === 'servicios') {
    form.value = {
      name: row.name || '',
      description: row.description || '',
      unit_price: '',
      price: String(row.price),
      address: '',
      details: '',
      active: row.active,
    }
  } else if (kind === 'origenes') {
    form.value = {
      name: row.name || '',
      description: '',
      unit_price: '',
      price: '',
      address: row.address || '',
      details: '',
      active: row.active,
    }
  } else {
    form.value = {
      name: row.name || '',
      description: '',
      unit_price: '',
      price: '',
      address: '',
      details: row.details || '',
      active: row.active,
    }
  }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  resetForm()
}

async function submitModal(e) {
  e.preventDefault()
  const k = modalKind.value
  saving.value = true
  try {
    if (k === 'productos') {
      const body = {
        name: form.value.name.trim(),
        description: form.value.description?.trim() || null,
        unit_price: Number(form.value.unit_price),
        active: form.value.active,
      }
      let savedId = editingId.value
      if (editingId.value) {
        await api.patch(`/api/cotizaciones-admin/productos/${editingId.value}`, body)
      } else {
        const created = await api.post('/api/cotizaciones-admin/productos', body)
        savedId = created.id
      }
      if (pendingImageFile.value && savedId) {
        const fd = new FormData()
        fd.append('file', pendingImageFile.value)
        await api.postMultipart(`/api/cotizaciones-admin/productos/${savedId}/imagen`, fd)
        pendingImageFile.value = null
        if (productImageInput.value) productImageInput.value.value = ''
      }
    } else if (k === 'servicios') {
      const body = {
        name: form.value.name.trim(),
        description: form.value.description?.trim() || null,
        price: Number(form.value.price),
        active: form.value.active,
      }
      if (editingId.value) await api.patch(`/api/cotizaciones-admin/servicios/${editingId.value}`, body)
      else await api.post('/api/cotizaciones-admin/servicios', body)
    } else if (k === 'origenes') {
      const body = {
        name: form.value.name.trim(),
        address: form.value.address?.trim() || null,
        active: form.value.active,
      }
      if (editingId.value) await api.patch(`/api/cotizaciones-admin/origenes/${editingId.value}`, body)
      else await api.post('/api/cotizaciones-admin/origenes', body)
    } else {
      const body = {
        name: form.value.name.trim(),
        details: form.value.details?.trim() || null,
        active: form.value.active,
      }
      if (editingId.value) await api.patch(`/api/cotizaciones-admin/destinos/${editingId.value}`, body)
      else await api.post('/api/cotizaciones-admin/destinos', body)
    }
    closeModal()
    await loadAll()
    await Swal.fire({ icon: 'success', title: 'Guardado', timer: 1600, showConfirmButton: false })
  } catch (err) {
    await Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo guardar' })
  } finally {
    saving.value = false
  }
}

async function removeRow(kind, row) {
  const { isConfirmed } = await Swal.fire({
    title: '¿Eliminar?',
    text: row.name,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#b91c1c',
  })
  if (!isConfirmed) return
  try {
    if (kind === 'productos') await api.delete(`/api/cotizaciones-admin/productos/${row.id}`)
    else if (kind === 'servicios') await api.delete(`/api/cotizaciones-admin/servicios/${row.id}`)
    else if (kind === 'origenes') await api.delete(`/api/cotizaciones-admin/origenes/${row.id}`)
    else await api.delete(`/api/cotizaciones-admin/destinos/${row.id}`)
    await loadAll()
    await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1400, showConfirmButton: false })
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message })
  }
}

async function uploadProductImageOnly() {
  if (!editingId.value || modalKind.value !== 'productos') return
  if (!pendingImageFile.value) {
    await Swal.fire({ icon: 'info', title: 'Seleccione un archivo', text: 'Elija una imagen (JPEG, PNG, WebP o GIF).' })
    return
  }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('file', pendingImageFile.value)
    await api.postMultipart(`/api/cotizaciones-admin/productos/${editingId.value}/imagen`, fd)
    pendingImageFile.value = null
    if (productImageInput.value) productImageInput.value.value = ''
    await loadAll()
    await Swal.fire({ icon: 'success', title: 'Imagen actualizada', timer: 1400, showConfirmButton: false })
  } catch (err) {
    await Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo subir la imagen' })
  } finally {
    saving.value = false
  }
}

async function clearProductImage() {
  if (!editingId.value || modalKind.value !== 'productos') return
  const { isConfirmed } = await Swal.fire({
    title: '¿Quitar imagen?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Quitar',
    cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return
  saving.value = true
  try {
    await api.delete(`/api/cotizaciones-admin/productos/${editingId.value}/imagen`)
    pendingImageFile.value = null
    if (productImageInput.value) productImageInput.value.value = ''
    await loadAll()
    await Swal.fire({ icon: 'success', title: 'Imagen eliminada', timer: 1200, showConfirmButton: false })
  } catch (err) {
    await Swal.fire({ icon: 'error', title: 'Error', text: err.message })
  } finally {
    saving.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <main class="main mdc-surface">
    <header class="main-header">
      <div class="header-row">
        <div>
          <h1 class="main-title">Catálogo para cotizaciones</h1>
          <p class="main-subtitle">Productos exportables, servicios extra, orígenes y destinos (estilo Material)</p>
        </div>
        <RouterLink to="/admin/cotizaciones" class="link-back">← Ver solicitudes</RouterLink>
      </div>
      <nav class="tab-bar" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          class="tab"
          :class="{ 'tab-active': tab === t.id }"
          :aria-selected="tab === t.id"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </nav>
    </header>

    <div class="main-content">
      <div v-if="loading" class="loading">Cargando…</div>

      <section v-else-if="tab === 'productos'" class="panel mdc-elevated">
        <div class="panel-head">
          <h2>Productos exportables</h2>
          <button type="button" class="btn-filled" @click="openNew('productos')">+ Agregar</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-thumb">Imagen</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in productos" :key="p.id">
              <td class="td-thumb">
                <img
                  v-if="p.image_url"
                  :src="resolveMediaUrl(p.image_url)"
                  alt=""
                  class="table-thumb"
                />
                <span v-else class="muted">—</span>
              </td>
              <td><strong>{{ p.name }}</strong><br /><span class="muted">{{ p.description }}</span></td>
              <td>{{ money(p.unit_price) }}</td>
              <td><span class="chip" :class="p.active ? 'chip-on' : 'chip-off'">{{ p.active ? 'Sí' : 'No' }}</span></td>
              <td class="actions">
                <button type="button" class="btn-text" @click="openEdit('productos', p)">Editar</button>
                <button type="button" class="btn-text danger" @click="removeRow('productos', p)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else-if="tab === 'servicios'" class="panel mdc-elevated">
        <div class="panel-head">
          <h2>Servicios extra</h2>
          <button type="button" class="btn-filled" @click="openNew('servicios')">+ Agregar</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Monto</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in servicios" :key="s.id">
              <td><strong>{{ s.name }}</strong><br /><span class="muted">{{ s.description }}</span></td>
              <td>{{ money(s.price) }}</td>
              <td><span class="chip" :class="s.active ? 'chip-on' : 'chip-off'">{{ s.active ? 'Sí' : 'No' }}</span></td>
              <td class="actions">
                <button type="button" class="btn-text" @click="openEdit('servicios', s)">Editar</button>
                <button type="button" class="btn-text danger" @click="removeRow('servicios', s)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else-if="tab === 'origenes'" class="panel mdc-elevated">
        <div class="panel-head">
          <h2>Orígenes de envío</h2>
          <button type="button" class="btn-filled" @click="openNew('origenes')">+ Agregar</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in origenes" :key="o.id">
              <td><strong>{{ o.name }}</strong></td>
              <td class="muted">{{ o.address || '—' }}</td>
              <td><span class="chip" :class="o.active ? 'chip-on' : 'chip-off'">{{ o.active ? 'Sí' : 'No' }}</span></td>
              <td class="actions">
                <button type="button" class="btn-text" @click="openEdit('origenes', o)">Editar</button>
                <button type="button" class="btn-text danger" @click="removeRow('origenes', o)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else class="panel mdc-elevated">
        <div class="panel-head">
          <h2>Destinos de envío</h2>
          <button type="button" class="btn-filled" @click="openNew('destinos')">+ Agregar</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Detalles</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in destinos" :key="d.id">
              <td><strong>{{ d.name }}</strong></td>
              <td class="muted">{{ d.details || '—' }}</td>
              <td><span class="chip" :class="d.active ? 'chip-on' : 'chip-off'">{{ d.active ? 'Sí' : 'No' }}</span></td>
              <td class="actions">
                <button type="button" class="btn-text" @click="openEdit('destinos', d)">Editar</button>
                <button type="button" class="btn-text danger" @click="removeRow('destinos', d)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card mdc-elevated" :class="{ 'modal-wide': modalKind === 'productos' }">
        <h3 class="modal-title">{{ modalTitle }}</h3>
        <form @submit="submitModal">
          <label class="field">
            <span class="field-label">Nombre</span>
            <input v-model="form.name" class="field-input" required maxlength="200" />
          </label>
          <template v-if="modalKind === 'productos'">
            <label class="field">
              <span class="field-label">Descripción</span>
              <textarea v-model="form.description" class="field-input" rows="2"></textarea>
            </label>
            <label class="field">
              <span class="field-label">Precio unitario (USD)</span>
              <input v-model="form.unit_price" class="field-input" type="number" step="0.01" min="0" required />
            </label>
            <div class="field">
              <span class="field-label">Imagen del producto</span>
              <div v-if="editingId && editingProductImageUrl" class="img-preview-wrap">
                <img :src="resolveMediaUrl(editingProductImageUrl)" alt="Vista previa" class="img-preview" />
              </div>
              <p v-else-if="editingId" class="muted img-hint">Sin imagen</p>
              <input
                ref="productImageInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="field-input file-input"
                @change="onProductImageChange"
              />
              <p class="muted img-hint">JPEG, PNG, WebP o GIF. Máx. ~3 MB.</p>
              <div v-if="editingId" class="img-actions">
                <button
                  type="button"
                  class="btn-outlined btn-compact"
                  :disabled="saving || !pendingImageFile"
                  @click="uploadProductImageOnly"
                >
                  Subir / reemplazar imagen
                </button>
                <button
                  v-if="editingProductImageUrl"
                  type="button"
                  class="btn-text danger btn-compact"
                  :disabled="saving"
                  @click="clearProductImage"
                >
                  Quitar imagen
                </button>
              </div>
              <p v-else class="muted img-hint">Tras crear el producto, la imagen seleccionada se sube al guardar.</p>
            </div>
          </template>
          <template v-else-if="modalKind === 'servicios'">
            <label class="field">
              <span class="field-label">Descripción</span>
              <textarea v-model="form.description" class="field-input" rows="2"></textarea>
            </label>
            <label class="field">
              <span class="field-label">Monto (USD)</span>
              <input v-model="form.price" class="field-input" type="number" step="0.01" min="0" required />
            </label>
          </template>
          <template v-else-if="modalKind === 'origenes'">
            <label class="field">
              <span class="field-label">Dirección / notas</span>
              <textarea v-model="form.address" class="field-input" rows="2"></textarea>
            </label>
          </template>
          <template v-else>
            <label class="field">
              <span class="field-label">Detalles</span>
              <textarea v-model="form.details" class="field-input" rows="2"></textarea>
            </label>
          </template>
          <label class="field row-check">
            <input v-model="form.active" type="checkbox" />
            <span>Activo</span>
          </label>
          <div class="modal-actions">
            <button type="button" class="btn-outlined" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-filled" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
.main { flex: 1; min-height: 100vh; display: flex; flex-direction: column; background: var(--layout-bg); }
.mdc-surface { font-family: 'Roboto', system-ui, sans-serif; }
.main-header {
  background: var(--card-bg);
  padding: 1.25rem 1.5rem 0;
  border-bottom: 1px solid var(--border-color);
}
.header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.main-title { margin: 0; font-size: 1.35rem; font-weight: 500; color: var(--text-primary); letter-spacing: 0.01em; }
.main-subtitle { margin: 0.35rem 0 0; font-size: 0.875rem; color: var(--text-secondary); }
.link-back {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--latitude-deep-blue);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  background: rgba(40, 74, 129, 0.08);
}
.link-back:hover { background: rgba(255, 153, 51, 0.15); color: var(--latitude-orange); }
.tab-bar {
  display: flex;
  gap: 0.25rem;
  margin-top: 1rem;
  border-bottom: 1px solid var(--border-color);
}
.tab {
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tab:hover { color: var(--latitude-deep-blue); background: rgba(40, 74, 129, 0.04); }
.tab-active {
  color: var(--latitude-orange);
  border-bottom-color: var(--latitude-orange);
}
.main-content { padding: 1.5rem; flex: 1; }
.loading { padding: 2rem; text-align: center; color: var(--text-secondary); }
.panel {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
}
.mdc-elevated { box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06); }
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}
.panel-head h2 { margin: 0; font-size: 1rem; font-weight: 500; color: var(--text-primary); }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table th {
  text-align: left;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}
.data-table td { padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border-color); vertical-align: top; }
.muted { font-size: 0.8125rem; color: var(--text-secondary); }
.chip {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}
.chip-on { background: rgba(34, 197, 94, 0.15); color: #15803d; }
.chip-off { background: rgba(0,0,0,0.06); color: var(--text-secondary); }
.actions { white-space: nowrap; }
.btn-filled {
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  color: var(--latitude-white);
  background: var(--latitude-orange);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.12);
}
.btn-filled:hover { filter: brightness(1.05); }
.btn-filled:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-text {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--latitude-deep-blue);
  cursor: pointer;
  margin-right: 0.5rem;
}
.btn-text.danger { color: #b91c1c; }
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-card {
  width: 100%;
  max-width: 420px;
  padding: 1.5rem;
  border-radius: 16px;
  background: var(--card-bg);
}
.modal-card.modal-wide {
  max-width: 480px;
}
.th-thumb,
.td-thumb {
  width: 64px;
  text-align: center;
  vertical-align: middle;
}
.table-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
.img-preview-wrap {
  margin-bottom: 0.5rem;
}
.img-preview {
  max-height: 140px;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  object-fit: contain;
}
.img-hint {
  font-size: 0.75rem;
  margin: 0.25rem 0 0.5rem;
}
.file-input {
  padding: 0.45rem 0.5rem;
  font-size: 0.8125rem;
}
.img-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.btn-compact {
  font-size: 0.8125rem;
  padding: 0.4rem 0.85rem;
}
.modal-title { margin: 0 0 1rem; font-size: 1.125rem; font-weight: 500; }
.field { display: block; margin-bottom: 1rem; }
.field-label { display: block; font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.35rem; }
.field-input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9375rem;
  background: var(--card-bg);
  color: var(--text-primary);
  box-sizing: border-box;
}
.field-input:focus { outline: none; border-color: var(--latitude-orange); }
.row-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-outlined {
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  color: var(--text-primary);
}
</style>
