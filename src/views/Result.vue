<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import confetti from 'canvas-confetti'

const router = useRouter()
const userStore = useUserStore()

const result = computed(() => userStore.lastResult)

const isRetrying = ref(false)
const syncSuccessMessage = ref('')
const syncErrorMessage = ref('')
const isCopied = ref(false)

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

const displaySkorTotal = computed(() => {
  const rawTotal = Number(result.value?.skor_total) || 0
  const rawPg = Number(result.value?.skor_pg) || 0
  const rawPr = Number(result.value?.skor_praktik) || 0
  if (rawTotal <= 100 && rawPg <= 70 && rawPr <= 30) return rawTotal
  // Normalisasi jika ada data lama yang melebihi 100
  const totalPg = Number(result.value?.total_pg) || 15
  const totalPr = Number(result.value?.total_praktik) || 5
  const benarPg = result.value?.benar_pg !== undefined ? Number(result.value.benar_pg) : Math.min(totalPg, Math.round(rawPg / 10))
  const bisaPr = result.value?.bisa_praktik !== undefined ? Number(result.value.bisa_praktik) : Math.min(totalPr, Math.round(rawPr / 6))
  const pg = Math.min(70, Math.round((benarPg / totalPg) * 70))
  const pr = Math.min(30, Math.round((bisaPr / totalPr) * 30))
  return Math.min(100, Math.max(0, pg + pr))
})

const displaySkorPg = computed(() => {
  const rawPg = Number(result.value?.skor_pg) || 0
  if (rawPg <= 70) return rawPg
  const totalPg = Number(result.value?.total_pg) || 15
  const benarPg = result.value?.benar_pg !== undefined ? Number(result.value.benar_pg) : Math.min(totalPg, Math.round(rawPg / 10))
  return Math.min(70, Math.round((benarPg / totalPg) * 70))
})

const displaySkorPraktik = computed(() => {
  const rawPr = Number(result.value?.skor_praktik) || 0
  if (rawPr <= 30) return rawPr
  const totalPr = Number(result.value?.total_praktik) || 5
  const bisaPr = result.value?.bisa_praktik !== undefined ? Number(result.value.bisa_praktik) : Math.min(totalPr, Math.round(rawPr / 6))
  return Math.min(30, Math.round((bisaPr / totalPr) * 30))
})

const predikat = computed(() => {
  const skor = displaySkorTotal.value
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

// Retry sync ke Firestore Cloud jika sebelumnya offline/timeout
const handleRetrySync = async () => {
  if (!result.value) return
  isRetrying.value = true
  syncSuccessMessage.value = ''
  syncErrorMessage.value = ''

  try {
    const payload = {
      nama: result.value.nama,
      kelas: result.value.kelas,
      jenis_tes: result.value.jenis_tes,
      skor_pg: result.value.skor_pg,
      benar_pg: result.value.benar_pg,
      total_pg: result.value.total_pg,
      skor_praktik: result.value.skor_praktik,
      bisa_praktik: result.value.bisa_praktik,
      total_praktik: result.value.total_praktik,
      skor_total: result.value.skor_total,
      jawaban: result.value.jawaban,
      durasi_detik: result.value.durasi_detik || 0,
      durasi_format: result.value.durasi_format || '-',
      waktu_selesai: result.value.waktu_selesai || new Date().toISOString(),
      created_at: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'evaluasi_peserta'), payload)
    
    // Perbarui state di store
    userStore.setLastResult({
      ...result.value,
      id: docRef.id,
      isCloudSaved: true,
      cloudError: null,
    })

    syncSuccessMessage.value = 'Data evaluasi berhasil terkirim dan tersinkronisasi ke server instruktur!'
  } catch (err) {
    console.error('Gagal retry sync:', err)
    syncErrorMessage.value = `Gagal mengirim: ${err.message}. Periksa koneksi internet Anda dan coba lagi.`
  } finally {
    isRetrying.value = false
  }
}

// Salin ringkasan teks untuk laporan chat/WhatsApp ke guru
const handleCopySummary = async () => {
  const res = result.value
  const text = `🎓 BUKTI SELESAI EVALUASI WORKSHOP GOOGLE SITES
Nama: ${res?.nama || userStore.nama}
Kelas: ${res?.kelas || userStore.kelas}
Sesi: ${res?.jenis_tes || userStore.status_tes_aktif}
Total Skor: ${res?.skor_total ?? 0}/100 Poin
- Nilai Pilihan Ganda: ${res?.skor_pg ?? 0}/70 (${res?.benar_pg ?? 0}/7 Benar)
- Nilai Praktik Mandiri: ${res?.skor_praktik ?? 0}/30 (${res?.bisa_praktik ?? 0}/5 Bisa)
Predikat: ${predikat.value.label}
Durasi Pengerjaan: ${res?.durasi_format || '-'}
Waktu Selesai: ${new Date(res?.waktu_selesai || Date.now()).toLocaleString('id-ID')}`

  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 3000)
  } catch (err) {
    console.warn('Gagal salin ke clipboard:', err)
  }
}

