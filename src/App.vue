<script setup>
import { RouterView } from 'vue-router'
import { useUserStore } from './stores/userStore'
import { onMounted } from 'vue'

const userStore = useUserStore()

onMounted(() => {
  // Inisialisasi realtime listener status tes
  userStore.initPengaturanListener()
})
</script>

<template>
  <!-- Main App Shell dengan Background Polkadot Halus -->
  <div class="min-h-screen flex flex-col bg-neo-bg bg-neo-dots text-neo-black font-sans selection:bg-neo-pink selection:text-neo-black">
    <!-- Sticky Navigation Header -->
    <header class="sticky top-0 z-40 bg-white border-b-3 border-neo-black">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <!-- Logo / Brand -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 bg-neo-yellow border-3 border-neo-black shadow-neo flex items-center justify-center font-display text-2xl text-neo-black group-hover:rotate-6 transition-transform">
            GS
          </div>
          <div>
            <span class="font-display text-2xl sm:text-3xl tracking-wide uppercase block leading-none">
              Pre & Post Test
            </span>
            <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neo-black/80 block mt-0.5">
              Workshop Website Portfolio • Google Sites
            </span>
          </div>
        </router-link>

        <!-- Navigation Actions -->
        <div class="flex items-center gap-3">
          <div v-if="userStore.nama" class="hidden sm:flex items-center gap-2 border-2 border-neo-black bg-neo-bg px-3 py-1 text-xs font-bold font-mono">
            <span>👤 {{ userStore.nama }}</span>
            <span class="text-neo-black/50">|</span>
            <span>{{ userStore.kelas }}</span>
          </div>

          <router-link
            to="/"
            class="neo-button bg-neo-yellow px-3 sm:px-4 py-2 text-xs sm:text-sm uppercase tracking-wider text-neo-black cursor-pointer"
          >
            Beranda
          </router-link>

          <router-link
            to="/admin"
            class="neo-button bg-neo-pink px-3 sm:px-4 py-2 text-xs sm:text-sm uppercase tracking-wider text-neo-black cursor-pointer"
          >
            Admin 🔒
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <router-view />
    </main>

    <!-- Clean Footer -->
    <footer class="bg-neo-black text-neo-bg border-t-3 border-neo-black mt-auto py-5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 font-display text-base sm:text-lg tracking-wider">
          <span class="inline-block w-2.5 h-2.5 bg-neo-yellow border border-neo-bg"></span>
          PRE & POST TEST • WORKSHOP WEBSITE PORTFOLIO GOOGLE SITES
        </div>
        <p class="font-medium text-neo-bg/70">
          Platform Evaluasi Pelatihan & Sertifikasi Portofolio Digital
        </p>
      </div>
    </footer>
  </div>
</template>
