import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import TestView from '../views/TestView.vue'  

const routes = [
  {
    path: '/',
    name: 'home',
    component: MainView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/test',
    name: 'test',
    component: TestView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
