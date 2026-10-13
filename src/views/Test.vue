<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { db } from '../firebase'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { allBankSoal, dataSoalPreTest, dataSoalPostTest } from '../utils/seeder'
import { calculateScore } from '../utils/scoring'

const router = useRouter()
const userStore = useUserStore()

const soalList = ref([])
const jawaban = ref({})
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const validationErrors = ref([])

onMounted(async () => {
  // Validasi jika peserta belum mengisi nama atau sesi ditutup
  if (!userStore.nama || !userStore.kelas) {
    router.replace('/')
    return
  }
  if (userStore.status_tes_aktif === 'Ditutup') {
    router.replace('/')
    return
  }

  await fetchSoal()
})

const fetchSoal = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const activeTestType = userStore.status_tes_aktif // 'Pre-Test' | 'Post-Test'

  try {
    const querySnapshot = await getDocs(collection(db, 'bank_soal'))
    const fetched = []
    querySnapshot.forEach((docSnap) => {
      fetched.push({ id: docSnap.id, ...docSnap.data() })
    })

    let filtered = []
    if (fetched.length > 0) {
      // Filter soal yang cocok dengan sesi aktif
      filtered = fetched.filter(
        (soal) =>
          soal.jenis_tes === activeTestType ||
          soal.jenis_tes === 'Pre-Test & Post-Test' ||
          soal.jenis_tes === 'Semua'
      )
    }

    // Jika filter Firestore kosong (atau offline), gunakan dataset lokal spesifik
    if (filtered.length === 0) {
      const defaultData = activeTestType === 'Pre-Test' ? dataSoalPreTest : dataSoalPostTest
      filtered = [...defaultData]
    }

    // Urutkan soal berdasarkan field nomor
    soalList.value = filtered.sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0))
  } catch (err) {
    console.warn('Gagal fetch Firestore, menggunakan dataset lokal:', err)
    const defaultData = activeTestType === 'Pre-Test' ? dataSoalPreTest : dataSoalPostTest
    soalList.value = [...defaultData].sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0))
  } finally {
    isLoading.value = false
  }
}

// Menghitung progress pengisian
const totalSoal = computed(() => soalList.value.length)
const totalTerjawab = computed(() => Object.keys(jawaban.value).length)
const persentaseSelesai = computed(() => {
  if (totalSoal.value === 0) return 0
  return Math.round((totalTerjawab.value / totalSoal.value) * 100)
})

const selectOpsi = (nomorSoal, pilihan) => {
  jawaban.value[nomorSoal] = pilihan
  // Hapus dari daftar error validasi jika sudah dijawab
  validationErrors.value = validationErrors.value.filter((n) => n !== nomorSoal)
}

