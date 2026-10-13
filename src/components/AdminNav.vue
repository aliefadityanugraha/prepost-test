<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

defineProps({
  title: {
    type: String,
    default: 'ADMIN PORTAL',
  },
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logoutAdmin()
  router.push('/admin/login')
}

const navLinks = [
  { path: '/admin/dashboard', label: '📊 Hasil Siswa' },
  { path: '/admin/questions', label: '📝 Bank Soal (CRUD)' },
  { path: '/admin/analytics', label: '📈 Analitik & PDF' },
  { path: '/admin/settings', label: '⚙ Pengaturan Sesi' },
]
</script>

<template>
  <div class="bg-white border-3 border-neo-black p-4 shadow-neo space-y-3">
    <!-- Top Row: Title, User, Logout -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-neo-black pb-3">
      <div class="flex items-center gap-3">
        <span class="bg-neo-yellow border-2 border-neo-black px-2.5 py-1 font-display text-xl uppercase tracking-wider">
          {{ title }}
        </span>
        <span class="text-xs font-mono font-bold text-neo-black/80 truncate">
          👤 {{ authStore.adminEmail || 'Admin' }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          to="/"
          class="px-3 py-1.5 text-xs font-bold uppercase border-2 border-neo-black bg-neo-bg hover:bg-white transition-all shadow-neo"
        >
          Lihat Halaman Peserta ➔
        </router-link>
        <button
          @click="handleLogout"
          class="px-3 py-1.5 text-xs font-bold uppercase border-2 border-neo-black bg-[#ff6b6b] text-white shadow-neo hover:bg-red-600 transition-all cursor-pointer"
        >
          🚪 Keluar
        </button>
      </div>
    </div>

    <!-- Bottom Row: Navigation Links -->
    <nav class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
      <router-link
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        :class="[
          'px-3.5 py-1.5 text-xs font-bold uppercase border-2 border-neo-black transition-all shrink-0',
          route.path === link.path
            ? 'bg-neo-pink text-neo-black shadow-neo font-black'
            : 'bg-white hover:bg-neo-yellow'
        ]"
      >
        {{ link.label }}
      </router-link>
    </nav>
  </div>
</template>
