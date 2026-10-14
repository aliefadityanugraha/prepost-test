import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Inisialisasi pengecekan sesi auth sedini mungkin
const authStore = useAuthStore()
authStore.initAuth()

app.use(router)

app.mount('#app')

