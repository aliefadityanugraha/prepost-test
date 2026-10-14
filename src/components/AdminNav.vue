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
  <div class="bg-white border-3 border-neo-black shadow-neo overflow-hidden rounded-2xl">
    <!-- 1. Window Control Chrome Header -->
    <div
      class="bg-neo-black text-neo-bg px-3 sm:px-4 py-1.5 flex items-center justify-between border-b-3 border-neo-black select-none text-[10px] sm:text-xs font-mono"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="flex items-center gap-1.5 shrink-0">
          <span
            class="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black inline-block"
          ></span>
          <span
            class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black inline-block"
          ></span>
          <span
            class="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black inline-block"
          ></span>
        </div>
        <span
          class="font-bold uppercase tracking-wider text-white/90 truncate ml-1"
        >
          ADMIN PANEL // {{ title }}
        </span>
      </div>

      <div
        class="flex items-center gap-1.5 text-neo-yellow font-bold shrink-0 ml-2"
      >
        <span class="material-symbols-outlined text-[14px]">shield</span>
        <span class="truncate max-w-[140px] sm:max-w-none">{{
          authStore.adminEmail || "Admin"
        }}</span>
      </div>
    </div>

    <!-- 2. Action Toolbar Row: Title & Action Tools -->
    <div
      class="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-neo-black/20 bg-neo-bg/50"
    >
      <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span
          class="bg-neo-yellow border-3 border-neo-black px-3 py-1 font-display text-xl sm:text-2xl uppercase tracking-wider shadow-neo shrink-0 rounded-xl"
        >
          {{ title }}
        </span>
        <span
          class="hidden md:inline-block font-mono text-[11px] font-bold uppercase text-neo-black/60 bg-white border border-neo-black px-2 py-0.5 rounded-md"
        >
          Workshop Google Sites
        </span>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
        <!-- Button QR Proyektor Kelas -->
        <button
          @click="isQrModalOpen = true"
          class="px-3 py-1.5 text-xs font-bold uppercase border-2 border-neo-black rounded-xl bg-neo-yellow text-neo-black shadow-neo hover:bg-white hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 font-display tracking-wider"
          title="Tampilkan QR Code untuk Proyektor Kelas"
        >
          <span class="material-symbols-outlined text-base">qr_code_2</span>
          <span>QR Proyektor</span>
        </button>

        <!-- Link Lihat Peserta -->
        <router-link
          to="/"
          class="flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs font-bold uppercase border-2 border-neo-black rounded-xl bg-white hover:bg-neo-blue transition-all shadow-neo hover:-translate-y-0.5 active:translate-y-0.5 whitespace-nowrap inline-flex items-center justify-center gap-1"
        >
          <span class="material-symbols-outlined text-sm">visibility</span>
          <span>Halaman Peserta</span>
        </router-link>

        <!-- Button Logout -->
        <button
          @click="handleLogout"
          class="px-3 py-1.5 text-xs font-bold uppercase border-2 border-neo-black rounded-xl bg-[#ff6b6b] text-white shadow-neo hover:bg-red-600 hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1 font-bold"
        >
          <span class="material-symbols-outlined text-sm">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </div>

    <!-- 3. Navigation Tabs Row -->
    <nav
      class="p-2 sm:px-4 sm:py-2.5 flex items-center gap-2 overflow-x-auto scroll-smooth bg-white"
    >
      <router-link
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        :class="[
          'px-3 sm:px-4 py-2 text-xs font-bold uppercase transition-all shrink-0 whitespace-nowrap inline-flex items-center gap-2 rounded-xl',
          route.path === link.path
            ? 'bg-neo-pink text-neo-black border-3 border-neo-black shadow-neo font-black -translate-y-0.5'
            : 'bg-neo-bg text-neo-black border-2 border-neo-black hover:bg-neo-yellow hover:shadow-neo hover:-translate-y-0.5'
        ]"
      >
        <span class="material-symbols-outlined text-base">{{ link.icon }}</span>
        <span class="tracking-wider">{{ link.label }}</span>
        <span
          v-if="route.path === link.path"
          class="w-1.5 h-1.5 rounded-full bg-neo-black ml-0.5"
        ></span>
      </router-link>
    </nav>

    <!-- Modal QR Proyektor Kelas -->
    <QrProjectorModal :is-open="isQrModalOpen" @close="isQrModalOpen = false" />
  </div>
</template>
