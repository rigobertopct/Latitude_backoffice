<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import api from '../api/client'

const route = useRoute()

const clientes = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

const form = ref({
  nombre_empresa: '',
  nombre_contacto: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  pais: '',
  activo: true,
})

const modalTitle = computed(() => (editingId.value ? 'Editar cliente' : 'Nuevo cliente'))

function resetForm() {
  editingId.value = null
  form.value = {
    nombre_empresa: '',
    nombre_contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: '',
    activo: true,
  }
  formError.value = ''
}

function openNew() {
  resetForm()
  modalOpen.value = true
}

function openEdit(c) {
  editingId.value = c.id
  form.value = {
    nombre_empresa: c.nombre_empresa || '',
    nombre_contacto: c.nombre_contacto || '',
    email: c.email || '',
    telefono: c.telefono || '',
    direccion: c.direccion || '',
    ciudad: c.ciudad || '',
    pais: c.pais || '',
    activo: c.activo ?? true,
  }
  formError.value = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  resetForm()
}

async function loadClientes() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (search.value.trim()) params.set('search', search.value.trim())
    const path = params.toString() ? `/api/clientes?${params}` : '/api/clientes'
    clientes.value = await api.get(path)
  } catch (err) {
    const msg = err.message || 'Error al cargar clientes'
    error.value = msg
    clientes.value = []
    await Swal.fire({ icon: 'error', title: 'Error', text: msg })
  } finally {
    loading.value = false
  }
}

async function submitForm(e) {
  e.preventDefault()
  formError.value = ''
  if (!form.value.nombre_empresa?.trim() || !form.value.email?.trim()) {
    formError.value = 'Nombre de empresa y email son obligatorios.'
    await Swal.fire({ icon: 'warning', title: 'Datos requeridos', text: 'Nombre de empresa y email son obligatorios.' })
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await api.patch(`/api/clientes/${editingId.value}`, {
        nombre_empresa: form.value.nombre_empresa.trim(),
        nombre_contacto: form.value.nombre_contacto?.trim() || null,
        email: form.value.email.trim(),
        telefono: form.value.telefono?.trim() || null,
        direccion: form.value.direccion?.trim() || null,
        ciudad: form.value.ciudad?.trim() || null,
        pais: form.value.pais?.trim() || null,
        activo: form.value.activo,
      })
    } else {
      await api.post('/api/clientes', {
        nombre_empresa: form.value.nombre_empresa.trim(),
        nombre_contacto: form.value.nombre_contacto?.trim() || null,
        email: form.value.email.trim(),
        telefono: form.value.telefono?.trim() || null,
        direccion: form.value.direccion?.trim() || null,
        ciudad: form.value.ciudad?.trim() || null,
        pais: form.value.pais?.trim() || null,
        activo: form.value.activo,
      })
    }
    const wasEdit = !!editingId.value
    closeModal()
    await loadClientes()
    await Swal.fire({ icon: 'success', title: 'Guardado', text: wasEdit ? 'Cliente actualizado.' : 'Cliente creado.', timer: 2000, showConfirmButton: false })
  } catch (err) {
    const msg = err.message || 'Error al guardar'
    formError.value = msg
    await Swal.fire({ icon: 'error', title: 'Error al guardar', text: msg })
  } finally {
    saving.value = false
  }
}

async function toggleActivo(c, e) {
  e.stopPropagation()
  const accion = c.activo ? 'desactivar' : 'activar'
  const text = c.activo
    ? `El cliente "${c.nombre_empresa}" no podrá iniciar sesión en el portal.`
    : `El cliente "${c.nombre_empresa}" podrá volver a iniciar sesión en el portal.`
  const { isConfirmed } = await Swal.fire({
    title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} cliente?`,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: c.activo ? '#b91c1c' : '#15803d',
  })
  if (!isConfirmed) return
  try {
    await api.patch(`/api/clientes/${c.id}`, { activo: !c.activo })
    await loadClientes()
    await Swal.fire({ icon: 'success', title: 'Listo', text: c.activo ? 'Cliente desactivado.' : 'Cliente activado.', timer: 2000, showConfirmButton: false })
  } catch (err) {
    const msg = err.message || 'Error al actualizar'
    error.value = msg
    await Swal.fire({ icon: 'error', title: 'Error', text: msg })
  }
}

async function deleteClient(c, e) {
  e.stopPropagation()
  const { isConfirmed } = await Swal.fire({
    title: '¿Eliminar cliente?',
    html: `Se eliminará permanentemente a <strong>${c.nombre_empresa}</strong>.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#b91c1c',
  })
  if (!isConfirmed) return
  try {
    await api.delete(`/api/clientes/${c.id}`)
    await loadClientes()
    await Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Cliente eliminado.', timer: 2000, showConfirmButton: false })
  } catch (err) {
    const msg = err.message || 'Error al eliminar'
    error.value = msg
    await Swal.fire({ icon: 'error', title: 'Error', text: msg })
  }
}

let searchTimeout = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadClientes, 400)
})
onMounted(() => {
  loadClientes()
  if (route.query.nuevo === '1') openNew()
})
</script>

