<script setup>
const envios = [
  { id: 'LT-2849', cliente: 'Juan Pérez', destino: 'Guatemala', fecha: '05/03/2026', estado: 'En tránsito' },
  { id: 'LT-2848', cliente: 'María García', destino: 'Colombia', fecha: '04/03/2026', estado: 'Entregado' },
  { id: 'LT-2847', cliente: 'Importadora Costa', destino: 'Honduras', fecha: '04/03/2026', estado: 'En tránsito' },
  { id: 'LT-2846', cliente: 'Auto Express', destino: 'Rep. Dominicana', fecha: '03/03/2026', estado: 'Entregado' },
  { id: 'LT-2845', cliente: 'Carga Sur', destino: 'El Salvador', fecha: '03/03/2026', estado: 'En tránsito' },
  { id: 'LT-2844', cliente: 'Logística Caribe', destino: 'México', fecha: '02/03/2026', estado: 'Entregado' },
]
</script>

<template>
  <main class="main">
    <header class="main-header main-header-with-action">
      <div>
        <h1 class="main-title">Envíos</h1>
        <p class="main-subtitle">Gestiona y da seguimiento a los envíos</p>
      </div>
      <button type="button" class="btn-primary">+ Nuevo envío</button>
    </header>
    <div class="main-content">
      <div class="toolbar">
        <input type="search" class="form-search" placeholder="Buscar por ID o cliente..." />
        <select class="form-select">
          <option value="">Todos los estados</option>
          <option value="transito">En tránsito</option>
          <option value="entregado">Entregado</option>
        </select>
      </div>
      <div class="panel panel-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Destino</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in envios" :key="e.id">
              <td><strong>{{ e.id }}</strong></td>
              <td>{{ e.cliente }}</td>
              <td>{{ e.destino }}</td>
              <td>{{ e.fecha }}</td>
              <td>
                <span class="badge" :class="e.estado === 'Entregado' ? 'badge-success' : 'badge-warning'">{{ e.estado }}</span>
              </td>
              <td>
                <button type="button" class="btn-icon" title="Ver">👁</button>
                <button type="button" class="btn-icon" title="Editar">✏️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">1-6 de 45</div>
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
.main-content { padding: 2rem; flex: 1; }
.toolbar { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
.form-search { padding: 0.6rem 1rem; border: 2px solid var(--latitude-blue-gray); border-radius: 8px; font-size: 0.95rem; min-width: 240px; }
.form-search:focus { outline: none; border-color: var(--latitude-orange); }
.form-select { padding: 0.6rem 1rem; border: 2px solid var(--latitude-blue-gray); border-radius: 8px; font-size: 0.95rem; color: var(--latitude-deep-blue); }
.panel-table { background: var(--card-bg); border-radius: 14px; padding: 0; box-shadow: 0 4px 14px rgba(40, 74, 129, 0.08); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.data-table th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color); background: rgba(40, 74, 129, 0.04); }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
.data-table tbody tr:hover { background: rgba(255, 153, 51, 0.06); }
.badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
.badge-success { background: rgba(34, 197, 94, 0.15); color: #15803d; }
.badge-warning { background: rgba(255, 153, 51, 0.2); color: var(--latitude-orange); }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.25rem; margin-right: 0.25rem; font-size: 1rem; }
.pagination { padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--text-secondary); border-top: 1px solid var(--border-color); }
</style>
