<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminNav from '../../components/AdminNav.vue'
import { useUserStore } from '../../stores/userStore'
import { useAuthStore } from '../../stores/authStore'
import { runSeeder } from '../../utils/seeder'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()

const isUpdating = ref(false)
const notification = ref(null)
const seederLoading = ref(false)

onMounted(() => {
  userStore.initPengaturanListener()
})

const currentStatus = computed(() => userStore.status_tes_aktif)

const updateStatus = async (statusBaru) => {
  isUpdating.value = true
  notification.value = null

  try {
    await userStore.setStatusTesAktif(statusBaru)
    notification.value = {
      type: 'success',
      message: `Status tes berhasil diperbarui menjadi: "${statusBaru}" di Firestore collection 'pengaturan'`,
    }
  } catch (err) {
    notification.value = {
      type: 'error',
      message: `Gagal memperbarui status: ${err.message}`,
    }
  } finally {
    isUpdating.value = false
  }
}

const handleReSeed = async () => {
  seederLoading.value = true
  notification.value = null
  try {
    const res = await runSeeder()
    notification.value = {
      type: 'success',
      message: `Berhasil re-seed! 1 Dokumen pengaturan dan ${res.total_soal} soal siap di Firestore.`,
    }
  } catch (err) {
    notification.value = {
      type: 'error',
      message: `Gagal re-seed: ${err.message}`,
    }
  } finally {
    seederLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <AdminNav title="PENGATURAN SESI" />

    <!-- Main Header & Status Overview -->
    <header class="bg-neo-yellow border-3 border-neo-black p-6 sm:p-10 shadow-neo space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="bg-neo-black text-neo-bg px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider">
          Workshop Pembuatan Website Portfolio dengan Google Sites
        </span>
      </div>

      <h1 class="font-display text-4xl sm:text-6xl uppercase tracking-wider text-neo-black leading-none">
        Kontrol Sesi Pre & Post Test
      </h1>
      <p class="text-sm sm:text-base font-medium text-neo-black/90 max-w-2xl">
        Atur pembukaan sesi Pre-Test, Post-Test, atau Ditutup untuk peserta workshop Google Sites secara realtime.
      </p>

      <!-- Active Status Display Badge -->
      <div class="pt-2 flex items-center gap-4 flex-wrap">
        <span class="font-bold text-sm uppercase tracking-wider">Status Berjalan Saat Ini:</span>
        <div
          :class="[
            'px-5 py-2 font-display text-2xl sm:text-3xl uppercase tracking-wider border-3 border-neo-black shadow-neo inline-flex items-center gap-2',
            currentStatus === 'Pre-Test' ? 'bg-neo-pink text-neo-black' :
            currentStatus === 'Post-Test' ? 'bg-neo-blue text-neo-black' : 'bg-white text-neo-black'
          ]"
        >
          <span class="w-3.5 h-3.5 rounded-full border-2 border-neo-black animate-pulse" :class="currentStatus === 'Ditutup' ? 'bg-red-500' : 'bg-green-500'"></span>
          {{ currentStatus }}
        </div>
      </div>
    </header>

    <!-- Notification Alert -->
    <div
      v-if="notification"
      :class="[
        'p-4 border-3 border-neo-black font-bold text-sm shadow-neo flex items-center justify-between gap-4',
        notification.type === 'success' ? 'bg-neo-green text-neo-black' : 'bg-[#ff6b6b] text-white'
      ]"
    >
      <span>{{ notification.message }}</span>
      <button @click="notification = null" class="font-mono font-black text-base cursor-pointer">✕</button>
    </div>

    <!-- 3 Big Neo Brutalism Action Buttons -->
    <section class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="w-3.5 h-3.5 bg-neo-pink border-2 border-neo-black"></span>
        <h2 class="font-display text-2xl sm:text-3xl uppercase tracking-wider">
          Pilih Status Sesi (3 Tombol Neo Brutalism)
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Tombol 1: Pink (Pre-Test) -->
        <button
          @click="updateStatus('Pre-Test')"
          :disabled="isUpdating"
          :class="[
            'p-8 border-3 border-neo-black bg-neo-pink text-neo-black shadow-neo text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[220px]',
            currentStatus === 'Pre-Test' ? 'ring-4 ring-neo-black translate-x-1 translate-y-1' : 'hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-1 hover:-translate-y-1'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="bg-neo-black text-neo-bg px-2.5 py-0.5 font-mono text-xs font-bold uppercase">
                WARNA PINK
              </span>
              <span v-if="currentStatus === 'Pre-Test'" class="bg-white text-neo-black px-2 py-0.5 text-xs font-bold border border-neo-black">
                ★ AKTIF
              </span>
            </div>
            <h3 class="font-display text-4xl sm:text-5xl uppercase tracking-wider leading-none">
              Pre-Test
            </h3>
            <p class="text-xs font-medium mt-3 leading-relaxed">
              Buka asesmen diagnostik awal bagi peserta sebelum materi/praktik portofolio dimulai.
            </p>
          </div>
          <div class="mt-4 pt-4 border-t-2 border-neo-black font-display text-xl uppercase tracking-wider flex items-center justify-between">
            <span>Set Pre-Test</span>
            <span>➔</span>
          </div>
        </button>

        <!-- Tombol 2: Biru (Post-Test) -->
        <button
          @click="updateStatus('Post-Test')"
          :disabled="isUpdating"
          :class="[
            'p-8 border-3 border-neo-black bg-neo-blue text-neo-black shadow-neo text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[220px]',
            currentStatus === 'Post-Test' ? 'ring-4 ring-neo-black translate-x-1 translate-y-1' : 'hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-1 hover:-translate-y-1'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="bg-neo-black text-neo-bg px-2.5 py-0.5 font-mono text-xs font-bold uppercase">
                WARNA BIRU
              </span>
              <span v-if="currentStatus === 'Post-Test'" class="bg-white text-neo-black px-2 py-0.5 text-xs font-bold border border-neo-black">
                ★ AKTIF
              </span>
            </div>
            <h3 class="font-display text-4xl sm:text-5xl uppercase tracking-wider leading-none">
              Post-Test
            </h3>
            <p class="text-xs font-medium mt-3 leading-relaxed">
              Buka asesmen akhir untuk mengukur peningkatan capaian kompetensi portofolio peserta.
            </p>
          </div>
          <div class="mt-4 pt-4 border-t-2 border-neo-black font-display text-xl uppercase tracking-wider flex items-center justify-between">
            <span>Set Post-Test</span>
            <span>➔</span>
          </div>
        </button>

        <!-- Tombol 3: Kuning (Ditutup) -->
        <button
          @click="updateStatus('Ditutup')"
          :disabled="isUpdating"
          :class="[
            'p-8 border-3 border-neo-black bg-neo-yellow text-neo-black shadow-neo text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[220px]',
            currentStatus === 'Ditutup' ? 'ring-4 ring-neo-black translate-x-1 translate-y-1' : 'hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-1 hover:-translate-y-1'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="bg-neo-black text-neo-bg px-2.5 py-0.5 font-mono text-xs font-bold uppercase">
                WARNA KUNING
              </span>
              <span v-if="currentStatus === 'Ditutup'" class="bg-white text-neo-black px-2 py-0.5 text-xs font-bold border border-neo-black">
                ★ AKTIF
              </span>
            </div>
            <h3 class="font-display text-4xl sm:text-5xl uppercase tracking-wider leading-none">
              Ditutup
            </h3>
            <p class="text-xs font-medium mt-3 leading-relaxed">
              Kunci akses ujian. Tombol di halaman peserta akan dinonaktifkan (disabled) secara otomatis.
            </p>
          </div>
          <div class="mt-4 pt-4 border-t-2 border-neo-black font-display text-xl uppercase tracking-wider flex items-center justify-between">
            <span>Kunci / Tutup Tes</span>
            <span>🔒</span>
          </div>
        </button>
      </div>
    </section>

    <!-- Additional Tools Card -->
    <div class="bg-white border-3 border-neo-black p-6 shadow-neo flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 class="font-display text-2xl uppercase tracking-wider">Pemeliharaan Data Bank Soal</h4>
        <p class="text-xs font-medium text-neo-black/70">
          Sinkronkan kembali 12 butir instrumen soal portofolio ke koleksi <code>bank_soal</code> Firestore.
        </p>
      </div>
      <button
        @click="handleReSeed"
        :disabled="seederLoading"
        class="border-3 border-neo-black bg-neo-bg px-5 py-2.5 text-xs font-bold uppercase shadow-neo hover:bg-neo-yellow transition-all cursor-pointer shrink-0"
      >
        {{ seederLoading ? 'Memproses Seeding...' : '⚡ Re-seed Bank Soal' }}
      </button>
    </div>
  </div>
</template>