// Cetak Bukti Nilai Resmi (Print Slip)
const handlePrint = () => {
  window.print()
}

const handleKembali = () => {
  userStore.resetPeserta()
  router.push('/')
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5 sm:space-y-6">
    <!-- Success Banner -->
    <div class="bg-neo-green border-3 border-neo-black rounded-xl p-3 sm:p-4 text-center font-bold text-xs sm:text-sm uppercase tracking-wider shadow-neo flex items-center justify-center gap-1.5 no-print">
      <span class="material-symbols-outlined text-lg font-bold">check_circle</span>
      <span>Evaluasi Berhasil Diselesaikan!</span>
    </div>

    <!-- Alert Status Sinkronisasi Cloud: Warning jika masih lokal -->
    <div
      v-if="result && !result.isCloudSaved && !syncSuccessMessage"
      class="bg-[#ff5555] text-white border-3 border-neo-black rounded-xl p-4 shadow-neo flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print"
    >
      <div class="flex items-start gap-2.5">
        <span class="material-symbols-outlined text-3xl shrink-0">cloud_off</span>
        <div>
          <h3 class="font-display text-lg uppercase tracking-wider leading-tight">
            Nilai Belum Tersimpan di Server Instruktur
          </h3>
          <p class="text-xs text-white/95 mt-0.5 leading-relaxed">
            Data Anda saat ini hanya tersimpan di perangkat lokal karena gangguan koneksi saat pengiriman. Harap klik tombol di samping sebelum menutup browser.
          </p>
        </div>
      </div>
      <button
        @click="handleRetrySync"
        :disabled="isRetrying"
        class="px-4 py-2.5 bg-neo-yellow text-neo-black border-2 border-black rounded-lg font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-white active:translate-y-0.5 cursor-pointer shrink-0 disabled:opacity-60 flex items-center justify-center gap-1.5"
      >
        <span v-if="isRetrying" class="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>
        <span>{{ isRetrying ? 'Menyinkronkan...' : 'Kirim Ulang ke Server' }}</span>
      </button>
    </div>

    <!-- Toast Sukses Sinkronisasi Ulang -->
    <div
      v-if="syncSuccessMessage"
      class="bg-neo-green text-neo-black border-3 border-neo-black rounded-xl p-3.5 shadow-neo font-bold text-xs sm:text-sm flex items-center gap-2 no-print"
    >
      <span class="material-symbols-outlined text-xl">cloud_done</span>
      <span>{{ syncSuccessMessage }}</span>
    </div>

    <!-- Toast Error Sinkronisasi Ulang -->
    <div
      v-if="syncErrorMessage"
      class="bg-[#ff5555] text-white border-3 border-neo-black rounded-xl p-3.5 shadow-neo font-bold text-xs sm:text-sm flex items-center gap-2 no-print"
    >
      <span class="material-symbols-outlined text-xl">error</span>
      <span>{{ syncErrorMessage }}</span>
    </div>

    <!-- Main Score Card -->
    <div id="printable-certificate" class="bg-white border-3 border-neo-black rounded-2xl p-4 sm:p-8 md:p-10 shadow-neo text-center space-y-5 sm:space-y-6">
      <!-- Watermark / Header Slip Cetak (Hanya tampil saat print) -->
      <div class="hidden print:block border-b-2 border-black pb-3 text-left space-y-1 mb-4">
        <h2 class="font-display text-2xl uppercase">Workshop Pembuatan Website Portfolio dengan Google Sites</h2>
        <p class="text-xs font-mono text-gray-700">Bukti Hasil Asesmen Peserta • Dicetak pada: {{ new Date().toLocaleString('id-ID') }}</p>
      </div>

      <div class="space-y-2">
        <span class="inline-block bg-neo-pink text-neo-black px-2.5 py-1 font-mono text-[10px] sm:text-xs font-bold uppercase border-2 border-neo-black rounded-lg shadow-neo">
          Hasil {{ result?.jenis_tes || userStore.status_tes_aktif }} • Workshop Google Sites
        </span>
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-neo-black">
          Skor Akhir Evaluasi
        </h1>
        <p class="text-xs sm:text-sm font-medium text-neo-black/70">
          Peserta: <strong class="text-neo-black underline">{{ result?.nama || userStore.nama }}</strong> • Kelas: <strong>{{ result?.kelas || userStore.kelas }}</strong>
        </p>
        <p v-if="result?.durasi_format" class="text-[11px] font-mono text-neo-black/60">
          Waktu Pengerjaan: <strong>{{ result.durasi_format }}</strong>
        </p>
      </div>

      <!-- Giant Neo Brutalism Score Badge -->
      <div class="max-w-xs mx-auto bg-neo-yellow border-3 border-neo-black rounded-2xl p-4 sm:p-6 shadow-neo transform -rotate-1 hover:rotate-0 transition-transform">
        <span class="block text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-neo-black/70">
          Total Nilai (Maks 100)
        </span>
        <div class="font-display text-6xl sm:text-7xl md:text-8xl text-neo-black leading-none my-1.5 sm:my-2">
          {{ displaySkorTotal }}
        </div>
        <span class="inline-block bg-neo-black text-neo-bg px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-md">
          Poin Akhir
        </span>
      </div>

      <!-- Predikat Badge -->
      <div :class="['p-3.5 sm:p-4 border-3 border-neo-black rounded-xl font-bold text-xs sm:text-sm shadow-neo', predikat.color]">
        <div class="font-display text-xl sm:text-2xl uppercase tracking-wider mb-1">
          {{ predikat.label }}
        </div>
        <p class="text-xs sm:text-sm font-sans font-medium">
          {{ predikat.pesan }}
        </p>
      </div>

      <!-- Detailed Breakdown Grid with Visual Progress Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-left pt-2 sm:pt-4">
        <!-- Pilihan Ganda -->
        <div class="border-3 border-neo-black bg-neo-bg rounded-xl p-4 sm:p-5 shadow-neo space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-display text-lg sm:text-xl uppercase tracking-wider">Pilihan Ganda</span>
            <span class="bg-neo-pink text-neo-black px-2 py-0.5 border border-neo-black rounded-md text-[11px] sm:text-xs font-mono font-bold">
              Maks 70 Poin
            </span>
          </div>
          <div class="font-display text-3xl sm:text-4xl text-neo-black">
            {{ displaySkorPg }} <span class="text-lg sm:text-xl font-sans text-neo-black/60">/ 70</span>
          </div>
          <!-- Progress Bar PG -->
          <div class="h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
            <div
              class="h-full bg-neo-pink rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(100, Math.round((displaySkorPg / 70) * 100))}%` }"
            ></div>
          </div>
          <p class="text-xs font-medium text-neo-black/80">
            Menjawab benar <strong>{{ result?.benar_pg ?? 0 }}</strong> dari {{ result?.total_pg || 15 }} butir pertanyaan konsep portofolio.
          </p>
        </div>

        <!-- Praktik -->
        <div class="border-3 border-neo-black bg-neo-bg rounded-xl p-4 sm:p-5 shadow-neo space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-display text-lg sm:text-xl uppercase tracking-wider">Penilaian Diri (Praktik)</span>
            <span class="bg-neo-blue text-neo-black px-2 py-0.5 border border-neo-black rounded-md text-[11px] sm:text-xs font-mono font-bold">
              Maks 30 Poin
            </span>
          </div>
          <div class="font-display text-3xl sm:text-4xl text-neo-black">
            {{ displaySkorPraktik }} <span class="text-lg sm:text-xl font-sans text-neo-black/60">/ 30</span>
          </div>
          <!-- Progress Bar Praktik -->
          <div class="h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
            <div
              class="h-full bg-neo-blue rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(100, Math.round((displaySkorPraktik / 30) * 100))}%` }"
            ></div>
          </div>
          <p class="text-xs font-medium text-neo-black/80">
            Menyatakan 'Bisa' pada <strong>{{ result?.bisa_praktik ?? 0 }}</strong> dari {{ result?.total_praktik || 5 }} butir unjuk kerja portofolio.
          </p>
        </div>
      </div>

      <!-- Quick Share & Print Actions Ribbon -->
      <div class="flex flex-wrap items-center justify-center gap-2 pt-2 border-t-2 border-neo-black/20 no-print">
        <button
          type="button"
          @click="handleCopySummary"
          class="px-3.5 py-2 bg-white text-neo-black border-2 border-neo-black rounded-lg font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#282a36] hover:bg-neo-yellow active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span class="material-symbols-outlined text-base">{{ isCopied ? 'check' : 'content_copy' }}</span>
          <span>{{ isCopied ? 'Tersalin ke Clipboard!' : 'Salin Ringkasan Nilai' }}</span>
        </button>

        <button
          type="button"
          @click="handlePrint"
          class="px-3.5 py-2 bg-white text-neo-black border-2 border-neo-black rounded-lg font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#282a36] hover:bg-neo-blue active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span class="material-symbols-outlined text-base">print</span>
          <span>Cetak Bukti Nilai</span>
        </button>
      </div>

      <!-- Main Action Buttons -->
      <div class="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center no-print">
        <button
          @click="triggerConfetti(true)"
          class="neo-button bg-neo-yellow py-3 px-5 sm:px-6 font-display text-lg sm:text-xl uppercase tracking-wider text-neo-black cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl"
        >
          <span class="material-symbols-outlined text-2xl">celebration</span>
          <span>Tembakkan Konfeti!</span>
        </button>

        <button
          @click="handleKembali"
          class="neo-button bg-neo-pink py-3 px-6 sm:px-8 font-display text-lg sm:text-xl uppercase tracking-wider text-neo-black cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl"
        >
          <span class="material-symbols-outlined text-xl">arrow_back</span>
          <span>Selesai & Kembali ke Utama</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  #printable-certificate {
    border: 2px solid black !important;
    box-shadow: none !important;
    padding: 16px !important;
  }
}
</style>
