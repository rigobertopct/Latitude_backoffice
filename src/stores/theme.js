import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'latitude-admin-theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(
    typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'dark'
  )

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, (value) => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('theme-dark', value)
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light')
    } catch (_) {}
  }, { immediate: true })

  return { isDark, toggle }
})
