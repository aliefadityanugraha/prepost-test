<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminNav from '../../components/AdminNav.vue'
import QrProjectorModal from '../../components/QrProjectorModal.vue'
import { db } from '../../firebase'
import { collection, getDocs, orderBy, query, writeBatch } from 'firebase/firestore'
import { useAuthStore } from '../../stores/authStore'
import * as XLSX from 'xlsx'
import { allBankSoal } from '../../utils/seeder'
import { exportLaporanExcelLengkap } from '../../utils/excelExporter'

const router = useRouter()
const authStore = useAuthStore()

const listEvaluasi = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const successNotification = ref('')
const searchQuery = ref('')
const filterJenis = ref('Semua')
const selectedRow = ref(null)

// State QR Proyektor & Reset Data Uji Coba
const isQrModalOpen = ref(false)
const isResetModalOpen = ref(false)
const confirmResetInput = ref('')
const isResetting = ref(false)

onMounted(async () => {
  await fetchEvaluasi()
})

const fetchEvaluasi = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const colRef = collection(db, 'evaluasi_peserta')
    // Coba dengan query orderBy waktu jika index siap, fallback ke basic query
    let snapshot
    try {
      const q = query(colRef, orderBy('created_at', 'desc'))
      snapshot = await getDocs(q)
    } catch {
      snapshot = await getDocs(colRef)
    }

    const items = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() })
    })

    listEvaluasi.value = items
  } catch (err) {
    console.warn('Gagal fetch Firestore evaluasi_peserta:', err)
    errorMessage.value = `Gagal memuat data dari Firestore: ${err.message}.`
  } finally {
    isLoading.value = false
  }
}

// Data terfilter berdasarkan search dan kategori jenis tes
const filteredData = computed(() => {
  return listEvaluasi.value.filter((item) => {
    const matchSearch =
      (item.nama || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.kelas || '').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchJenis =
      filterJenis.value === 'Semua' || item.jenis_tes === filterJenis.value

    return matchSearch && matchJenis
  })
})

// Statistik Komputasi
const totalPeserta = computed(() => listEvaluasi.value.length)
const rataRataSkor = computed(() => {
  if (listEvaluasi.value.length === 0) return 0
  const sum = listEvaluasi.value.reduce((acc, curr) => acc + (curr.skor_total || 0), 0)
  return Math.round(sum / listEvaluasi.value.length)
})
const skorTertinggi = computed(() => {
  if (listEvaluasi.value.length === 0) return 0
  return Math.max(...listEvaluasi.value.map((i) => i.skor_total || 0))
})
const skorTerendah = computed(() => {
  if (listEvaluasi.value.length === 0) return 0
  return Math.min(...listEvaluasi.value.map((i) => i.skor_total || 0))
})

const handleLogout = async () => {
  await authStore.logoutAdmin()
  router.push('/admin/login')
}

const formatDate = (isoOrTimestamp) => {
  if (!isoOrTimestamp) return '-'
  try {
    if (isoOrTimestamp.toDate) {
      return isoOrTimestamp.toDate().toLocaleString('id-ID')
    }
    return new Date(isoOrTimestamp).toLocaleString('id-ID')
  } catch {
    return String(isoOrTimestamp)
  }
}

const exportToExcel = async () => {
  if (filteredData.value.length === 0) return

  let bankSoal = allBankSoal
  try {
    const snap = await getDocs(collection(db, 'bank_soal'))
    if (!snap.empty) {
      bankSoal = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    }
  } catch (err) {
    console.warn('Menggunakan fallback bank_soal lokal:', err)
  }

  const fileName = exportLaporanExcelLengkap({
    listEvaluasi: filteredData.value,
    bankSoalList: bankSoal,
  })

  successNotification.value = `File Excel (${fileName}) berhasil diunduh dengan Sheet Pre & Post terpisah dan rincian soal 1-12!`
}