<template>
  <main class="main">
    <header class="main-header main-header-with-action">
      <div>
        <h1 class="main-title">Clientes</h1>
        <p class="main-subtitle">Gestión y administración de la base de datos de clientes</p>
      </div>
      <button type="button" class="btn-primary" @click="openNew">+ Nuevo cliente</button>
    </header>
    <div class="main-content">
      <p v-if="error" class="form-error">{{ error }}</p>
      <div class="toolbar">
        <input
          v-model="search"
          type="search"
          class="form-search"
          placeholder="Buscar por nombre o email..."
        />
      </div>
      <div class="panel panel-table">
        <div v-if="loading" class="loading-row">Cargando clientes...</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Nombre de empresa</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clientes" :key="c.id" :class="{ 'row-inactive': !c.activo }">
              <td><strong>{{ c.nombre_empresa }}</strong></td>
              <td>{{ c.nombre_contacto || '—' }}</td>
              <td>{{ c.email }}</td>
              <td>{{ c.telefono || '—' }}</td>
              <td>
                <span :class="['badge', c.activo ? 'badge-success' : 'badge-danger']">
                  {{ c.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button type="button" class="btn-icon" title="Editar" @click="openEdit(c)">✏️</button>
                <button
                  type="button"
                  :class="['btn-icon', 'btn-icon-toggle', c.activo ? 'btn-icon-warn' : 'btn-icon-ok']"
                  :title="c.activo ? 'Desactivar (no podrá entrar al portal)' : 'Activar'"
                  @click="(e) => toggleActivo(c, e)"
                >
                  {{ c.activo ? '🚫' : '✅' }}
                </button>
                <button type="button" class="btn-icon btn-icon-danger" title="Eliminar" @click="(e) => deleteClient(c, e)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!loading && clientes.length === 0">
              <td colspan="6" class="empty-cell">No hay clientes. Crea uno con «Nuevo cliente».</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!loading" class="pagination">{{ clientes.length }} cliente(s)</div>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="closeModal">×</button>
        </div>
        <form @submit="submitForm">
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="form-group">
            <label class="form-label">Nombre de empresa *</label>
            <input v-model="form.nombre_empresa" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Nombre de contacto</label>
            <input v-model="form.nombre_contacto" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input v-model="form.email" type="email" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input v-model="form.telefono" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Dirección</label>
            <input v-model="form.direccion" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Ciudad</label>
              <input v-model="form.ciudad" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">País</label>
              <input v-model="form.pais" type="text" class="form-input" />
            </div>
          </div>
          <div class="form-group form-group-checkbox">
            <label class="checkbox-wrap">
              <input v-model="form.activo" type="checkbox" class="checkbox-input" />
              <span class="checkbox-label">Activo</span>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
.main { flex: 1; background: var(--layout-bg); min-height: 100vh; display: flex; flex-direction: column; }
.main-header { background: var(--card-bg); padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-color); }
.main-header-with-action { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.main-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
.main-subtitle { margin: 0.25rem 0 0; font-size: 0.9rem; color: var(--text-secondary); }
.btn-primary { padding: 0.65rem 1.25rem; font-weight: 600; color: var(--latitude-white); background: var(--latitude-orange); border: none; border-radius: 8px; cursor: pointer; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.main-content { padding: 2rem; flex: 1; }
.toolbar { margin-bottom: 1.25rem; }
.form-search { padding: 0.6rem 1rem; border: 2px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; min-width: 280px; background: var(--card-bg); color: var(--text-primary); }
.form-search:focus { outline: none; border-color: var(--latitude-orange); }
.form-error { margin: 0 0 1rem; padding: 0.6rem 0.9rem; font-size: 0.9rem; color: #b91c1c; background: rgba(185,28,28,0.1); border-radius: 8px; }
.panel-table { background: var(--card-bg); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08); }
.loading-row { padding: 2rem; text-align: center; color: var(--text-secondary); }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.data-table th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color); background: rgba(40, 74, 129, 0.04); }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
.data-table tbody tr:hover { background: rgba(255, 153, 51, 0.06); }
.empty-cell { text-align: center; color: var(--text-secondary); padding: 2rem !important; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.25rem; font-size: 1rem; }
.btn-icon-danger:hover { opacity: 0.8; }
.btn-icon-toggle { margin-right: 0.15rem; }
.btn-icon-warn:hover { opacity: 0.85; }
.btn-icon-ok:hover { opacity: 0.85; }
.badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
.badge-success { background: rgba(34, 197, 94, 0.2); color: #15803d; }
.badge-danger { background: rgba(185, 28, 28, 0.15); color: #b91c1c; }
.row-inactive { opacity: 0.85; }
.row-inactive .data-table td { color: var(--text-secondary); }
.pagination { padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--text-secondary); border-top: 1px solid var(--border-color); }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-card { background: var(--card-bg); border-radius: 14px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); }
.modal-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
.modal-close { background: none; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: var(--text-secondary); padding: 0.25rem; }
.modal-close:hover { color: var(--text-primary); }
.modal-card form { padding: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.35rem; }
.form-input { width: 100%; padding: 0.6rem 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: var(--card-bg); color: var(--text-primary); }
.form-input:focus { outline: none; border-color: var(--latitude-orange); }
.form-group-checkbox { margin-bottom: 1.25rem; }
.checkbox-wrap { display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; color: var(--text-primary); }
.checkbox-input { accent-color: var(--latitude-orange); }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
.btn-secondary { padding: 0.6rem 1.25rem; font-weight: 600; background: var(--latitude-blue-gray); color: var(--latitude-deep-blue); border: none; border-radius: 8px; cursor: pointer; }
.btn-secondary:hover { filter: brightness(0.95); }
</style>
