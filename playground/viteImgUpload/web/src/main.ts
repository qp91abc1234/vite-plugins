import { createApp } from 'vue'
import App from './App.vue'
import { setupPinia } from '@/pinia'
import { setupRouter } from '@/router'

const app = createApp(App)
setupPinia(app)
setupRouter(app)
app.mount('#app')
