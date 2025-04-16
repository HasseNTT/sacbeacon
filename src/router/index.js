import { createRouter, createWebHistory } from 'vue-router'
import NotFound from '@/views/NotFound.vue'
import GlBudgetView from '@/views/GlBudgetView.vue'
import DivisionView from '@/views/DivisionView.vue'
import FteView from '@/views/FteView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/fte' },
    { path: '/fte', component: FteView },
    { path: '/budget', component: GlBudgetView },
    { path: '/division', component: DivisionView },
    { path: '/:notFound(.*)', component: NotFound },
  ],
})

export default router
