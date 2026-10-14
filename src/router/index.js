import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  // Rute Publik (Peserta)
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('../views/Test.vue'),
  },
  {
    path: '/result',
    name: 'result',
    component: () => import('../views/Result.vue'),
  },

  // Rute Admin
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/admin/Login.vue'),
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard',
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/questions',
    name: 'admin-questions',
    component: () => import('../views/admin/Questions.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/analytics',
    name: 'admin-analytics',
    component: () => import('../views/admin/Analytics.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('../views/admin/Settings.vue'),
    meta: { requiresAuth: true },
  },

  // Redirect fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Navigation Guards untuk memproteksi rute /admin/*
router.beforeEach(async (to, from, next) => {
  // Pastikan inisialisasi state Firebase Auth selesai pada first load / refresh
  const authStore = useAuthStore()
  await authStore.initAuth()

  const isUserAuthenticated = authStore.isAuthenticated

  // Cek apakah rute membutuhkan autentikasi
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth) ||
    (to.path.startsWith('/admin') && to.path !== '/admin/login')

  if (requiresAuth) {
    if (!isUserAuthenticated) {
      // Jika belum login, lempar ke /admin/login disertai parameter redirect
      next({
        path: '/admin/login',
        query: { redirect: to.fullPath },
      })
    } else {
      next()
    }
  } else if (to.path === '/admin/login' && isUserAuthenticated) {
    // Jika sudah login dan membuka /admin/login, alihkan ke redirect target atau dashboard
    const redirectUrl = to.query.redirect || '/admin/dashboard'
    next(redirectUrl)
  } else {
    next()
  }
})

export default router
