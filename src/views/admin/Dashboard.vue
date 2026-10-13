<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminNav from '../../components/AdminNav.vue'
import { db } from '../../firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const listEvaluasi = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')
const filterJenis = ref('Semua')
const selectedRow = ref(null)

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
</script>

<template>
  <div class="space-y-8">
    <AdminNav title="HASIL EVALUASI SISWA" />

    <!-- Header Section -->
    <header class="bg-neo-yellow border-3 border-neo-black p-6 sm:p-8 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="inline-block bg-neo-pink text-neo-black px-3 py-1 font-mono text-xs font-bold uppercase border-2 border-neo-black shadow-neo">
          Workshop Pembuatan Website Portfolio dengan Google Sites
        </div>
        <h1 class="font-display text-4xl sm:text-6xl uppercase tracking-wider text-neo-black leading-none">
          Pre & Post Test • Hasil Peserta
        </h1>
        <p class="text-sm font-medium text-neo-black/80 max-w-xl">
          Rekapitulasi hasil instrumen evaluasi peserta workshop mencakup penguasaan konsep Google Sites dan unjuk kerja praktik.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          @click="fetchEvaluasi"
          :disabled="isLoading"
          class="neo-button bg-white px-4 py-2.5 text-xs uppercase tracking-wider text-neo-black cursor-pointer flex items-center gap-2"
        >
          <span :class="{ 'animate-spin': isLoading }">↻</span>
          <span>Refresh Data</span>
        </button>
        <button
          @click="exportToCSV"
          :disabled="filteredData.length === 0"
          class="neo-button bg-neo-green px-4 py-2.5 text-xs uppercase tracking-wider text-neo-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 Export CSV
        </button>
      </div>
    </header>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-4 bg-[#ff6b6b] text-white border-3 border-neo-black font-bold text-sm shadow-neo">
      ⚠️ {{ errorMessage }}
    </div>

    <!-- Statistik Ringkas (Neo Brutalism Cards) -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      <div class="bg-white border-3 border-neo-black p-4 sm:p-5 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Total Peserta</span>
        <div class="font-display text-4xl sm:text-5xl text-neo-black mt-1 leading-none">
          {{ totalPeserta }}
        </div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-2 block">Siswa Terekam</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-4 sm:p-5 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Rata-Rata Nilai</span>
        <div class="font-display text-4xl sm:text-5xl text-neo-black mt-1 leading-none">
          {{ rataRataSkor }} <span class="text-xl font-sans text-neo-black/40">/ 100</span>
        </div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-2 block">Mean Skor Keseluruhan</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-4 sm:p-5 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Skor Tertinggi</span>
        <div class="font-display text-4xl sm:text-5xl text-neo-green mt-1 leading-none">
          {{ skorTertinggi }}
        </div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-2 block">Skor Terbaik</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-4 sm:p-5 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Skor Terendah</span>
        <div class="font-display text-4xl sm:text-5xl text-[#ff6b6b] mt-1 leading-none">
          {{ skorTerendah }}
        </div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-2 block">Perlu Bimbingan</span>
      </div>
    </section>

    <!-- Filter & Search Controls -->
    <div class="bg-white border-3 border-neo-black p-4 sm:p-6 shadow-neo flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="w-full md:w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau kelas peserta..."
          class="w-full px-4 py-2.5 bg-neo-bg border-3 border-neo-black text-sm font-medium focus:bg-white focus:outline-none focus:shadow-neo transition-all"
        />
      </div>

      <!-- Filter Jenis Tes -->
      <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        <span class="text-xs font-bold uppercase shrink-0">Filter:</span>
        <button
          v-for="jenis in ['Semua', 'Pre-Test', 'Post-Test']"
          :key="jenis"
          @click="filterJenis = jenis"
          :class="[
            'px-3 py-1.5 text-xs font-bold uppercase border-2 border-neo-black transition-all cursor-pointer shrink-0',
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
        <table class="w-full border-collapse text-left text-sm">
          <!-- Header Cerah Khas Neo Brutalism -->
          <thead>
            <tr class="bg-neo-pink border-b-3 border-neo-black text-neo-black">
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider w-12 text-center">No</th>
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider">Nama Peserta</th>
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider">Kelas</th>
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider text-center">Jenis Tes</th>
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider text-center">Skor PG</th>
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider text-center">Praktik</th>
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider text-center bg-neo-yellow">Total Skor</th>
              <th class="p-4 border-r-3 border-neo-black font-display text-lg uppercase tracking-wider">Waktu Submit</th>
              <th class="p-4 font-display text-lg uppercase tracking-wider text-center">Aksi</th>
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
                  class="border-2 border-neo-black bg-white px-3 py-1 text-xs font-bold uppercase shadow-neo hover:bg-neo-yellow transition-all cursor-pointer"
                >
                  Detail 🔍
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Info -->
      <div class="p-4 bg-neo-bg border-t-3 border-neo-black flex items-center justify-between text-xs font-bold">
        <span>Menampilkan {{ filteredData.length }} dari total {{ totalPeserta }} data</span>
        <span class="font-mono">Collection: evaluasi_peserta</span>
      </div>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="selectedRow"
      class="fixed inset-0 z-50 bg-neo-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div class="bg-white border-3 border-neo-black max-w-xl w-full p-6 sm:p-8 shadow-neo max-h-[90vh] overflow-y-auto space-y-6">
        <div class="flex items-center justify-between border-b-3 border-neo-black pb-4">
          <div>
            <span class="bg-neo-pink text-neo-black px-2 py-0.5 border border-neo-black font-mono text-xs font-bold uppercase">
              Rincian Jawaban
            </span>
            <h3 class="font-display text-3xl uppercase tracking-wider mt-1">
              {{ selectedRow.nama }}
            </h3>
            <p class="text-xs font-mono font-bold text-neo-black/70">
              Kelas: {{ selectedRow.kelas }} • Jenis: {{ selectedRow.jenis_tes }}
            </p>
          </div>
          <button
            @click="selectedRow = null"
            class="w-10 h-10 border-3 border-neo-black bg-[#ff6b6b] text-white font-display text-2xl shadow-neo hover:bg-red-600 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Scores Grid -->
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-3 border-2 border-neo-black bg-neo-bg">
            <span class="text-[10px] font-bold uppercase block">Skor PG</span>
            <span class="font-display text-2xl">{{ selectedRow.skor_pg || 0 }} / 70</span>
          </div>
          <div class="p-3 border-2 border-neo-black bg-neo-bg">
            <span class="text-[10px] font-bold uppercase block">Skor Praktik</span>
            <span class="font-display text-2xl">{{ selectedRow.skor_praktik || 0 }} / 30</span>
          </div>
          <div class="p-3 border-2 border-neo-black bg-neo-yellow font-bold">
            <span class="text-[10px] font-bold uppercase block">Total Skor</span>
            <span class="font-display text-2xl">{{ selectedRow.skor_total || 0 }} / 100</span>
          </div>
        </div>

        <!-- Jawaban Details -->
        <div class="space-y-2">
          <h4 class="font-display text-xl uppercase tracking-wide">Pilihan Jawaban Peserta:</h4>
          <div class="bg-neo-bg border-2 border-neo-black p-4 font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto">
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
          class="w-full py-3 border-3 border-neo-black bg-neo-pink font-display text-xl uppercase tracking-wider shadow-neo cursor-pointer"
        >
          Tutup Detail
        </button>
      </div>
    </div>
  </div>
</template>
