<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import QrProjectorModal from './QrProjectorModal.vue'

defineProps({
  title: {
    type: String,
    default: 'ADMIN PORTAL',
  },
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isQrModalOpen = ref(false)

const handleLogout = async () => {
  await authStore.logoutAdmin()
  router.push('/admin/login')
}

const navLinks = [
  { path: '/admin/dashboard', icon: 'bar_chart', label: 'Hasil Siswa' },
  { path: '/admin/questions', icon: 'edit_note', label: 'Bank Soal' },
  { path: '/admin/analytics', icon: 'analytics', label: 'Laporan (PDF & Excel)' },
  { path: '/admin/settings', icon: 'settings', label: 'Pengaturan Sesi' },
]
</script>

<template>
  <div class="bg-white border-3 border-neo-black p-3 sm:p-4 shadow-neo space-y-3">
    <!-- Top Row: Title, User, Logout -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-neo-black pb-3">
      <div class="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
        <span class="bg-neo-yellow border-2 border-neo-black px-2 sm:px-2.5 py-0.5 sm:py-1 font-display text-lg sm:text-xl uppercase tracking-wider shrink-0">
          {{ title }}
        </span>
        <span class="text-[11px] sm:text-xs font-mono font-bold text-neo-black/80 truncate max-w-[180px] sm:max-w-none inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">account_circle</span>
          <span>{{ authStore.adminEmail || 'Admin' }}</span>
        </span>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
        <button
          @click="isQrModalOpen = true"
          class="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase border-2 border-neo-black bg-neo-yellow text-neo-black shadow-neo hover:bg-white transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 font-display tracking-wider"
          title="Tampilkan QR Code untuk Proyektor Kelas"
        >
          <span class="material-symbols-outlined text-[16px]">qr_code_2</span>
          <span>QR Proyektor</span>
        </button>
        <router-link
          to="/"
          class="flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase border-2 border-neo-black bg-neo-bg hover:bg-white transition-all shadow-neo whitespace-nowrap inline-flex items-center justify-center gap-1"
        >
          <span>Lihat Peserta</span>
          <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
        </router-link>
        <button
          @click="handleLogout"
          class="px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase border-2 border-neo-black bg-[#ff6b6b] text-white shadow-neo hover:bg-red-600 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
        >
          <span class="material-symbols-outlined text-[15px]">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </div>

    <!-- Bottom Row: Navigation Links -->
    <nav class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scroll-smooth">
      <router-link
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        :class="[
          'px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold uppercase border-2 border-neo-black transition-all shrink-0 whitespace-nowrap inline-flex items-center gap-1.5',
          route.path === link.path
            ? 'bg-neo-pink text-neo-black shadow-neo font-black'
            : 'bg-white hover:bg-neo-yellow'
        ]"
      >
        <span class="material-symbols-outlined text-[16px]">{{ link.icon }}</span>
        <span>{{ link.label }}</span>
      </router-link>
    </nav>

    <!-- Modal QR Proyektor Kelas -->
    <QrProjectorModal :is-open="isQrModalOpen" @close="isQrModalOpen = false" />
  </div>
</template>
