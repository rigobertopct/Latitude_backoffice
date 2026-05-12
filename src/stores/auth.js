import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'latitude-admin-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken || ''
    if (newToken) {
      try {
        localStorage.setItem(TOKEN_KEY, newToken)
      } catch (_) {}
    } else {
      try {
        localStorage.removeItem(TOKEN_KEY)
      } catch (_) {}
    }
  }

  function setUser(data) {
    user.value = data
  }

  function logout() {
    setToken('')
    user.value = null
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    logout,
  }
})