const handleSubmit = async () => {
  errorMessage.value = ''
  validationErrors.value = []

  // Validasi form: pastikan seluruh soal terjawab
  const belumDijawab = soalList.value
    .filter((soal) => jawaban.value[soal.nomor] === undefined || jawaban.value[soal.nomor] === null)
    .map((soal) => soal.nomor)

  if (belumDijawab.length > 0) {
    validationErrors.value = belumDijawab
    errorMessage.value = `Masih ada ${belumDijawab.length} butir soal yang belum Anda jawab (Soal No: ${belumDijawab.join(', ')}). Mohon lengkapi seluruh soal sebelum mengirim.`
    
    // Auto scroll ke soal pertama yang belum dijawab
    const firstUnansweredEl = document.getElementById(`soal-card-${belumDijawab[0]}`)
    if (firstUnansweredEl) {
      firstUnansweredEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  isSubmitting.value = true

  try {
    // 1. Hitung skor otomatis menggunakan pure function calculateScore
    const hasilSkor = calculateScore(soalList.value, jawaban.value)

    // 2. Siapkan payload dokumen untuk collection 'evaluasi_peserta'
    const payload = {
      nama: userStore.nama,
      kelas: userStore.kelas,
      jenis_tes: userStore.status_tes_aktif,
      skor_pg: hasilSkor.skor_pg,
      benar_pg: hasilSkor.benar_pg,
      total_pg: hasilSkor.total_pg,
      skor_praktik: hasilSkor.skor_praktik,
      bisa_praktik: hasilSkor.bisa_praktik,
      total_praktik: hasilSkor.total_praktik,
      skor_total: hasilSkor.skor_total,
      jawaban: jawaban.value,
      waktu_selesai: new Date().toISOString(),
      created_at: serverTimestamp(),
    }

    // 5. Simpan ke Firestore collection 'evaluasi_peserta' (Target Penyimpanan Utama)
    let docId = 'local_' + Date.now()
    let isCloudSaved = false
    let cloudError = null

    try {
      const firestoreSave = addDoc(collection(db, 'evaluasi_peserta'), payload)
      const timeoutFallback = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout: Server tidak merespons dalam 6 detik')), 6000)
      )
      const docRef = await Promise.race([firestoreSave, timeoutFallback])
      docId = docRef.id
      isCloudSaved = true
      console.log('✅ Evaluasi berhasil disimpan permanen ke Cloud Firestore (evaluasi_peserta):', docId)
    } catch (saveError) {
      cloudError = saveError?.message || 'Gagal menyimpan ke Firestore Cloud'
      console.warn('⚠️ Penyimpanan remote Firestore gagal/timeout, data dicadangkan ke sesi lokal:', saveError)
    }

    // 6. Simpan hasil di store dan redirect ke Result.vue
    userStore.setLastResult({
      id: docId,
      isCloudSaved,
      cloudError,
      ...payload,
    })

    router.push('/result')
  } catch (err) {
    console.error('Terjadi kesalahan saat submit evaluasi:', err)
    errorMessage.value = 'Gagal mengirim evaluasi: ' + err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header Lembar Ujian -->
    <header class="bg-white border-3 border-neo-black p-6 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="bg-neo-pink text-neo-black px-2 py-0.5 border-2 border-neo-black font-mono text-xs font-bold uppercase">
            {{ userStore.status_tes_aktif }}
          </span>
          <span class="text-xs font-mono font-bold text-neo-black/70">
            Workshop Website Portfolio • Google Sites
          </span>
        </div>
        <h1 class="font-display text-3xl md:text-4xl uppercase tracking-wider text-neo-black mt-1">
          Lembar Soal {{ userStore.status_tes_aktif }}
        </h1>
        <p class="text-sm font-medium mt-1">
          Peserta: <strong>{{ userStore.nama }}</strong> (Kelas: {{ userStore.kelas }})
        </p>
      </div>

      <!-- Counter Badge -->
      <div class="bg-neo-yellow border-3 border-neo-black p-3 text-center min-w-[140px] shadow-neo">
        <span class="block text-xs font-bold uppercase tracking-wider">Progress</span>
        <span class="font-display text-3xl text-neo-black leading-none">
          {{ totalTerjawab }} / {{ totalSoal }}
        </span>
        <span class="block text-[11px] font-mono font-bold">({{ persentaseSelesai }}% Lengkap)</span>
      </div>
    </header>

    <!-- Sticky Progress Bar -->
    <div class="sticky top-20 z-30 bg-neo-black border-3 border-neo-black p-1 shadow-neo">
      <div
        class="h-3 bg-neo-green transition-all duration-300"
        :style="{ width: `${persentaseSelesai}%` }"
      ></div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white border-3 border-neo-black p-12 text-center shadow-neo">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-neo-black border-t-transparent rounded-full mb-3"></div>
      <p class="font-display text-2xl uppercase tracking-wider">Memuat Instrumen Soal...</p>
    </div>

    <!-- Error Global Alert -->
    <div v-if="errorMessage" class="bg-[#ff6b6b] text-white border-3 border-neo-black p-4 font-bold text-sm shadow-neo">
      ⚠️ {{ errorMessage }}
    </div>

    <!-- Question Cards List -->
    <form v-if="!isLoading" @submit.prevent="handleSubmit" class="space-y-6">
      <div
        v-for="soal in soalList"
        :key="soal.nomor"
        :id="`soal-card-${soal.nomor}`"
        :class="[
          'border-3 p-6 shadow-neo transition-all duration-200',
          validationErrors.includes(soal.nomor)
            ? 'border-[#ff6b6b] bg-red-50'
            : jawaban[soal.nomor] !== undefined
            ? 'border-neo-black bg-white'
            : 'border-neo-black bg-neo-bg'
        ]"
      >
        <!-- Card Header Badge -->
        <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'px-3 py-1 font-display text-lg tracking-wider border-2 border-neo-black uppercase',
                soal.kategori === 'Pilihan Ganda' ? 'bg-neo-pink text-neo-black' : 'bg-neo-blue text-neo-black'
              ]"
            >
              Soal #{{ soal.nomor }}
            </span>
            <span class="bg-neo-black text-neo-bg px-2 py-0.5 text-xs font-mono font-bold uppercase">
              {{ soal.kategori }}
            </span>
          </div>

          <span
            :class="[
              'text-xs font-bold px-2 py-1 border border-neo-black',
              jawaban[soal.nomor] !== undefined ? 'bg-neo-green' : 'bg-gray-200'
            ]"
          >
            {{ jawaban[soal.nomor] !== undefined ? '✓ Sudah Dijawab' : 'Belum Dijawab' }}
          </span>
        </div>

        <!-- Question Text -->
        <h2 class="font-sans font-bold text-lg md:text-xl text-neo-black mb-6 leading-snug">
          {{ soal.pertanyaan }}
        </h2>

        <!-- TIPE: Pilihan Ganda (A, B, C, D) -->
        <div v-if="soal.kategori === 'Pilihan Ganda'" class="space-y-3">
          <label
            v-for="(teks, key) in soal.opsi"
            :key="key"
            @click="selectOpsi(soal.nomor, key)"
            :class="[
              'flex items-center gap-3 p-4 border-3 border-neo-black cursor-pointer transition-all duration-150',
              jawaban[soal.nomor] === key
                ? 'bg-neo-yellow shadow-neo translate-x-1 font-bold'
                : 'bg-white hover:bg-neo-yellow/30'
            ]"
          >
            <span
              :class="[
                'w-8 h-8 flex items-center justify-center font-display text-xl border-2 border-neo-black shrink-0',
                jawaban[soal.nomor] === key ? 'bg-neo-black text-neo-bg' : 'bg-neo-bg text-neo-black'
              ]"
            >
              {{ key }}
            </span>
            <span class="text-sm sm:text-base leading-relaxed">{{ teks }}</span>
          </label>
        </div>

        <!-- TIPE: Penilaian Diri (Praktik: Bisa / Belum Bisa) -->
        <div v-else-if="soal.kategori === 'Praktik'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            @click="selectOpsi(soal.nomor, 'Bisa')"
            :class="[
              'p-4 border-3 border-neo-black font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer',
              jawaban[soal.nomor] === 'Bisa'
                ? 'bg-neo-green text-neo-black shadow-neo -translate-y-1 font-black'
                : 'bg-white hover:bg-neo-green/30'
            ]"
          >
            <span>👍 BISA</span>
            <span v-if="jawaban[soal.nomor] === 'Bisa'">✓</span>
          </button>

          <button
            type="button"
            @click="selectOpsi(soal.nomor, 'Belum Bisa')"
            :class="[
              'p-4 border-3 border-neo-black font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer',
              jawaban[soal.nomor] === 'Belum Bisa'
                ? 'bg-neo-pink text-neo-black shadow-neo -translate-y-1 font-black'
                : 'bg-white hover:bg-neo-pink/30'
            ]"
          >
            <span>👎 BELUM BISA</span>
            <span v-if="jawaban[soal.nomor] === 'Belum Bisa'">✓</span>
          </button>
        </div>
      </div>

      <!-- Submit Section Card -->
      <div class="bg-neo-yellow border-3 border-neo-black p-6 md:p-8 shadow-neo space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 class="font-display text-2xl uppercase tracking-wider">Konfirmasi & Pengiriman</h3>
            <p class="text-xs font-medium text-neo-black/80">
              Pastikan Anda telah memeriksa semua butir sebelum menyelesaikan evaluasi.
            </p>
          </div>
          <span class="font-mono font-bold text-sm bg-white border-2 border-neo-black px-3 py-1">
            Status: {{ totalTerjawab }} / {{ totalSoal }} Soal
          </span>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-4 px-6 text-center font-display text-3xl uppercase tracking-wider border-3 border-neo-black bg-neo-pink text-neo-black shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting">Mengirim & Menghitung Skor...</span>
          <span v-else>Kirim Jawaban & Selesaikan Tes ➔</span>
        </button>
      </div>
    </form>
  </div>
</template>
