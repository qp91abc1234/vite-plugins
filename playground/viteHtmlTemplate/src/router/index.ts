import type { App } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{
    path: '/',
    component: () => import('@/views/home/home.vue'),
  }],
})

export function setupRouter(app: App<Element>) {
  app.use(router)
}
