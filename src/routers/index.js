import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import BooksView from '../views/BooksView.vue'
import AuthorView from '../views/AuthorView.vue'
import MembersView from '../views/MembersView.vue'
import LendingsView from '../views/LendingsView.vue'
import UserView from '../views/UserView.vue'
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
        path: 'authors',
        name: 'authors',
        component: AuthorView,
        meta: { requiresRole: 'LIBRARIAN' },
      },
      {
        path: 'members',
        name: 'members',
        component: MembersView,
        meta: { requiresRole: 'LIBRARIAN' },
      },
      {
        path: 'lendings',
        name: 'lendings',
        component: LendingsView,
        meta: { requiresRole: 'LIBRARIAN' },
      },
      {
        path: 'users',
        name: 'users',
        component: UserView,
        meta: { requiresRole: 'ADMIN' },
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

  const requiredRole = to.matched
    .map((record) => record.meta.requiresRole)
    .find(Boolean)

  if (requiredRole) {
    let user = null

    try {
      user = JSON.parse(localStorage.getItem('user') ?? 'null')
    } catch {
      user = null
    }

    if (user?.role !== requiredRole) {
      return { name: 'dashboard' }
    }
  }
})

export default router