const exportToCSV = () => {
  if (filteredData.value.length === 0) return

  const headers = ['No', 'Nama Peserta', 'Kelas', 'Jenis Tes', 'Skor PG', 'Skor Praktik', 'Total Skor', 'Waktu Submit']
  const rows = filteredData.value.map((item, idx) => [
    idx + 1,
    `"${item.nama || ''}"`,
    `"${item.kelas || ''}"`,
    `"${item.jenis_tes || ''}"`,
    item.skor_pg || 0,
    item.skor_praktik || 0,
    item.skor_total || 0,
    `"${formatDate(item.created_at || item.waktu_selesai)}"`,
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `evaluasi_peserta_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Reset / Pembersihan Seluruh Data Uji Coba Sesi
const executeResetData = async () => {
  if (confirmResetInput.value.trim().toUpperCase() !== 'RESET') return

  isResetting.value = true
  errorMessage.value = ''
  successNotification.value = ''

  try {
    const colRef = collection(db, 'evaluasi_peserta')
    const snapshot = await getDocs(colRef)

    if (!snapshot.empty) {
      const docs = snapshot.docs
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db)
        const chunk = docs.slice(i, i + 400)
        chunk.forEach((d) => batch.delete(d.ref))
        await batch.commit()
      }
    }

    listEvaluasi.value = []
    isResetModalOpen.value = false
    confirmResetInput.value = ''
    successNotification.value = 'Seluruh data hasil uji coba/submisi peserta berhasil dibersihkan dari database.'
  } catch (err) {
    console.error('Gagal reset data submisi:', err)
    errorMessage.value = 'Gagal menghapus data dari Firestore: ' + err.message
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 sm:space-y-8">
    <AdminNav title="HASIL EVALUASI SISWA" />

    <!-- Header Section -->
    <header class="bg-neo-yellow border-3 border-neo-black p-4 sm:p-8 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
      <div class="space-y-2">
        <div class="inline-block bg-neo-pink text-neo-black px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-xs font-bold uppercase border-2 border-neo-black shadow-neo">
          Workshop Pembuatan Website Portfolio dengan Google Sites
        </div>
        <h1 class="font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-neo-black leading-none">
          Pre & Post Test • Hasil Peserta
        </h1>
        <p class="text-xs sm:text-sm font-medium text-neo-black/80 max-w-xl">
          Rekapitulasi hasil instrumen evaluasi peserta workshop mencakup penguasaan konsep Google Sites dan unjuk kerja praktik.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full sm:w-auto flex-wrap">
        <button
          @click="fetchEvaluasi"
          :disabled="isLoading"
          class="neo-button bg-white px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider text-neo-black cursor-pointer flex items-center justify-center gap-1.5 font-bold"
        >
          <span class="material-symbols-outlined text-[15px]" :class="{ 'animate-spin': isLoading }">refresh</span>
          <span>Refresh</span>
        </button>
        <button
          @click="isQrModalOpen = true"
          class="neo-button bg-neo-yellow text-neo-black px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider cursor-pointer font-bold text-center flex items-center justify-center gap-1.5 shadow-neo hover:bg-white"
          title="Buka QR Code untuk Proyektor Kelas"
        >
          <span class="material-symbols-outlined text-[16px]">qr_code_2</span>
          <span>QR Masuk Kelas</span>
        </button>
        <button
          @click="exportToExcel"
          :disabled="filteredData.length === 0"
          class="neo-button bg-neo-green px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider text-neo-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center gap-1.5 font-bold"
        >
          <span class="material-symbols-outlined text-[16px]">table_chart</span>
          <span>Export Excel</span>
        </button>
        <button
          @click="exportToCSV"
          :disabled="filteredData.length === 0"
          class="neo-button bg-neo-blue px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider text-neo-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center gap-1.5 font-bold"
        >
          <span class="material-symbols-outlined text-[16px]">description</span>
          <span>Export CSV</span>
        </button>
        <button
          @click="isResetModalOpen = true; confirmResetInput = ''"
          :disabled="listEvaluasi.length === 0"
          class="neo-button bg-[#ff6b6b] text-white px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center gap-1.5 hover:bg-red-600 font-bold"
        >
          <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
          <span>Reset Data</span>
        </button>
      </div>
    </header>

    <!-- Success Notification Alert -->
    <div v-if="successNotification" class="p-3.5 sm:p-4 bg-neo-green text-neo-black border-3 border-neo-black font-bold text-xs sm:text-sm shadow-neo flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-base">check_circle</span>
        <span>{{ successNotification }}</span>
      </div>
      <button @click="successNotification = ''" class="cursor-pointer flex items-center">
        <span class="material-symbols-outlined text-base">close</span>
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-3.5 sm:p-4 bg-[#ff6b6b] text-white border-3 border-neo-black font-bold text-xs sm:text-sm shadow-neo flex items-center gap-2">
      <span class="material-symbols-outlined text-base">warning</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Statistik Ringkas (Neo Brutalism Cards) -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6">
      <div class="bg-white border-3 border-neo-black p-3.5 sm:p-5 shadow-neo">
        <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/60 block truncate">Total Peserta</span>
        <div class="font-display text-3xl sm:text-4xl md:text-5xl text-neo-black mt-1 leading-none">
          {{ totalPeserta }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/70 mt-1.5 block">Siswa Terekam</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-3.5 sm:p-5 shadow-neo">
        <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/60 block truncate">Rata-Rata Nilai</span>
        <div class="font-display text-3xl sm:text-4xl md:text-5xl text-neo-black mt-1 leading-none">
          {{ rataRataSkor }} <span class="text-base sm:text-xl font-sans text-neo-black/40">/ 100</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/70 mt-1.5 block truncate">Mean Keseluruhan</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-3.5 sm:p-5 shadow-neo">
        <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/60 block truncate">Skor Tertinggi</span>
        <div class="font-display text-3xl sm:text-4xl md:text-5xl text-neo-green mt-1 leading-none">
          {{ skorTertinggi }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/70 mt-1.5 block">Skor Terbaik</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-3.5 sm:p-5 shadow-neo">
        <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/60 block truncate">Skor Terendah</span>
        <div class="font-display text-3xl sm:text-4xl md:text-5xl text-[#ff6b6b] mt-1 leading-none">
          {{ skorTerendah }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/70 mt-1.5 block truncate">Perlu Bimbingan</span>
      </div>
    </section>

    <!-- Filter & Search Controls -->
    <div class="bg-white border-3 border-neo-black p-3.5 sm:p-6 shadow-neo flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
      <!-- Search Input -->
      <div class="w-full md:w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau kelas peserta..."
          class="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-neo-bg border-3 border-neo-black text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:shadow-neo transition-all"
        />
      </div>

      <!-- Filter Jenis Tes -->
      <div class="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <span class="text-xs font-bold uppercase shrink-0">Filter:</span>
        <button
          v-for="jenis in ['Semua', 'Pre-Test', 'Post-Test']"
          :key="jenis"
          @click="filterJenis = jenis"
          :class="[
            'px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold uppercase border-2 border-neo-black transition-all cursor-pointer shrink-0',
            filterJenis === jenis ? 'bg-neo-pink text-neo-black shadow-neo' : 'bg-neo-bg hover:bg-white'
          ]"
        >
          {{ jenis }}
        </button>
      </div>
    </div>

    <!-- TABEL UTAMA (HTML Table dengan Border Tebal Hitam & Header Warna Cerah Khas Neo Brutalism) -->
    <div class="bg-white border-3 border-neo-black shadow-neo overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs sm:text-sm min-w-[740px]">
          <!-- Header Cerah Khas Neo Brutalism -->
          <thead>
            <tr class="bg-neo-pink border-b-3 border-neo-black text-neo-black">
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider w-12 text-center">No</th>
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider">Nama Peserta</th>
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider">Kelas</th>
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider text-center">Jenis Tes</th>
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider text-center">Skor PG</th>
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider text-center">Praktik</th>
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider text-center bg-neo-yellow">Total Skor</th>
              <th class="p-3 sm:p-4 border-r-3 border-neo-black font-display text-base sm:text-lg uppercase tracking-wider">Waktu Submit</th>
              <th class="p-3 sm:p-4 font-display text-base sm:text-lg uppercase tracking-wider text-center">Aksi</th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y-3 divide-neo-black font-medium">
            <!-- Loading Row -->
            <tr v-if="isLoading">
              <td colspan="9" class="p-8 text-center bg-neo-bg">
                <div class="animate-spin inline-block w-6 h-6 border-3 border-neo-black border-t-transparent rounded-full mb-2"></div>
                <p class="font-display text-xl uppercase tracking-wider">Memuat Data Evaluasi Peserta...</p>
              </td>
            </tr>

            <!-- Empty Row -->
            <tr v-else-if="filteredData.length === 0">
              <td colspan="9" class="p-10 text-center bg-neo-bg">
                <div class="font-display text-3xl uppercase tracking-wider mb-2">Belum Ada Data</div>
                <p class="text-xs text-neo-black/70">
                  Belum ada peserta yang menyelesaikan evaluasi atau tidak ada data yang cocok dengan filter pencarian.
                </p>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-else
              v-for="(item, idx) in filteredData"
              :key="item.id || idx"
              class="hover:bg-neo-bg/60 transition-colors"
            >
              <!-- No -->
              <td class="p-4 border-r-3 border-neo-black font-mono font-bold text-center">
                {{ idx + 1 }}
              </td>

              <!-- Nama Peserta -->
              <td class="p-4 border-r-3 border-neo-black font-bold text-base text-neo-black">
                {{ item.nama || 'Tanpa Nama' }}
              </td>

              <!-- Kelas -->
              <td class="p-4 border-r-3 border-neo-black font-mono font-semibold">
                {{ item.kelas || '-' }}
              </td>

              <!-- Jenis Tes -->
              <td class="p-4 border-r-3 border-neo-black text-center">
                <span
                  :class="[
                    'px-2.5 py-1 font-mono text-xs font-bold border-2 border-neo-black uppercase shadow-neo inline-block',
                    item.jenis_tes === 'Pre-Test' ? 'bg-neo-blue text-neo-black' : 'bg-neo-green text-neo-black'
                  ]"
                >
                  {{ item.jenis_tes || '-' }}
                </span>
              </td>

              <!-- Skor PG -->
              <td class="p-4 border-r-3 border-neo-black font-mono font-bold text-center">
                <span class="text-base">{{ item.skor_pg ?? 0 }}</span>
                <span class="text-xs text-neo-black/50">/70</span>
              </td>

              <!-- Skor Praktik -->
              <td class="p-4 border-r-3 border-neo-black font-mono font-bold text-center">
                <span class="text-base">{{ item.skor_praktik ?? 0 }}</span>
                <span class="text-xs text-neo-black/50">/30</span>
              </td>

              <!-- Total Skor -->
              <td class="p-4 border-r-3 border-neo-black text-center bg-neo-yellow/30">
                <span
                  :class="[
                    'font-display text-2xl px-3 py-1 border-2 border-neo-black shadow-neo inline-block',
                    (item.skor_total || 0) >= 80 ? 'bg-neo-green text-neo-black' :
                    (item.skor_total || 0) >= 70 ? 'bg-neo-blue text-neo-black' : 'bg-neo-yellow text-neo-black'
                  ]"
                >
                  {{ item.skor_total ?? 0 }}
                </span>
              </td>

              <!-- Waktu Submit -->
              <td class="p-4 border-r-3 border-neo-black font-mono text-xs text-neo-black/80">
                {{ formatDate(item.created_at || item.waktu_selesai) }}
              </td>

              <!-- Aksi -->
              <td class="p-4 text-center">
                <button
                  @click="selectedRow = item"
                  class="border-2 border-neo-black bg-white px-3 py-1 text-xs font-bold uppercase shadow-neo hover:bg-neo-yellow transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-[14px]">visibility</span>
                  <span>Detail</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Info -->
      <div class="p-4 bg-neo-bg border-t-3 border-neo-black flex items-center justify-between text-xs font-bold">
        <span>Menampilkan {{ filteredData.length }} dari total {{ totalPeserta }} data</span>
        <span class="font-mono text-neo-black/60">Data Terkini</span>
      </div>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="selectedRow"
      class="fixed inset-0 z-50 bg-neo-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
    >
      <div class="bg-white border-3 border-neo-black max-w-xl w-full p-4 sm:p-8 shadow-neo max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-6">
        <div class="flex items-center justify-between border-b-3 border-neo-black pb-3 sm:pb-4 gap-2">
          <div class="min-w-0">
            <span class="bg-neo-pink text-neo-black px-2 py-0.5 border border-neo-black font-mono text-[10px] sm:text-xs font-bold uppercase inline-block">
              Rincian Jawaban
            </span>
            <h3 class="font-display text-2xl sm:text-3xl uppercase tracking-wider mt-1 truncate">
              {{ selectedRow.nama }}
            </h3>
            <p class="text-[11px] sm:text-xs font-mono font-bold text-neo-black/70 truncate">
              Kelas: {{ selectedRow.kelas }} • Jenis: {{ selectedRow.jenis_tes }}
            </p>
          </div>
          <button
            @click="selectedRow = null"
            class="w-9 h-9 sm:w-10 sm:h-10 border-3 border-neo-black bg-[#ff6b6b] text-white font-display shadow-neo hover:bg-red-600 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
          >
            <span class="material-symbols-outlined text-xl sm:text-2xl">close</span>
          </button>
        </div>

        <!-- Scores Grid -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div class="p-2 sm:p-3 border-2 border-neo-black bg-neo-bg">
            <span class="text-[9px] sm:text-[10px] font-bold uppercase block truncate">Skor PG</span>
            <span class="font-display text-lg sm:text-2xl leading-tight">{{ selectedRow.skor_pg || 0 }} / 70</span>
          </div>
          <div class="p-2 sm:p-3 border-2 border-neo-black bg-neo-bg">
            <span class="text-[9px] sm:text-[10px] font-bold uppercase block truncate">Praktik</span>
            <span class="font-display text-lg sm:text-2xl leading-tight">{{ selectedRow.skor_praktik || 0 }} / 30</span>
          </div>
          <div class="p-2 sm:p-3 border-2 border-neo-black bg-neo-yellow font-bold">
            <span class="text-[9px] sm:text-[10px] font-bold uppercase block truncate">Total</span>
            <span class="font-display text-lg sm:text-2xl leading-tight">{{ selectedRow.skor_total || 0 }} / 100</span>
          </div>
        </div>

        <!-- Jawaban Details -->
        <div class="space-y-2">
          <h4 class="font-display text-lg sm:text-xl uppercase tracking-wide">Pilihan Jawaban Peserta:</h4>
          <div class="bg-neo-bg border-2 border-neo-black p-3 sm:p-4 font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto">
            <div
              v-for="(ans, no) in selectedRow.jawaban || {}"
              :key="no"
              class="flex items-center justify-between border-b border-neo-black/20 pb-1"
            >
              <span>Soal No #{{ no }}:</span>
              <span class="font-bold bg-white px-2 py-0.5 border border-neo-black">{{ ans }}</span>
            </div>
            <p v-if="!selectedRow.jawaban || Object.keys(selectedRow.jawaban).length === 0" class="text-neo-black/60 italic">
              Data rincian butir tidak tercatat secara lengkap.
            </p>
          </div>
        </div>

        <button
          @click="selectedRow = null"
          class="w-full py-3 border-3 border-neo-black bg-neo-pink font-display text-lg sm:text-xl uppercase tracking-wider shadow-neo cursor-pointer"
        >
          Tutup Detail
        </button>
      </div>
    </div>

    <!-- MODAL RESET DATA UJI COBA (PENGAMAN GANDA) -->
    <div
      v-if="isResetModalOpen"
      class="fixed inset-0 z-50 bg-neo-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
    >
      <div class="bg-white border-3 border-neo-black max-w-lg w-full p-4 sm:p-8 shadow-neo space-y-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b-3 border-neo-black pb-3 gap-2">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 bg-[#ff6b6b] border-2 border-neo-black"></span>
            <h3 class="font-display text-2xl sm:text-3xl uppercase tracking-wider text-red-600 leading-none">
              Reset Data Uji Coba
            </h3>
          </div>
          <button
            @click="isResetModalOpen = false"
            class="w-8 h-8 border-2 border-neo-black bg-white hover:bg-[#ff6b6b] hover:text-white cursor-pointer flex items-center justify-center"
          >
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Warning Body -->
        <div class="space-y-3 text-xs sm:text-sm">
          <p class="font-bold text-neo-black">
            Perhatian: Tindakan ini akan <u>menghapus permanen seluruh data hasil submisi siswa / peserta</u> dari database Firestore!
          </p>

          <div class="p-3 bg-neo-yellow border-2 border-neo-black font-mono font-bold text-xs">
            Saat ini terdapat <span class="text-base text-red-600 underline">{{ totalPeserta }} data submisi</span> yang akan dibersihkan.
          </div>

          <!-- Quick Backup Option -->
          <div class="p-3 bg-neo-bg border-2 border-neo-black space-y-2">
            <p class="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">lightbulb</span>
              <span>Rekomendasi: Unduh Cadangan Data Dulu</span>
            </p>
            <button
              type="button"
              @click="exportToExcel"
              class="w-full py-2 px-3 bg-neo-green border-2 border-neo-black text-xs font-bold uppercase shadow-neo hover:bg-green-400 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">download</span>
              <span>Download Cadangan Excel (.xlsx)</span>
            </button>
          </div>

          <!-- Safety Confirmation Input -->
          <div class="space-y-1.5 pt-1">
            <label class="block font-bold text-xs uppercase tracking-wider text-red-600">
              Ketik kata <span class="bg-neo-black text-neo-bg px-1.5 py-0.5 font-mono">RESET</span> untuk mengonfirmasi:
            </label>
            <input
              v-model="confirmResetInput"
              type="text"
              placeholder="Ketik: RESET"
              class="w-full px-3 py-2 bg-neo-bg border-3 border-neo-black font-mono font-bold text-sm tracking-widest uppercase focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-neo-black">
          <button
            type="button"
            @click="isResetModalOpen = false"
            class="px-4 py-2 text-xs font-bold uppercase border-2 border-neo-black bg-white shadow-neo cursor-pointer hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="button"
            @click="executeResetData"
            :disabled="confirmResetInput.trim().toUpperCase() !== 'RESET' || isResetting"
            class="px-5 py-2.5 text-xs font-bold uppercase border-3 border-neo-black bg-[#ff6b6b] text-white shadow-neo hover:bg-red-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span v-if="isResetting" class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            <span class="material-symbols-outlined text-sm" v-else>delete_forever</span>
            <span>{{ isResetting ? 'Membersihkan...' : 'Hapus Seluruh Data Submisi' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal QR Proyektor Kelas -->
    <QrProjectorModal :is-open="isQrModalOpen" @close="isQrModalOpen = false" />
  </div>
</template>
