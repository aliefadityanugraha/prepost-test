<script setup>
import { RouterView } from "vue-router";
import { useUserStore } from "./stores/userStore";
import { onMounted } from "vue";

const userStore = useUserStore();

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

onMounted(() => {
  // Inisialisasi realtime listener status tes
  userStore.initPengaturanListener();
});
</script>

<template>
  <!-- Main App Shell dengan Background Polkadot Halus -->
  <div
    class="min-h-screen flex flex-col bg-neo-bg bg-neo-dots text-neo-black font-sans selection:bg-neo-pink selection:text-neo-black"
  >
    <!-- Sticky Navigation Header with Retro Chrome -->
    <header class="sticky top-0 z-40 bg-white border-b-3 border-neo-black shadow-sm">
      <!-- 1. Top Decorative Micro-Chrome Bar -->
      <div
        class="bg-neo-black text-neo-bg px-3 sm:px-6 py-1.5 flex items-center justify-between text-[10px] sm:text-[11px] font-mono border-b-2 border-neo-black select-none"
      >
        <div class="flex items-center gap-2">
          <!-- Window Dots -->
          <div class="flex items-center gap-1.5">
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
            class="font-bold tracking-wider uppercase ml-1 text-white/90 hidden sm:inline"
          >
            PORTFOLIO ASSESSMENT SYSTEM // GOOGLE SITES
          </span>
          <span
            class="font-bold tracking-wider uppercase ml-1 text-white/90 sm:hidden"
          >
            GS EVALUATION
          </span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Live Session Indicator -->
          <div class="flex items-center gap-1.5 font-bold uppercase">
            <span
              class="w-2 h-2 rounded-full border border-black animate-pulse"
              :class="
                userStore.status_tes_aktif === 'Ditutup'
                  ? 'bg-[#ff6b6b]'
                  : 'bg-neo-green'
              "
            ></span>
            <span class="text-neo-yellow text-[10px] sm:text-[11px]">
              SESI: {{ userStore.status_tes_aktif }}
            </span>
          </div>
          <span class="text-white/40 hidden md:inline">|</span>
          <span class="text-white/70 hidden md:inline font-mono">
            VOKASI / SMK
          </span>
        </div>
      </div>

      <!-- 2. Main Navigation Bar -->
      <div
        class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3"
      >
        <!-- Logo / Brand -->
        <router-link
          to="/"
          class="flex items-center gap-2.5 sm:gap-3 group shrink min-w-0"
        >
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 bg-neo-yellow border-3 border-neo-black shadow-neo flex items-center justify-center font-display text-2xl sm:text-3xl text-neo-black group-hover:rotate-6 group-hover:scale-105 transition-all shrink-0"
          >
            GS
          </div>
          <div class="truncate">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="font-display text-2xl sm:text-4xl tracking-wide uppercase block leading-none text-neo-black"
              >
                Pre & Post Test
              </span>
              <span
                class="hidden md:inline-block bg-neo-pink text-neo-black border-2 border-neo-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#282a36]"
              >
                Workshop
              </span>
            </div>
            <span
              class="hidden sm:block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neo-black/75 mt-0.5 truncate"
            >
              Pembuatan Website Portfolio • Google Sites
            </span>
          </div>
        </router-link>

        <!-- Navigation Actions -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            v-if="userStore.nama"
            class="hidden lg:flex items-center gap-2 border-2 border-neo-black bg-neo-bg px-3 py-1.5 text-xs font-bold font-mono shadow-neo"
          >
            <span class="material-symbols-outlined text-sm text-neo-black"
              >account_circle</span
            >
            <span
              class="text-neo-black font-extrabold max-w-[140px] truncate"
              >{{ userStore.nama }}</span
            >
            <span class="text-neo-black/40">|</span>
            <span class="text-neo-black/70">{{ userStore.kelas }}</span>
          </div>

          <!-- Tombol Navigasi Beranda / Ikuti Tes -->
          <router-link
            to="/"
            class="neo-button bg-neo-yellow px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs uppercase tracking-wider text-neo-black cursor-pointer flex items-center gap-1.5 font-display text-sm sm:text-base"
          >
            <span class="material-symbols-outlined text-base">quiz</span>
            <span>Ujian</span>
          </router-link>

          <!-- Tombol Navigasi Admin Portal -->
          <router-link
            to="/admin"
            class="neo-button bg-neo-pink px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm uppercase tracking-wider text-neo-black cursor-pointer flex items-center gap-1.5 font-display text-sm sm:text-base"
          >
            <span class="material-symbols-outlined text-base"
              >admin_panel_settings</span
            >
            <span>Admin</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 md:py-12"
    >
      <router-view />
    </main>

    <!-- Upgraded Rich Neo-Brutalist Footer -->
    <footer class="mt-auto border-t-3 border-neo-black bg-neo-black text-neo-bg">
      <!-- 1. Retro Hazard Ticker Ribbon -->
      <div
        class="bg-neo-yellow border-b-3 border-neo-black py-2 sm:py-2.5 px-3 sm:px-6 overflow-hidden select-none"
      >
        <div
          class="max-w-7xl mx-auto flex items-center justify-between gap-4 text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-neo-black whitespace-nowrap overflow-hidden"
        >
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neo-pink border border-neo-black inline-block"></span>
            <span>Workshop Portfolio Google Sites</span>
          </div>
          <span class="hidden md:inline">★</span>
          <div class="hidden sm:flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neo-blue border border-neo-black inline-block"></span>
            <span>Instrumen Pre-Test & Post-Test</span>
          </div>
          <span class="hidden lg:inline">★</span>
          <div class="hidden md:flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neo-green border border-neo-black inline-block"></span>
            <span>Uji Efektivitas N-Gain</span>
          </div>
          <span class="hidden md:inline">★</span>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span>
            <span>Realtime Firestore</span>
          </div>
        </div>
      </div>

      <!-- 2. Main Footer Body: 3 Structured Columns -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          <!-- Col 1: Identity & Description (5 cols) -->
          <div class="md:col-span-5 space-y-3.5">
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 sm:w-12 sm:h-12 bg-neo-yellow border-3 border-neo-bg shadow-[3px_3px_0px_0px_#f8f8f2] flex items-center justify-center font-display text-2xl text-neo-black shrink-0"
              >
                GS
              </div>
              <div>
                <span class="font-display text-2xl sm:text-3xl tracking-wide uppercase block text-neo-yellow leading-none">
                  Pre & Post Test
                </span>
                <span class="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neo-bg/70 block mt-0.5">
                  Portfolio Digital Assessment Platform
                </span>
              </div>
            </div>

            <p class="text-xs sm:text-sm text-neo-bg/80 leading-relaxed font-normal">
              Platform evaluasi diagnostik dan sumatif berbasis web untuk mengukur peningkatan kompetensi, penguasaan materi, serta kesiapan unjuk kerja website portfolio digital siswa dengan Google Sites.
            </p>

            <!-- Retro Pill Badges -->
            <div class="flex flex-wrap gap-2 pt-1">
              <span class="inline-flex items-center gap-1 bg-neo-pink text-neo-black border-2 border-neo-bg px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_0px_#f8f8f2]">
                <span class="material-symbols-outlined text-[13px]">palette</span>
                Google Sites
              </span>
              <span class="inline-flex items-center gap-1 bg-neo-blue text-neo-black border-2 border-neo-bg px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_0px_#f8f8f2]">
                <span class="material-symbols-outlined text-[13px]">verified</span>
                Proof of Work
              </span>
              <span class="inline-flex items-center gap-1 bg-neo-green text-neo-black border-2 border-neo-bg px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_0px_#f8f8f2]">
                <span class="material-symbols-outlined text-[13px]">trending_up</span>
                N-Gain Score
              </span>
            </div>
          </div>

          <!-- Col 2: Navigasi Cepat (3 cols) -->
          <div class="md:col-span-3 space-y-3">
            <div class="flex items-center gap-2 border-b-2 border-neo-bg/30 pb-2">
              <span class="material-symbols-outlined text-neo-yellow text-lg">explore</span>
              <h3 class="font-display text-lg uppercase tracking-wider text-neo-yellow">
                Navigasi Cepat
              </h3>
            </div>
            <ul class="space-y-2 text-xs">
              <li>
                <router-link
                  to="/"
                  class="flex items-center gap-2 text-neo-bg/85 hover:text-neo-yellow transition-colors group"
                >
                  <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">quiz</span>
                  <span>Halaman Ujian Peserta</span>
                </router-link>
              </li>
              <li>
                <router-link
                  to="/admin/dashboard"
                  class="flex items-center gap-2 text-neo-bg/85 hover:text-neo-yellow transition-colors group"
                >
                  <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">bar_chart</span>
                  <span>Hasil & Rekap Nilai Siswa</span>
                </router-link>
              </li>
              <li>
                <router-link
                  to="/admin/analytics"
                  class="flex items-center gap-2 text-neo-bg/85 hover:text-neo-yellow transition-colors group"
                >
                  <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">analytics</span>
                  <span>Laporan (PDF & Excel)</span>
                </router-link>
              </li>
              <li>
                <router-link
                  to="/admin/questions"
                  class="flex items-center gap-2 text-neo-bg/85 hover:text-neo-yellow transition-colors group"
                >
                  <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">edit_note</span>
                  <span>Bank Soal (12 Butir)</span>
                </router-link>
              </li>
              <li>
                <router-link
                  to="/admin/settings"
                  class="flex items-center gap-2 text-neo-bg/85 hover:text-neo-yellow transition-colors group"
                >
                  <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">settings</span>
                  <span>Kontrol Sesi & QR Proyektor</span>
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Col 3: Status Sesi & Spesifikasi Sistem (4 cols) -->
          <div class="md:col-span-4 space-y-3">
            <div class="flex items-center gap-2 border-b-2 border-neo-bg/30 pb-2">
              <span class="material-symbols-outlined text-neo-yellow text-lg">sensors</span>
              <h3 class="font-display text-lg uppercase tracking-wider text-neo-yellow">
                Monitor Sistem & Sesi
              </h3>
            </div>

            <!-- Card Status Sesi Aktif -->
            <div class="bg-white/5 border-2 border-neo-bg/30 p-3.5 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-mono uppercase text-neo-bg/70">Sesi Ujian Aktif:</span>
                <span
                  :class="[
                    'px-2 py-0.5 text-[11px] font-mono font-bold uppercase border-2 border-neo-black',
                    userStore.status_tes_aktif === 'Pre-Test' ? 'bg-neo-pink text-neo-black' :
                    userStore.status_tes_aktif === 'Post-Test' ? 'bg-neo-blue text-neo-black' :
                    'bg-white text-neo-black'
                  ]"
                >
                  ● {{ userStore.status_tes_aktif }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-neo-bg/80 pt-1.5 border-t border-neo-bg/20">
                <span class="font-mono">Database Server:</span>
                <span class="text-neo-green font-bold flex items-center gap-1 font-mono">
                  <span class="material-symbols-outlined text-xs">cloud_done</span>
                  Firestore Live Sync
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-neo-bg/80 pt-1.5 border-t border-neo-bg/20">
                <span class="font-mono">Komposisi Instrumen:</span>
                <span class="font-medium">7 PG (70pt) + 5 Praktik (30pt)</span>
              </div>
            </div>

            <p class="text-[11px] text-neo-bg/60 leading-relaxed italic">
              Dilengkapi perhitungan N-Gain otomatis, ekspor multi-sheet Excel, cetak laporan PDF resmi, dan proyeksi QR code kelas.
            </p>
          </div>
        </div>
      </div>

      <!-- 3. Bottom Bar: Copyright & Back to Top -->
      <div class="border-t-2 border-neo-bg/20 bg-black/40 py-3.5">
        <div
          class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-center sm:text-left"
        >
          <div class="flex items-center gap-2 text-neo-bg/80 flex-wrap justify-center sm:justify-start">
            <span class="font-mono font-bold text-neo-yellow">© 2026</span>
            <span>Workshop Pembuatan Website Portfolio dengan Google Sites</span>
            <span class="hidden sm:inline text-neo-bg/40">•</span>
            <span class="text-neo-bg/60">Hak Cipta Dilindungi</span>
          </div>

          <!-- Tombol Ke Atas (Smooth Scroll) -->
          <button
            @click="scrollToTop"
            class="px-3 py-1.5 bg-neo-yellow text-neo-black border-2 border-neo-bg font-bold font-mono text-[11px] uppercase tracking-wider shadow-[2px_2px_0px_0px_#f8f8f2] hover:bg-white hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Kembali ke bagian atas halaman"
          >
            <span class="material-symbols-outlined text-sm">arrow_upward</span>
            <span>Ke Atas</span>
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
