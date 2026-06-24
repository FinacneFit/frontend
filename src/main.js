import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore()

setUnauthorizedHandler(() => {
  authStore._clear()
  if (router.currentRoute.value.path !== '/login') {
    router.replace('/login')
  }
})

app.mount('#app')

// 앱 시작 시 저장된 토큰 유효성 검증
authStore.refreshMe()
