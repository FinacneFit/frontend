import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler, setTokenUpdateHandler } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore()

setUnauthorizedHandler(() => {
  authStore._clear()
  if (authStore.isInitialized && router.currentRoute.value.path !== '/login') {
    router.replace('/login')
  }
})

setTokenUpdateHandler((newToken) => {
  authStore.updateAccessToken(newToken)
})

app.mount('#app')
