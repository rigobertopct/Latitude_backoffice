<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { useAuthStore } from '../stores/auth'
import api from '../api/client'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function onSubmit(e) {
  e.preventDefault()
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = 'Usuario y contraseña son obligatorios.'
    await Swal.fire({ icon: 'warning', title: 'Datos requeridos', text: 'Usuario y contraseña son obligatorios.' })
    return
  }
  loading.value = true
  try {
    const data = await api.post('/api/security/auth/login', {
      username: username.value.trim(),
      password: password.value,
    }, { auth: false })
    const token = data?.access_token
    if (!token) {
      throw new Error('El servidor no devolvió un token.')
    }
    auth.setToken(token)
    await nextTick()
    await router.push('/admin/dashboard')
  } catch (err) {
    const msg = err.message || 'Usuario o contraseña incorrectos.'
    error.value = msg
    await Swal.fire({ icon: 'error', title: 'Error al iniciar sesión', text: msg })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg" aria-hidden="true"></div>

    <div class="login-card">
      <div class="login-card-inner">
        <header class="login-header">
          <h1 class="login-brand">LATITUDE</h1>
          <p class="login-subtitle">Acceso al panel</p>
        </header>

        <form class="login-form" @submit="onSubmit">
          <p v-if="error" class="form-error">{{ error }}</p>
          <div class="form-group">
            <label for="username" class="form-label">Usuario</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="form-input"
              placeholder="Ingresa tu usuario"
              autocomplete="username"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <div class="input-wrap">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="Ingresa tu contraseña"
                autocomplete="current-password"
                :disabled="loading"
              />
              <button
                type="button"
                class="input-icon"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-wrap">
              <input v-model="remember" type="checkbox" class="checkbox-input" />
              <span class="checkbox-label">Recordar sesión</span>
            </label>
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Iniciando sesión…' : 'Iniciar sesión' }}
          </button>
        </form>

        <footer class="login-footer">
          Latitude Transport Services, Inc.
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: var(--latitude-deep-blue);
  opacity: 1;
}

.login-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 60px,
    rgba(255, 255, 255, 0.02) 60px,
    rgba(255, 255, 255, 0.02) 120px
  );
  pointer-events: none;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
}

.login-card-inner {
  background: var(--latitude-white);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  padding: 2.5rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-brand {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  font-style: italic;
  color: var(--latitude-deep-blue);
  letter-spacing: 0.02em;
}

.login-subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  color: var(--latitude-blue-gray);
  font-weight: 500;
}

.form-error {
  margin: 0;
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
  color: #b91c1c;
  background: rgba(185, 28, 28, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(185, 28, 28, 0.3);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--latitude-deep-blue);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--latitude-blue-gray);
  border-radius: 8px;
  color: var(--latitude-deep-blue);
  background: var(--latitude-white);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input::placeholder {
  color: var(--latitude-blue-gray);
  opacity: 0.8;
}

.form-input:hover {
  border-color: #9caab8;
}

.form-input:focus {
  outline: none;
  border-color: var(--latitude-orange);
  box-shadow: 0 0 0 3px rgba(255, 153, 51, 0.25);
}

.input-wrap {
  position: relative;
}

.input-wrap .form-input {
  padding-right: 2.75rem;
}

.input-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--latitude-blue-gray);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.2s;
}

.input-icon:hover {
  color: var(--latitude-deep-blue);
}

.form-options {
  display: flex;
  align-items: center;
}

.checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--latitude-deep-blue);
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--latitude-orange);
  cursor: pointer;
}

.checkbox-label {
  user-select: none;
}

.btn-primary {
  width: 100%;
  padding: 0.9rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--latitude-white);
  background: var(--latitude-orange);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.02s;
}

.btn-primary:hover {
  filter: brightness(1.08);
}

.btn-primary:active {
  transform: scale(0.99);
}

.link-forgot {
  text-align: center;
  font-size: 0.9rem;
  color: var(--latitude-deep-blue);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.link-forgot:hover {
  color: var(--latitude-orange);
}

.login-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--latitude-blue-gray);
  text-align: center;
  font-size: 0.8rem;
  color: var(--latitude-blue-gray);
}
</style>
