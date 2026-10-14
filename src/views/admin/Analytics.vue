<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AdminNav from '../../components/AdminNav.vue'
import { db } from '../../firebase'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { allBankSoal, dataSoalPreTest, dataSoalPostTest } from '../../utils/seeder'
import { getSortedOpsi } from '../../utils/scoring'
import { exportLaporanExcelLengkap } from '../../utils/excelExporter'

// Register Chart.js Components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const listEvaluasi = ref([])
const bankSoalList = ref([...allBankSoal])
const isLoading = ref(true)
const isGeneratingPdf = ref(false)
const pdfNotification = ref(null)
let unsubscribeEvaluasi = null

onMounted(async () => {
  await fetchBankSoal()
  initRealtimeEvaluasi()
})

onUnmounted(() => {
  if (unsubscribeEvaluasi) {
    unsubscribeEvaluasi()
  }
})

// Helper untuk normalisasi nilai evaluasi jika ada data lama melebihi 100
const sanitizeEvaluasiItem = (item) => {
  let skor_total = Number(item.skor_total) || 0
  let skor_pg = Number(item.skor_pg) || 0
  let skor_praktik = Number(item.skor_praktik) || 0
  const total_pg = Number(item.total_pg) || 15
  const total_praktik = Number(item.total_praktik) || 5

  if (skor_total > 100 || skor_pg > 70 || skor_praktik > 30) {
    const benar_pg = item.benar_pg !== undefined ? Number(item.benar_pg) : Math.min(total_pg, Math.round(skor_pg / 10))
    const bisa_praktik = item.bisa_praktik !== undefined ? Number(item.bisa_praktik) : Math.min(total_praktik, Math.round(skor_praktik / 6))
    skor_pg = Math.min(70, Math.round((benar_pg / total_pg) * 70))
    skor_praktik = Math.min(30, Math.round((bisa_praktik / total_praktik) * 30))
    skor_total = Math.min(100, Math.max(0, skor_pg + skor_praktik))
  }

  return {
    ...item,
    skor_pg,
    skor_praktik,
    skor_total: Math.min(100, Math.max(0, skor_total)),
    total_pg,
    total_praktik,
  }
}

// Realtime sync ke collection 'evaluasi_peserta'
const initRealtimeEvaluasi = () => {
  isLoading.value = true
  try {
    const colRef = collection(db, 'evaluasi_peserta')
    unsubscribeEvaluasi = onSnapshot(
      colRef,
      (snapshot) => {
        const items = []
        snapshot.forEach((d) => items.push(sanitizeEvaluasiItem({ id: d.id, ...d.data() })))
        listEvaluasi.value = items
        isLoading.value = false
      },
      (error) => {
        console.warn('Realtime listener evaluasi error:', error)
        isLoading.value = false
      }
    )
  } catch (err) {
    console.warn('Gagal pasang realtime listener:', err)
    fetchEvaluasi()
  }
}

const fetchEvaluasi = async () => {
  isLoading.value = true
  try {
    const snap = await getDocs(collection(db, 'evaluasi_peserta'))
    const items = []
    snap.forEach((d) => items.push(sanitizeEvaluasiItem({ id: d.id, ...d.data() })))
    listEvaluasi.value = items
  } catch (err) {
    console.warn('Gagal fetch data evaluasi Firestore:', err)
  } finally {
    isLoading.value = false
  }
}

const fetchBankSoal = async () => {
  try {
    const snapPromise = getDocs(collection(db, 'bank_soal'))
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 3000)
    )
    const snap = await Promise.race([snapPromise, timeoutPromise])
    const items = []
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }))
    if (items.length > 0) {
      bankSoalList.value = items
    }
  } catch (err) {
    console.warn('Gagal fetch data bank_soal Firestore, menggunakan dataset lokal:', err)
  }
}

// Pisahkan data Pre-Test dan Post-Test
const preTestItems = computed(() =>
  listEvaluasi.value.filter((i) => i.jenis_tes === 'Pre-Test')
)
const postTestItems = computed(() =>
  listEvaluasi.value.filter((i) => i.jenis_tes === 'Post-Test')
)

// Hitung statistik rata-rata MURNI (0 jika belum ada data)
const hitungRata = (items, key) => {
  if (!items || items.length === 0) return 0
  const sum = items.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0)
  return Math.round((sum / items.length) * 10) / 10
}

const rataTotalPre = computed(() => {
  return hitungRata(preTestItems.value, 'skor_total')
})

const rataTotalPost = computed(() => {
  return hitungRata(postTestItems.value, 'skor_total')
})

const rataPGPre = computed(() => {
  return hitungRata(preTestItems.value, 'skor_pg')
})

const rataPGPost = computed(() => {
  return hitungRata(postTestItems.value, 'skor_pg')
})

const rataPraktikPre = computed(() => {
  return hitungRata(preTestItems.value, 'skor_praktik')
})

const rataPraktikPost = computed(() => {
  return hitungRata(postTestItems.value, 'skor_praktik')
})

const peningkatan = computed(() => {
  if (preTestItems.value.length === 0 || postTestItems.value.length === 0) return 0
  const delta = rataTotalPost.value - rataTotalPre.value
  return Math.round(delta * 10) / 10
})

