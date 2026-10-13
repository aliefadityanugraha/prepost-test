import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Test from '../views/Test.vue'
import Result from '../views/Result.vue'
import AdminLogin from '../views/admin/Login.vue'
import AdminDashboard from '../views/admin/Dashboard.vue'
import AdminSettings from '../views/admin/Settings.vue'
import AdminQuestions from '../views/admin/Questions.vue'
import AdminAnalytics from '../views/admin/Analytics.vue'
import { useAuthStore } from '../stores/authStore'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const routes = [
  // Rute Publik (Peserta)
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/test',
    name: 'test',
    component: Test,
  },
  {
    path: '/result',
    name: 'result',
    component: Result,
  },

  // Rute Admin
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLogin,
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard',
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/questions',
    name: 'admin-questions',
    component: AdminQuestions,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/analytics',
    name: 'admin-analytics',
    component: AdminAnalytics,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: AdminSettings,
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

// Helper untuk memastikan inisialisasi state Firebase Auth selesai pada first load
let authChecked = false
const ensureAuthReady = () => {
  return new Promise((resolve) => {
    if (authChecked) return resolve()
    const unsubscribe = onAuthStateChanged(auth, () => {
      authChecked = true
      unsubscribe()
      resolve()
    })
    // Timeout fallback agar tidak blocking jika Firebase credentials offline/demo
    setTimeout(() => {
      authChecked = true
      resolve()
    }, 1500)
  })
}

// Navigation Guards untuk memproteksi rute /admin/*
router.beforeEach(async (to, from, next) => {
  await ensureAuthReady()
  const authStore = useAuthStore()
  const isUserAuthenticated = authStore.isAuthenticated

  // Cek apakah rute membutuhkan autentikasi
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth) ||
    (to.path.startsWith('/admin') && to.path !== '/admin/login')

  if (requiresAuth) {
    if (!isUserAuthenticated) {
      // Jika belum login, lempar ke /admin/login
      next({
        path: '/admin/login',
        query: { redirect: to.fullPath },
      })
    } else {
      next()
    }
  } else if (to.path === '/admin/login' && isUserAuthenticated) {
    // Jika sudah login dan membuka /admin/login, alihkan ke dashboard
    next('/admin/dashboard')
  } else {
    next()
  }
})

export default router
