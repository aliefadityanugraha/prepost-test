<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const inputNama = ref(userStore.nama || '')
const inputKelas = ref(userStore.kelas || '')
const formError = ref('')

onMounted(() => {
  userStore.initPengaturanListener()
})

const isTestClosed = computed(() => {
  return userStore.status_tes_aktif === 'Ditutup'
})

const isFormValid = computed(() => {
  return inputNama.value.trim().length > 0 && inputKelas.value.trim().length > 0
})

const handleStartTest = () => {
  formError.value = ''

  if (!inputNama.value.trim() || !inputKelas.value.trim()) {
    formError.value = 'Silakan isi Nama Lengkap dan Kelas terlebih dahulu!'
    return
  }

  if (isTestClosed.value) {
    formError.value = 'Mohon maaf, sesi tes saat ini berstatus DITUTUP oleh instruktur.'
    return
  }

  userStore.setPeserta(inputNama.value, inputKelas.value)
  router.push('/test')
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <!-- Header Hero -->
    <header class="text-center space-y-3">
      <div class="inline-block bg-neo-yellow border-3 border-neo-black px-4 py-1.5 font-bold text-xs uppercase tracking-wider shadow-neo">
        Workshop Pembuatan Website Portfolio dengan Google Sites
      </div>
      <h1 class="font-display text-5xl md:text-7xl uppercase tracking-wider text-neo-black leading-none">
        Pre & Post Test
      </h1>
      <p class="text-sm md:text-base font-medium text-neo-black/80 max-w-xl mx-auto">
        Ukur tingkat pemahaman konsep dan penguasaan praktik pembuatan website portfolio digital Anda menggunakan Google Sites.
      </p>
    </header>

    <!-- Main Card Form -->
    <div class="bg-white border-3 border-neo-black p-6 sm:p-10 shadow-neo space-y-6">
      <!-- Status Badge Sesi -->
      <div class="flex items-center justify-between border-b-3 border-neo-black pb-4 flex-wrap gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-neo-black/70">
          Status Sesi:
        </span>
        <div class="flex items-center gap-2">
          <span
            :class="[
              'px-3 py-1 font-display text-xl uppercase tracking-wider border-2 border-neo-black shadow-neo inline-block',
              userStore.status_tes_aktif === 'Ditutup' ? 'bg-[#ff6b6b] text-white' :
              userStore.status_tes_aktif === 'Pre-Test' ? 'bg-neo-blue text-neo-black' : 'bg-neo-green text-neo-black'
            ]"
          >
            {{ userStore.status_tes_aktif }}
          </span>
          <span v-if="userStore.isLoadingStatus" class="text-xs font-mono font-bold animate-pulse">
            (Sinkronisasi...)
          </span>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="formError" class="p-4 bg-[#ff6b6b] text-white border-3 border-neo-black font-bold text-xs shadow-neo">
        ⚠️ {{ formError }}
      </div>

      <!-- Form Input -->
      <form @submit.prevent="handleStartTest" class="space-y-5">
        <!-- Input Nama -->
        <div class="space-y-1.5">
          <label for="nama" class="block font-bold text-xs uppercase tracking-wider text-neo-black">
            Nama Lengkap <span class="text-neo-pink">*</span>
          </label>
          <input
            id="nama"
            v-model="inputNama"
            type="text"
            placeholder="Contoh: Budi Pratama"
            required
            class="w-full px-4 py-3 bg-neo-bg border-3 border-neo-black text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
          />
        </div>

        <!-- Input Kelas -->
        <div class="space-y-1.5">
          <label for="kelas" class="block font-bold text-xs uppercase tracking-wider text-neo-black">
            Kelas / Kelompok <span class="text-neo-pink">*</span>
          </label>
          <input
            id="kelas"
            v-model="inputKelas"
            type="text"
            placeholder="Contoh: XII RPL 1"
            required
            class="w-full px-4 py-3 bg-neo-bg border-3 border-neo-black text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
          />
        </div>

        <!-- Tombol Aksi -->
        <div class="pt-2">
          <button
            type="submit"
            :disabled="isTestClosed || !isFormValid"
            :class="[
              'w-full py-4 px-6 text-center font-display text-2xl uppercase tracking-wider border-3 border-neo-black transition-all duration-150',
              isTestClosed || !isFormValid
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                : 'bg-neo-pink text-neo-black shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 cursor-pointer'
            ]"
          >
            <span v-if="isTestClosed">🔒 Sesi Ditutup</span>
            <span v-else>Mulai {{ userStore.status_tes_aktif }} ➔</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