// Konfigurasi Bar Chart (Vue-Chartjs & Chart.js) dengan Styling Neo Brutalism
const chartData = computed(() => {
  return {
    labels: [
      'Total Skor Evaluasi (/100)',
      'Konsep Pilihan Ganda (/70)',
      'Penilaian Diri Praktik (/30)',
    ],
    datasets: [
      {
        label: 'Pre-Test (Asesmen Awal)',
        backgroundColor: '#ff79c6', // neo-pink
        borderColor: '#282a36', // neo-black border
        borderWidth: 3,
        borderRadius: 6, // Neo Brutalism subtle rounded corners
        data: [rataTotalPre.value, rataPGPre.value, rataPraktikPre.value],
      },
      {
        label: 'Post-Test (Asesmen Akhir)',
        backgroundColor: '#8be9fd', // neo-blue
        borderColor: '#282a36',
        borderWidth: 3,
        borderRadius: 6,
        data: [rataTotalPost.value, rataPGPost.value, rataPraktikPost.value],
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#282a36',
        font: {
          family: "'Space Grotesk', sans-serif",
          weight: 'bold',
          size: 13,
        },
        padding: 16,
        boxWidth: 20,
      },
    },
    tooltip: {
      backgroundColor: '#282a36',
      titleColor: '#f1fa8c',
      bodyColor: '#ffffff',
      borderColor: '#f8f8f2',
      borderWidth: 2,
      cornerRadius: 6,
      padding: 12,
      bodyFont: {
        family: "'Space Grotesk', sans-serif",
        weight: 'bold',
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(40, 42, 54, 0.1)',
        lineWidth: 1,
      },
      ticks: {
        color: '#282a36',
        font: {
          family: "'Space Grotesk', sans-serif",
          weight: 'bold',
          size: 12,
        },
      },
      border: {
        color: '#282a36',
        width: 3,
      },
    },
    y: {
      beginAtZero: true,
      max: 100,
      grid: {
        color: 'rgba(40, 42, 54, 0.1)',
        lineWidth: 1,
      },
      ticks: {
        color: '#282a36',
        font: {
          family: "'Space Grotesk', sans-serif",
          weight: 'bold',
        },
      },
      border: {
        color: '#282a36',
        width: 3,
      },
    },
  },
}

// ========================================================
// ANALISIS RATA-RATA JAWABAN PERSOAL (ITEM-LEVEL ANALYSIS)
// ========================================================
const activeItemTab = ref('Pre-Test') // 'Pre-Test' | 'Post-Test' | 'Komparasi'
const itemKategoriFilter = ref('Semua') // 'Semua' | 'Pilihan Ganda' | 'Praktik'
const expandedQuestionId = ref(null)

const toggleExpandQuestion = (id) => {
  expandedQuestionId.value = expandedQuestionId.value === id ? null : id
}

// Fungsi Murni Analisis Butir Soal per Sesi (Pre-Test atau Post-Test)
const calcItemAnalysis = (jenisTes) => {
  const isPre = jenisTes === 'Pre-Test'
  const submissions = isPre ? preTestItems.value : postTestItems.value
  const targetSoal = bankSoalList.value
    .filter((s) => s.jenis_tes === jenisTes)
    .sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0))

  const countPG = targetSoal.filter((s) => s.kategori === 'Pilihan Ganda').length || 15
  const countPraktik = targetSoal.filter((s) => s.kategori === 'Praktik').length || 5
  const poinPerPG = Math.round((70 / countPG) * 10) / 10
  const poinPerPraktik = Math.round((30 / countPraktik) * 10) / 10

  return targetSoal.map((soal) => {
    const totalPeserta = submissions.length
    let correctCount = 0
    let bisaCount = 0
    const opsiDistribution = { A: 0, B: 0, C: 0, D: 0 }
    const praktikDistribution = { 'Bisa': 0, 'Belum Bisa': 0 }

    submissions.forEach((sub) => {
      const jwb = sub.jawaban?.[soal.nomor] ?? sub.jawaban?.[String(soal.nomor)]
      if (soal.kategori === 'Pilihan Ganda') {
        if (jwb && opsiDistribution[jwb] !== undefined) {
          opsiDistribution[jwb]++
        }
        if (jwb && String(jwb).trim().toUpperCase() === String(soal.kunci_jawaban).trim().toUpperCase()) {
          correctCount++
        }
      } else {
        if (jwb === 'Bisa') {
          bisaCount++
          praktikDistribution['Bisa']++
        } else if (jwb === 'Belum Bisa') {
          praktikDistribution['Belum Bisa']++
        }
      }
    })

    let percentage = 0
    let rataPoin = 0

    if (totalPeserta > 0) {
      if (soal.kategori === 'Pilihan Ganda') {
        percentage = Math.round((correctCount / totalPeserta) * 100)
        rataPoin = Math.round(((correctCount * poinPerPG) / totalPeserta) * 10) / 10
      } else {
        percentage = Math.round((bisaCount / totalPeserta) * 100)
        rataPoin = Math.round(((bisaCount * poinPerPraktik) / totalPeserta) * 10) / 10
      }
    } else {
      percentage = 0
      rataPoin = 0
    }

    let statusLabel = ''
    let statusBadgeColor = ''
    if (totalPeserta === 0) {
      statusLabel = 'Belum Ada Data'
      statusBadgeColor = 'bg-gray-200 text-neo-black/60'
    } else if (percentage >= 80) {
      statusLabel = 'Tinggi (Sangat Dikuasai)'
      statusBadgeColor = 'bg-neo-green text-neo-black'
    } else if (percentage >= 60) {
      statusLabel = 'Sedang (Cukup Dikuasai)'
      statusBadgeColor = 'bg-neo-blue text-neo-black'
    } else {
      statusLabel = 'Rendah (Butuh Penguatan)'
      statusBadgeColor = 'bg-neo-pink text-neo-black'
    }

    return {
      ...soal,
      id: soal.id || `${jenisTes}_${soal.nomor}`,
      totalPeserta,
      correctCount,
      bisaCount,
      opsiDistribution,
      praktikDistribution,
      percentage,
      rataPoin,
      maxPoin: soal.kategori === 'Pilihan Ganda' ? poinPerPG : poinPerPraktik,
      statusLabel,
      statusBadgeColor,
      isSampleData: totalPeserta === 0,
    }
  })
}

// Analisis Butir Soal per Sesi Aktif (Pre-Test atau Post-Test)
const itemAnalysisData = computed(() => {
  return calcItemAnalysis(activeItemTab.value)
})

