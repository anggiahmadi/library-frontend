import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import BooksView from '../views/BooksView.vue'
import MembersView from '../views/MembersView.vue'
import LendingsView from '../views/LendingsView.vue'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
      },
      {
        path: 'books',
        name: 'books',
        component: BooksView,
      },
      {
        path: 'members',
        name: 'members',
        component: MembersView,
      },
      {
        path: 'lendings',
        name: 'lendings',
        component: LendingsView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')

  if (to.matched.some((record) => record.meta.requiresAuth) && !token) {
    return { name: 'login' }
  }

  if (to.matched.some((record) => record.meta.guestOnly) && token) {
    return { name: 'dashboard' }
  }
})

export default router