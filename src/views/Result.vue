<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import confetti from 'canvas-confetti'

const router = useRouter()
const userStore = useUserStore()

const result = computed(() => userStore.lastResult)

const triggerConfetti = (isManual = false) => {
  const skor = result.value?.skor_total || 0
  const colors = ['#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff5555']

  if (skor >= 85 || isManual) {
    // Ledakan Spektakuler Ganda (Meriam Kiri & Kanan)
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors,
      scalar: 1.2,
    })

    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.7 },
        colors,
      })
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.7 },
        colors,
      })
    }, 250)
  } else if (skor >= 70) {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.65 },
      colors,
    })
  } else {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 },
      colors,
    })
  }
}

onMounted(() => {
  // Jika tidak ada data hasil ujian, arahkan kembali ke Beranda
  if (!userStore.lastResult && !userStore.nama) {
    router.replace('/')
    return
  }

  // Tembakkan konfeti otomatis setelah halaman termuat
  setTimeout(() => {
    triggerConfetti(false)
  }, 400)
})

const predikat = computed(() => {
  const skor = result.value?.skor_total || 0
  if (skor >= 85) {
    return {
      label: 'SANGAT KOMPETEN (EXCELLENT)',
      color: 'bg-neo-green',
      pesan: 'Pemahaman teoretis dan penguasaan praktik pembuatan website portfolio dengan Google Sites Anda berada pada tingkat istimewa!',
    }
  } else if (skor >= 70) {
    return {
      label: 'KOMPETEN (GOOD)',
      color: 'bg-neo-blue',
      pesan: 'Anda telah menguasai kompetensi dasar pembuatan website portfolio Google Sites dengan baik. Terus kembangkan kreasi artefak digital Anda.',
    }
  } else {
    return {
      label: 'PERLU PENGUATAN (NEED IMPROVEMENT)',
      color: 'bg-neo-yellow',
      pesan: 'Disarankan untuk menelaah kembali materi workshop pembuatan website portfolio dengan Google Sites serta melatih kembali tata letak artefak.',
    }
  }
})

const handleKembali = () => {
  userStore.resetPeserta()
  router.push('/')
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5 sm:space-y-8">
    <!-- Success Banner -->
    <div class="bg-neo-green border-3 border-neo-black p-3 sm:p-4 text-center font-bold text-xs sm:text-sm uppercase tracking-wider shadow-neo flex items-center justify-center gap-1.5">
      <span class="material-symbols-outlined text-lg font-bold">check_circle</span>
      <span>Evaluasi Berhasil Diselesaikan!</span>
    </div>

    <!-- Main Score Card -->
    <div class="bg-white border-3 border-neo-black p-4 sm:p-8 md:p-10 shadow-neo text-center space-y-5 sm:space-y-6">
      <div class="space-y-2">
        <span class="inline-block bg-neo-pink text-neo-black px-2.5 py-1 font-mono text-[10px] sm:text-xs font-bold uppercase border-2 border-neo-black shadow-neo">
          Hasil {{ result?.jenis_tes || userStore.status_tes_aktif }} • Workshop Google Sites
        </span>
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-neo-black">
          Skor Akhir Evaluasi
        </h1>
        <p class="text-xs sm:text-sm font-medium text-neo-black/70">
          Peserta: <strong>{{ result?.nama || userStore.nama }}</strong> • Kelas: <strong>{{ result?.kelas || userStore.kelas }}</strong>
        </p>
      </div>

      <!-- Giant Neo Brutalism Score Badge -->
      <div class="max-w-xs mx-auto bg-neo-yellow border-3 border-neo-black p-4 sm:p-6 shadow-neo transform -rotate-1 hover:rotate-0 transition-transform">
        <span class="block text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-neo-black/70">
          Total Nilai (Maks 100)
        </span>
        <div class="font-display text-6xl sm:text-7xl md:text-8xl text-neo-black leading-none my-1.5 sm:my-2">
          {{ result?.skor_total ?? 0 }}
        </div>
        <span class="inline-block bg-neo-black text-neo-bg px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          Poin Akhir
        </span>
      </div>

      <!-- Predikat Badge -->
      <div :class="['p-3.5 sm:p-4 border-3 border-neo-black font-bold text-xs sm:text-sm shadow-neo', predikat.color]">
        <div class="font-display text-xl sm:text-2xl uppercase tracking-wider mb-1">
          {{ predikat.label }}
        </div>
        <p class="text-xs sm:text-sm font-sans font-medium">
          {{ predikat.pesan }}
        </p>
      </div>

      <!-- Detailed Breakdown Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-left pt-2 sm:pt-4">
        <!-- Pilihan Ganda -->
        <div class="border-3 border-neo-black bg-neo-bg p-4 sm:p-5 shadow-neo">
          <div class="flex items-center justify-between mb-2">
            <span class="font-display text-lg sm:text-xl uppercase tracking-wider">Pilihan Ganda</span>
            <span class="bg-neo-pink text-neo-black px-2 py-0.5 border border-neo-black text-[11px] sm:text-xs font-mono font-bold">
              10 Poin / Soal
            </span>
          </div>
          <div class="font-display text-3xl sm:text-4xl text-neo-black mb-1">
            {{ result?.skor_pg ?? 0 }} <span class="text-lg sm:text-xl font-sans text-neo-black/60">/ 70</span>
          </div>
          <p class="text-xs font-medium text-neo-black/80">
            Menjawab benar <strong>{{ result?.benar_pg ?? 0 }}</strong> dari 7 butir pertanyaan konsep portofolio.
          </p>
        </div>

        <!-- Praktik -->
        <div class="border-3 border-neo-black bg-neo-bg p-4 sm:p-5 shadow-neo">
          <div class="flex items-center justify-between mb-2">
            <span class="font-display text-lg sm:text-xl uppercase tracking-wider">Penilaian Diri (Praktik)</span>
            <span class="bg-neo-blue text-neo-black px-2 py-0.5 border border-neo-black text-[11px] sm:text-xs font-mono font-bold">
              6 Poin / 'Bisa'
            </span>
          </div>
          <div class="font-display text-3xl sm:text-4xl text-neo-black mb-1">
            {{ result?.skor_praktik ?? 0 }} <span class="text-lg sm:text-xl font-sans text-neo-black/60">/ 30</span>
          </div>
          <p class="text-xs font-medium text-neo-black/80">
            Menyatakan 'Bisa' pada <strong>{{ result?.bisa_praktik ?? 0 }}</strong> dari 5 butir unjuk kerja portofolio.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
        <button
          @click="triggerConfetti(true)"
          class="neo-button bg-neo-yellow py-3 px-5 sm:px-6 font-display text-lg sm:text-xl uppercase tracking-wider text-neo-black cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-2xl">celebration</span>
          <span>Tembakkan Konfeti!</span>
        </button>

        <button
          @click="handleKembali"
          class="neo-button bg-neo-pink py-3 px-6 sm:px-8 font-display text-lg sm:text-xl uppercase tracking-wider text-neo-black cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-xl">arrow_back</span>
          <span>Selesai & Kembali ke Utama</span>
        </button>
      </div>
    </div>
  </div>
</template>