const filteredItemAnalysis = computed(() => {
  if (itemKategoriFilter.value === 'Semua') return itemAnalysisData.value
  return itemAnalysisData.value.filter((i) => i.kategori === itemKategoriFilter.value)
})

const itemSummaryStats = computed(() => {
  const items = itemAnalysisData.value
  if (items.length === 0) return { meanRate: 0, highest: null, lowest: null }

  const totalRate = items.reduce((acc, curr) => acc + curr.percentage, 0)
  const meanRate = Math.round(totalRate / items.length)

  const sorted = [...items].sort((a, b) => b.percentage - a.percentage)
  const highest = sorted[0]
  const lowest = sorted[sorted.length - 1]

  return { meanRate, highest, lowest }
})

// Komparasi Butir Soal Pre vs Post (Perbandingan 12 Butir Indikator)
const komparasiButirList = computed(() => {
  const preList = bankSoalList.value
    .filter((s) => s.jenis_tes === 'Pre-Test')
    .sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0))
  const postList = bankSoalList.value
    .filter((s) => s.jenis_tes === 'Post-Test')
    .sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0))

  const totalPre = preTestItems.value.length
  const totalPost = postTestItems.value.length

  return preList.map((preSoal, idx) => {
    const postSoal = postList[idx] || preSoal

    let preRate = 0
    if (totalPre > 0) {
      if (preSoal.kategori === 'Pilihan Ganda') {
        const correct = preTestItems.value.filter((s) => (s.jawaban?.[preSoal.nomor] || s.jawaban?.[String(preSoal.nomor)]) === preSoal.kunci_jawaban).length
        preRate = Math.round((correct / totalPre) * 100)
      } else {
        const bisa = preTestItems.value.filter((s) => (s.jawaban?.[preSoal.nomor] || s.jawaban?.[String(preSoal.nomor)]) === 'Bisa').length
        preRate = Math.round((bisa / totalPre) * 100)
      }
    }

    let postRate = 0
    if (totalPost > 0) {
      if (postSoal.kategori === 'Pilihan Ganda') {
        const correct = postTestItems.value.filter((s) => (s.jawaban?.[postSoal.nomor] || s.jawaban?.[String(postSoal.nomor)]) === postSoal.kunci_jawaban).length
        postRate = Math.round((correct / totalPost) * 100)
      } else {
        const bisa = postTestItems.value.filter((s) => (s.jawaban?.[postSoal.nomor] || s.jawaban?.[String(postSoal.nomor)]) === 'Bisa').length
        postRate = Math.round((bisa / totalPost) * 100)
      }
    }

    const deltaGain = (totalPre > 0 && totalPost > 0) ? (postRate - preRate) : 0

    return {
      nomor: preSoal.nomor,
      kategori: preSoal.kategori,
      pertanyaanPre: preSoal.pertanyaan,
      pertanyaanPost: postSoal.pertanyaan,
      preRate,
      postRate,
      deltaGain,
    }
  })
})

// Download Laporan PDF (Integrasi html2canvas + jsPDF dengan Multi-Page Support)
const downloadPDF = async () => {
  const reportElement = document.getElementById('report-printable-area')
  if (!reportElement) return

  isGeneratingPdf.value = true
  pdfNotification.value = null

  try {
    // Tangkap visual area laporan dashboard
    const canvas = await html2canvas(reportElement, {
      scale: 1.8, // Kualitas optimal
      useCORS: true,
      backgroundColor: '#f8f8f2',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    let heightLeft = pdfHeight
    let position = 0

    // Halaman Pertama
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pageHeight

    // Halaman Tambahan Jika Konten Panjang
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight
    }
    
    const fileName = `Laporan_Analisis_PrePostTest_GoogleSites_${new Date().toISOString().slice(0, 10)}.pdf`
    pdf.save(fileName)

    pdfNotification.value = {
      type: 'success',
      message: `Laporan Analisis Lengkap (PDF) berhasil diunduh: "${fileName}"!`,
    }
  } catch (err) {
    console.error('Gagal generate PDF:', err)
    pdfNotification.value = {
      type: 'error',
      message: 'Gagal membuat file PDF: ' + err.message,
    }
  } finally {
    isGeneratingPdf.value = false
  }
}

// Download Laporan Excel Lengkap (.xlsx) dengan Sheet Terpisah Pre & Post Test dan Rincian Soal 1-12
const downloadExcel = () => {
  try {
    const fileName = exportLaporanExcelLengkap({
      listEvaluasi: listEvaluasi.value,
      bankSoalList: bankSoalList.value,
    })

    pdfNotification.value = {
      type: 'success',
      message: `Laporan Lengkap Excel (.xlsx) dengan Sheet Pre & Post Test terpisah dan rincian soal 1-12 berhasil diunduh: "${fileName}"!`,
    }
  } catch (err) {
    console.error('Gagal export Excel:', err)
    pdfNotification.value = {
      type: 'error',
      message: 'Gagal mengekspor file Excel: ' + err.message,
    }
  }
}
</script>

<template>
  <div class="space-y-8">
    <AdminNav title="ANALITIK & LAPORAN" />

    <!-- Action Header Card -->
    <header class="bg-neo-yellow border-3 border-neo-black p-4 sm:p-8 shadow-neo rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
      <div class="space-y-2">
        <div class="inline-block bg-neo-pink text-neo-black px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-xs font-bold uppercase border-2 border-neo-black shadow-neo rounded-md">
          Workshop Pembuatan Website Portfolio dengan Google Sites
        </div>
        <h1 class="font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-neo-black leading-none">
          Pre & Post Test • Analisis & Laporan
        </h1>
        <p class="text-xs sm:text-sm font-medium text-neo-black/80 max-w-xl">
          Visualisasi perbandingan capaian kompetensi pembuatan website portfolio Google Sites serta ekspor laporan resmi dalam format PDF dan Excel (.xlsx).
        </p>
      </div>

      <!-- Tombol Download Laporan PDF & Excel Bergaya Neo Brutalism -->
      <div class="flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
        <!-- Refresh Data -->
        <button
          @click="fetchEvaluasi"
          :disabled="isLoading"
          class="neo-button bg-white py-3 sm:py-3.5 px-3.5 sm:px-4 text-neo-black font-display text-base sm:text-lg uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shadow-neo hover:shadow-neo-hover w-full sm:w-auto font-bold"
          title="Refresh Data Submisi"
        >
          <span class="material-symbols-outlined text-[16px]" :class="{ 'animate-spin': isLoading }">refresh</span>
          <span>Refresh</span>
        </button>

        <!-- Download PDF -->
        <button
          @click="downloadPDF"
          :disabled="isGeneratingPdf"
          class="neo-button bg-neo-pink py-3 sm:py-3.5 px-4 sm:px-5 text-neo-black font-display text-base sm:text-lg uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-neo hover:shadow-neo-hover w-full sm:w-auto font-bold"
        >
          <span v-if="isGeneratingPdf" class="animate-spin inline-block w-4 h-4 border-2 border-neo-black border-t-transparent rounded-full"></span>
          <span v-else class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          <span>{{ isGeneratingPdf ? 'Membuat PDF...' : 'Export PDF' }}</span>
        </button>

        <!-- Download Excel -->
        <button
          @click="downloadExcel"
          class="neo-button bg-neo-green py-3 sm:py-3.5 px-4 sm:px-5 text-neo-black font-display text-base sm:text-lg uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-neo hover:shadow-neo-hover w-full sm:w-auto font-bold"
        >
          <span class="material-symbols-outlined text-[16px]">table_chart</span>
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>
    </header>

    <!-- Empty State Alert Jika Database Kosong -->
    <div
      v-if="listEvaluasi.length === 0 && !isLoading"
      class="p-4 sm:p-5 bg-white border-3 border-neo-black shadow-neo rounded-xl flex items-start sm:items-center gap-3.5"
    >
      <div class="text-3xl sm:text-4xl text-neo-black flex items-center justify-center">
        <span class="material-symbols-outlined text-4xl">inbox</span>
      </div>
      <div class="space-y-1">
        <h4 class="font-display text-base sm:text-lg uppercase tracking-wider text-neo-black">
          Database Submisi Peserta Kosong
        </h4>
        <p class="text-xs sm:text-sm font-medium text-neo-black/75 leading-relaxed">
          Seluruh data uji coba peserta telah dibersihkan. Grafik komparasi dan indikator penilaian saat ini bernilai 0 dan akan otomatis terisi secara realtime begitu peserta mulai mengumpulkan lembar jawaban Pre-Test atau Post-Test.
        </p>
      </div>
    </div>

    <!-- Notification Alert -->
    <div
      v-if="pdfNotification"
      :class="[
        'p-4 border-3 border-neo-black font-bold text-sm shadow-neo rounded-xl flex items-center justify-between gap-4',
        pdfNotification.type === 'success' ? 'bg-neo-green text-neo-black' : 'bg-[#ff6b6b] text-white'
      ]"
    >
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-base">{{ pdfNotification.type === 'success' ? 'check_circle' : 'warning' }}</span>
        <span>{{ pdfNotification.message }}</span>
      </div>
      <button @click="pdfNotification = null" class="cursor-pointer flex items-center">
        <span class="material-symbols-outlined text-base">close</span>
      </button>
    </div>

    <!-- AREA DOKUMEN LAPORAN YANG DITANGKAP OLEH html2canvas DAN jsPDF -->
    <div id="report-printable-area" class="space-y-8 bg-neo-bg p-4 sm:p-6 border-3 border-neo-black shadow-neo rounded-2xl">
      <!-- Kop Dokumen Laporan -->
      <div class="bg-white border-3 border-neo-black p-4 sm:p-6 shadow-neo rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-mono font-bold uppercase bg-neo-yellow px-2 py-0.5 border border-neo-black rounded-md">
            LAPORAN HASIL PRE & POST TEST
          </span>
          <h2 class="font-display text-2xl sm:text-3xl uppercase tracking-wider mt-1 text-neo-black">
            Workshop Pembuatan Website Portfolio dengan Google Sites
          </h2>
          <p class="text-xs font-mono font-bold text-neo-black/70">
            Dihasilkan pada: {{ new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }) }}
          </p>
        </div>

        <div class="flex items-center gap-2 border-2 border-neo-black bg-neo-bg p-2.5 sm:p-3 shrink-0 rounded-lg">
          <div class="w-8 h-8 bg-neo-yellow border-2 border-neo-black flex items-center justify-center font-display text-lg rounded-md">
            GS
          </div>
          <div class="text-xs font-bold leading-tight">
            <span>GOOGLE SITES</span><br />
            <span class="text-[10px] text-neo-black/60 font-mono">PORTFOLIO WORKSHOP</span>
          </div>
        </div>
      </div>

      <!-- Metrik Ringkas Perbandingan -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <!-- Rata-rata Pre-Test -->
        <div class="bg-white border-3 border-neo-black p-3.5 sm:p-5 shadow-neo rounded-xl">
          <div class="flex items-center justify-between">
            <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/60">Mean Pre-Test</span>
            <span class="w-2.5 h-2.5 bg-neo-pink border border-neo-black rounded-sm"></span>
          </div>
          <div class="font-display text-3xl sm:text-4xl md:text-5xl text-neo-black mt-1 leading-none">
            {{ rataTotalPre }}
          </div>
          <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/70 mt-1.5 sm:mt-2 block truncate">
            Submisi: {{ preTestItems.length }} Peserta
          </span>
        </div>

        <!-- Rata-rata Post-Test -->
        <div class="bg-white border-3 border-neo-black p-3.5 sm:p-5 shadow-neo rounded-xl">
          <div class="flex items-center justify-between">
            <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/60">Mean Post-Test</span>
            <span class="w-2.5 h-2.5 bg-neo-blue border border-neo-black rounded-sm"></span>
          </div>
          <div class="font-display text-3xl sm:text-4xl md:text-5xl text-neo-black mt-1 leading-none">
            {{ rataTotalPost }}
          </div>
          <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/70 mt-1.5 sm:mt-2 block truncate">
            Submisi: {{ postTestItems.length }} Peserta
          </span>
        </div>

        <!-- Peningkatan Rata-rata -->
        <div class="bg-neo-green border-3 border-neo-black p-3.5 sm:p-5 shadow-neo rounded-xl">
          <div class="flex items-center justify-between">
            <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/80">Peningkatan</span>
            <span class="material-symbols-outlined text-sm font-bold">trending_up</span>
          </div>
          <div class="font-display text-3xl sm:text-4xl md:text-5xl text-neo-black mt-1 leading-none">
            +{{ peningkatan }}
          </div>
          <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/80 mt-1.5 sm:mt-2 block truncate">
            Gain Skor Pembelajaran
          </span>
        </div>

        <!-- Total Submisi -->
        <div class="bg-neo-yellow border-3 border-neo-black p-3.5 sm:p-5 shadow-neo rounded-xl">
          <div class="flex items-center justify-between">
            <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-neo-black/80">Total Evaluasi</span>
            <span class="w-2.5 h-2.5 bg-neo-black border border-neo-black rounded-sm"></span>
          </div>
          <div class="font-display text-3xl sm:text-4xl md:text-5xl text-neo-black mt-1 leading-none">
            {{ listEvaluasi.length }}
          </div>
          <span class="text-[10px] sm:text-[11px] font-bold text-neo-black/80 mt-1.5 sm:mt-2 block truncate">
            Submisi Terekam
          </span>
        </div>
      </div>

      <!-- BAR CHART CONTAINER DENGAN BORDER TEBAL BRUTALISM -->
      <section class="bg-white border-3 border-neo-black p-4 sm:p-6 md:p-8 shadow-neo rounded-2xl space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2 border-b-2 border-neo-black pb-3">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 bg-neo-pink border-2 border-neo-black rounded-sm"></span>
            <h3 class="font-display text-2xl sm:text-3xl uppercase tracking-wider text-neo-black">
              Grafik Komparasi Rata-Rata Nilai
            </h3>
          </div>
          <div class="flex items-center gap-3 text-xs font-bold">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-neo-pink border border-neo-black rounded-sm"></span> Pre-Test</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 bg-neo-blue border border-neo-black rounded-sm"></span> Post-Test</span>
          </div>
        </div>

        <!-- Canvas Chart Box dengan Border Tebal Hitam Khas Neo Brutalism -->
        <div class="border-3 border-neo-black bg-neo-bg p-2.5 sm:p-6 shadow-neo rounded-xl min-h-[280px] h-[300px] sm:min-h-[360px] sm:h-[380px]">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </section>

      <!-- TABEL RINGKASAN DATA KOMPARATIF -->
      <section class="bg-white border-3 border-neo-black p-4 sm:p-6 shadow-neo rounded-2xl space-y-4">
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 bg-neo-yellow border-2 border-neo-black rounded-sm"></span>
          <h3 class="font-display text-xl sm:text-2xl uppercase tracking-wider">
            Tabel Ringkasan Analitik
          </h3>
        </div>

        <div class="overflow-x-auto border-3 border-neo-black rounded-xl overflow-hidden shadow-neo">
          <table class="w-full border-collapse text-left text-xs sm:text-sm min-w-[560px]">
            <thead>
              <tr class="bg-neo-black text-neo-bg border-b-3 border-neo-black">
                <th class="p-3 border-r-2 border-white/20 font-display text-base uppercase">Indikator Penilaian</th>
                <th class="p-3 border-r-2 border-white/20 font-display text-base uppercase text-center bg-neo-pink text-neo-black">Pre-Test</th>
                <th class="p-3 border-r-2 border-white/20 font-display text-base uppercase text-center bg-neo-blue text-neo-black">Post-Test</th>
                <th class="p-3 font-display text-base uppercase text-center bg-neo-green text-neo-black">Selisih (+Gain)</th>
              </tr>
            </thead>
            <tbody class="divide-y-2 divide-neo-black font-medium">
              <tr class="hover:bg-neo-bg">
                <td class="p-3 border-r-2 border-neo-black font-bold">Total Nilai Rata-Rata (Maks 100)</td>
                <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">{{ rataTotalPre }}</td>
                <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">{{ rataTotalPost }}</td>
                <td class="p-3 text-center font-mono font-bold text-neo-green bg-neo-green/10">+{{ peningkatan }}</td>
              </tr>
              <tr class="hover:bg-neo-bg">
                <td class="p-3 border-r-2 border-neo-black font-bold">Rata-Rata Konsep Pilihan Ganda (Maks 70)</td>
                <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">{{ rataPGPre }}</td>
                <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">{{ rataPGPost }}</td>
                <td class="p-3 text-center font-mono font-bold text-neo-green bg-neo-green/10">+{{ Math.round((rataPGPost - rataPGPre) * 10) / 10 }}</td>
              </tr>
              <tr class="hover:bg-neo-bg">
                <td class="p-3 border-r-2 border-neo-black font-bold">Rata-Rata Penilaian Diri Praktik (Maks 30)</td>
                <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">{{ rataPraktikPre }}</td>
                <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">{{ rataPraktikPost }}</td>
                <td class="p-3 text-center font-mono font-bold text-neo-green bg-neo-green/10">+{{ Math.round((rataPraktikPost - rataPraktikPre) * 10) / 10 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ======================================================== -->
      <!-- SEKSI ANALISIS RATA-RATA JAWABAN PERSOAL (ITEM ANALYSIS) -->
      <!-- ======================================================== -->
      <section class="bg-white border-3 border-neo-black p-4 sm:p-6 md:p-8 shadow-neo rounded-2xl space-y-4 sm:space-y-6">
        <!-- Header & Nav Tabs -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-neo-black pb-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 bg-neo-pink border-2 border-neo-black rounded-sm"></span>
              <span class="text-xs font-mono font-bold uppercase bg-neo-yellow px-2 py-0.5 border border-neo-black rounded-md">
                ITEM ANALYSIS • EVALUASI SOAL
              </span>
            </div>
            <h3 class="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-neo-black">
              Analisis Rata-Rata Jawaban Per Butir Soal
            </h3>
            <p class="text-xs sm:text-sm font-medium text-neo-black/80">
              Tinjauan mendalam persentase ketercapaian, rerata poin, dan sebaran respon peserta pada masing-masing butir instrumen workshop.
            </p>
          </div>

          <!-- Tab Pemilih Sesi & Komparasi -->
          <div class="flex items-center gap-1.5 border-3 border-neo-black bg-neo-bg p-1.5 flex-wrap self-start md:self-auto w-full md:w-auto rounded-xl">
            <button
              type="button"
              @click="activeItemTab = 'Pre-Test'"
              :class="[
                'flex-1 sm:flex-initial text-center px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-display text-xs sm:text-base uppercase tracking-wider transition-all cursor-pointer border-2 border-transparent inline-flex items-center justify-center gap-1 rounded-lg',
                activeItemTab === 'Pre-Test' ? 'bg-neo-pink text-neo-black font-bold border-neo-black shadow-neo' : 'hover:bg-white text-neo-black/70'
              ]"
            >
              <span class="material-symbols-outlined text-[16px]">assignment</span>
              <span>Pre-Test</span>
            </button>
            <button
              type="button"
              @click="activeItemTab = 'Post-Test'"
              :class="[
                'flex-1 sm:flex-initial text-center px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-display text-xs sm:text-base uppercase tracking-wider transition-all cursor-pointer border-2 border-transparent inline-flex items-center justify-center gap-1 rounded-lg',
                activeItemTab === 'Post-Test' ? 'bg-neo-blue text-neo-black font-bold border-neo-black shadow-neo' : 'hover:bg-white text-neo-black/70'
              ]"
            >
              <span class="material-symbols-outlined text-[16px]">rocket_launch</span>
              <span>Post-Test</span>
            </button>
            <button
              type="button"
              @click="activeItemTab = 'Komparasi'"
              :class="[
                'flex-1 sm:flex-initial text-center px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-display text-xs sm:text-base uppercase tracking-wider transition-all cursor-pointer border-2 border-transparent inline-flex items-center justify-center gap-1 rounded-lg',
                activeItemTab === 'Komparasi' ? 'bg-neo-yellow text-neo-black font-bold border-neo-black shadow-neo' : 'hover:bg-white text-neo-black/70'
              ]"
            >
              <span class="material-symbols-outlined text-[16px]">compare_arrows</span>
              <span>Gain Pre vs Post</span>
            </button>
          </div>
        </div>

        <!-- Filter Kategori & Info Status (Untuk Mode Pre/Post) -->
        <div v-if="activeItemTab !== 'Komparasi'" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <!-- Filter Kategori -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold uppercase shrink-0">Filter Kategori:</span>
            <button
              v-for="kat in ['Semua', 'Pilihan Ganda', 'Praktik']"
              :key="kat"
              @click="itemKategoriFilter = kat"
              :class="[
                'px-3 py-1 text-xs font-bold uppercase border-2 border-neo-black transition-all cursor-pointer rounded-lg',
                itemKategoriFilter === kat ? 'bg-neo-black text-neo-bg shadow-neo' : 'bg-neo-bg hover:bg-white'
              ]"
            >
              {{ kat }}
            </button>
          </div>

          <!-- Status Sumber Data -->
          <div class="text-xs font-mono font-bold">
            <span v-if="itemAnalysisData[0]?.isSampleData" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neo-yellow border-2 border-neo-black rounded-md">
              <span class="material-symbols-outlined text-[15px]">info</span>
              <span>Data Rujukan Standar (0 Submisi Riil)</span>
            </span>
            <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neo-green border-2 border-neo-black rounded-md">
              <span class="material-symbols-outlined text-[15px]">check_circle</span>
              <span>Berdasarkan {{ itemAnalysisData[0]?.totalPeserta }} Peserta Riil</span>
            </span>
          </div>
        </div>

        <!-- 3 Highlight Metrics Card -->
        <div v-if="activeItemTab !== 'Komparasi'" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-neo-bg border-3 border-neo-black p-4 shadow-neo rounded-xl">
            <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Rata-Rata Ketercapaian Butir</span>
            <div class="font-display text-4xl text-neo-black mt-1 leading-none">{{ itemSummaryStats.meanRate }}%</div>
            <span class="text-[11px] font-bold text-neo-black/70 mt-1 block">Rerata Seluruh Butir Soal {{ activeItemTab }}</span>
          </div>

          <div class="bg-neo-green/30 border-3 border-neo-black p-4 shadow-neo rounded-xl">
            <span class="text-xs font-mono font-bold uppercase text-neo-black/70 block">Indikator Paling Dikuasai</span>
            <div class="font-display text-3xl text-neo-black mt-1 leading-none">
              Soal #{{ itemSummaryStats.highest?.nomor }} ({{ itemSummaryStats.highest?.percentage }}%)
            </div>
            <span class="text-[11px] font-bold text-neo-black/70 mt-1 truncate block">
              {{ itemSummaryStats.highest?.pertanyaan }}
            </span>
          </div>

          <div class="bg-neo-pink/30 border-3 border-neo-black p-4 shadow-neo rounded-xl">
            <span class="text-xs font-mono font-bold uppercase text-neo-black/70 block">Butuh Penguatan / Terendah</span>
            <div class="font-display text-3xl text-neo-black mt-1 leading-none">
              Soal #{{ itemSummaryStats.lowest?.nomor }} ({{ itemSummaryStats.lowest?.percentage }}%)
            </div>
            <span class="text-[11px] font-bold text-neo-black/70 mt-1 truncate block">
              {{ itemSummaryStats.lowest?.pertanyaan }}
            </span>
          </div>
        </div>

        <!-- GRID KARTU DETAIL PERSOAL (Untuk Pre-Test & Post-Test) -->
        <div v-if="activeItemTab !== 'Komparasi'" class="space-y-4">
          <div
            v-for="soal in filteredItemAnalysis"
            :key="soal.id"
            class="border-3 border-neo-black bg-neo-bg p-3.5 sm:p-5 shadow-neo rounded-xl space-y-3 sm:space-y-4 transition-all"
          >
            <!-- Bar Atas Kartu Soal -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-neo-black pb-3">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  :class="[
                    'px-3 py-1 font-display text-xl uppercase tracking-wider border-2 border-neo-black shadow-neo rounded-lg',
                    soal.jenis_tes === 'Pre-Test' ? 'bg-neo-pink text-neo-black' : 'bg-neo-blue text-neo-black'
                  ]"
                >
                  {{ soal.jenis_tes }} #{{ soal.nomor }}
                </span>
                <span class="bg-neo-black text-neo-bg px-2.5 py-0.5 font-mono text-xs font-bold uppercase rounded-md">
                  {{ soal.kategori }}
                </span>
                <span v-if="soal.kategori === 'Pilihan Ganda'" class="bg-neo-yellow border border-neo-black px-2 py-0.5 font-mono text-xs font-bold rounded-md">
                  Kunci: <strong>{{ soal.kunci_jawaban }}</strong>
                </span>
              </div>

              <!-- Skor Rata-rata & Status Badge -->
              <div class="flex items-center gap-2">
                <span :class="['px-2.5 py-1 font-mono text-xs font-bold uppercase border-2 border-neo-black shadow-neo rounded-lg', soal.statusBadgeColor]">
                  {{ soal.statusLabel }}
                </span>
                <button
                  type="button"
                  @click="toggleExpandQuestion(soal.id)"
                  class="px-2.5 py-1 text-xs font-bold uppercase border-2 border-neo-black bg-white hover:bg-neo-yellow transition-all shadow-neo cursor-pointer inline-flex items-center gap-1 rounded-lg"
                >
                  <span>{{ expandedQuestionId === soal.id ? 'Tutup Opsi' : 'Rincian Opsi' }}</span>
                  <span class="material-symbols-outlined text-[15px]">{{ expandedQuestionId === soal.id ? 'expand_less' : 'expand_more' }}</span>
                </button>
              </div>
            </div>

            <!-- Teks Pertanyaan -->
            <p class="font-bold text-sm sm:text-base text-neo-black leading-snug">
              {{ soal.pertanyaan }}
            </p>

            <!-- Visual Progress Ketercapaian -->
            <div class="space-y-1.5 bg-white border-2 border-neo-black p-3.5 shadow-neo rounded-xl">
              <div class="flex items-center justify-between text-xs font-mono font-bold flex-wrap gap-1">
                <span>RATA-RATA KEBERHASILAN (BENAR / BISA):</span>
                <span class="text-sm font-bold">
                  {{ soal.percentage }}% (Rerata: {{ soal.rataPoin }} / {{ soal.maxPoin }} Poin)
                </span>
              </div>

              <!-- Neo Brutalism Progress Bar -->
              <div class="w-full h-5 bg-neo-bg border-2 border-neo-black overflow-hidden relative rounded-full">
                <div
                  :style="{ width: `${soal.percentage}%` }"
                  :class="[
                    'h-full border-r-2 border-neo-black transition-all duration-500 rounded-full',
                    soal.percentage >= 80 ? 'bg-neo-green' : soal.percentage >= 60 ? 'bg-neo-blue' : 'bg-neo-pink'
                  ]"
                ></div>
              </div>
            </div>

            <!-- Breakdown Distribusi Opsi Jawaban (Expandable / Toggleable) -->
            <div v-if="expandedQuestionId === soal.id" class="pt-2 border-t-2 border-neo-black/20 space-y-3">
              <span class="text-xs font-mono font-bold uppercase text-neo-black/70 block">
                SEBARAN DISTRIBUSI PILIHAN JAWABAN PESERTA:
              </span>

              <!-- Opsi Pilihan Ganda -->
              <div v-if="soal.kategori === 'Pilihan Ganda'" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  v-for="item in getSortedOpsi(soal.opsi)"
                  :key="item.key"
                  :class="[
                    'p-3 border-2 border-neo-black text-xs space-y-1.5 transition-all rounded-lg',
                    item.key === soal.kunci_jawaban ? 'bg-neo-green/30 font-bold border-neo-black' : 'bg-white'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-sm flex items-center gap-1">
                      <span>[{{ item.key }}]</span>
                      <span v-if="item.key === soal.kunci_jawaban" class="inline-flex items-center text-xs text-green-700 gap-0.5">
                        <span class="material-symbols-outlined text-[13px]">check</span>
                        <span>Kunci Benar</span>
                      </span>
                    </span>
                    <span class="font-mono font-bold bg-neo-black text-white px-1.5 py-0.5 text-[11px] rounded-md">
                      {{ soal.opsiDistribution[item.key] || 0 }} Respon ({{ soal.totalPeserta > 0 ? Math.round(((soal.opsiDistribution[item.key] || 0) / soal.totalPeserta) * 100) : 0 }}%)
                    </span>
                  </div>
                  <p class="text-neo-black/80 font-medium leading-tight">
                    {{ item.teks }}
                  </p>
                </div>
              </div>

              <!-- Opsi Praktik / Penilaian Diri -->
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 border-2 border-neo-black bg-neo-green/30 space-y-1 text-xs rounded-lg">
                  <div class="flex items-center justify-between font-bold font-mono">
                    <span class="inline-flex items-center gap-1">
                      <span class="material-symbols-outlined text-[15px] text-green-700">thumb_up</span>
                      <span>Menjawab 'Bisa'</span>
                    </span>
                    <span class="bg-neo-black text-white px-2 py-0.5 rounded-md">{{ soal.praktikDistribution['Bisa'] }} Respon</span>
                  </div>
                  <p class="font-medium text-neo-black/80">Peserta menguasai indikator portofolio ini.</p>
                </div>

                <div class="p-3 border-2 border-neo-black bg-neo-pink/30 space-y-1 text-xs rounded-lg">
                  <div class="flex items-center justify-between font-bold font-mono">
                    <span class="inline-flex items-center gap-1">
                      <span class="material-symbols-outlined text-[15px] text-red-700">thumb_down</span>
                      <span>Menjawab 'Belum Bisa'</span>
                    </span>
                    <span class="bg-neo-black text-white px-2 py-0.5 rounded-md">{{ soal.praktikDistribution['Belum Bisa'] }} Respon</span>
                  </div>
                  <p class="font-medium text-neo-black/80">Peserta memerlukan pendampingan materi lebih lanjut.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABEL MATRIKS LENGKAP ANALISIS BUTIR SOAL (Included in Printable Area) -->
        <div v-if="activeItemTab !== 'Komparasi'" class="space-y-3 pt-4 border-t-3 border-neo-black">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h4 class="font-display text-2xl uppercase tracking-wider text-neo-black">
              Tabel Matriks Ketercapaian Butir Soal ({{ activeItemTab }})
            </h4>
            <span class="text-xs font-mono font-bold text-neo-black/60">
              Format Standar Laporan Evaluasi Pelatihan
            </span>
          </div>

          <div class="overflow-x-auto border-3 border-neo-black bg-white shadow-neo rounded-xl overflow-hidden">
            <table class="w-full border-collapse text-left text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr class="bg-neo-black text-neo-bg">
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center w-12">No</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase">Teks Pertanyaan / Indikator</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center w-28">Kategori</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center w-20">Kunci</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center w-28">Ketercapaian</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center w-24">Rerata Skor</th>
                  <th class="p-3 font-display text-sm uppercase text-center w-36">Kategori Mutu</th>
                </tr>
              </thead>
              <tbody class="divide-y-2 divide-neo-black font-medium">
                <tr
                  v-for="item in filteredItemAnalysis"
                  :key="item.id"
                  class="hover:bg-neo-bg transition-colors"
                >
                  <td class="p-3 border-r-2 border-neo-black font-mono font-bold text-center bg-neo-yellow/30">
                    #{{ item.nomor }}
                  </td>
                  <td class="p-3 border-r-2 border-neo-black font-medium">
                    {{ item.pertanyaan }}
                  </td>
                  <td class="p-3 border-r-2 border-neo-black text-center font-mono text-xs">
                    {{ item.kategori }}
                  </td>
                  <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">
                    {{ item.kunci_jawaban || '-' }}
                  </td>
                  <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">
                    {{ item.percentage }}%
                  </td>
                  <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">
                    {{ item.rataPoin }} / {{ item.maxPoin }}
                  </td>
                  <td class="p-3 text-center">
                    <span :class="['px-2 py-0.5 border border-neo-black font-mono text-[11px] font-bold uppercase inline-block rounded-md', item.statusBadgeColor]">
                      {{ item.statusLabel.split(' ')[0] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- MODE TAB 3: TABEL MATRIKS KOMPARASI PRE VS POST (GAIN PER BUTIR INDIKATOR) -->
        <div v-else class="space-y-4">
          <div class="border-l-4 border-neo-pink bg-white p-4 border-3 border-neo-black shadow-neo rounded-xl">
            <h4 class="font-display text-2xl uppercase tracking-wider text-neo-black">
              Matriks Peningkatan Capaian Indikator (Pre vs Post)
            </h4>
            <p class="text-xs sm:text-sm font-medium text-neo-black/80">
              Membandingkan peningkatan rata-rata persentase keberhasilan siswa sebelum dan sesudah workshop untuk setiap butir kompetensi Google Sites.
            </p>
          </div>

          <div class="overflow-x-auto border-3 border-neo-black bg-white shadow-neo rounded-xl overflow-hidden">
            <table class="w-full border-collapse text-left text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr class="bg-neo-black text-neo-bg">
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center w-12">No</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase">Kompetensi Indikator Butir</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center w-28">Kategori</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center bg-neo-pink text-neo-black w-24">Pre-Test</th>
                  <th class="p-3 border-r-2 border-white/20 font-display text-sm uppercase text-center bg-neo-blue text-neo-black w-24">Post-Test</th>
                  <th class="p-3 font-display text-sm uppercase text-center bg-neo-green text-neo-black w-28">Gain Peningkatan</th>
                </tr>
              </thead>
              <tbody class="divide-y-2 divide-neo-black font-medium">
                <tr
                  v-for="k in komparasiButirList"
                  :key="k.nomor"
                  class="hover:bg-neo-bg transition-colors"
                >
                  <td class="p-3 border-r-2 border-neo-black font-mono font-bold text-center bg-neo-yellow/30">
                    #{{ k.nomor }}
                  </td>
                  <td class="p-3 border-r-2 border-neo-black space-y-1">
                    <p class="font-bold text-xs">{{ k.pertanyaanPost }}</p>
                    <p class="text-[11px] text-neo-black/60 italic">Pre: {{ k.pertanyaanPre }}</p>
                  </td>
                  <td class="p-3 border-r-2 border-neo-black text-center font-mono text-xs">
                    {{ k.kategori }}
                  </td>
                  <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">
                    {{ k.preRate }}%
                  </td>
                  <td class="p-3 border-r-2 border-neo-black text-center font-mono font-bold">
                    {{ k.postRate }}%
                  </td>
                  <td class="p-3 text-center font-mono font-bold bg-neo-green/10 text-neo-black">
                    <span class="inline-block px-2 py-0.5 bg-neo-green border border-neo-black text-xs rounded-md">
                      +{{ k.deltaGain }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
