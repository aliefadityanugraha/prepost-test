<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminNav from '../../components/AdminNav.vue'
import { db } from '../../firebase'
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { allBankSoal, runSeeder } from '../../utils/seeder'
import { getSortedOpsi } from '../../utils/scoring'

const soalList = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const notification = ref(null)
const filterKategori = ref('Semua')
const filterJenisTes = ref('Semua')
const searchQuery = ref('')

// State Modal Form (Create / Edit)
const isModalOpen = ref(false)
const isEditMode = ref(false)
const currentDocId = ref(null)

const formData = ref({
  nomor: 1,
  kategori: 'Pilihan Ganda',
  jenis_tes: 'Pre-Test',
  pertanyaan: '',
  opsiA: '',
  opsiB: '',
  opsiC: '',
  opsiD: '',
  kunci_jawaban: 'A',
})

// State Konfirmasi Hapus
const deleteConfirmItem = ref(null)

onMounted(async () => {
  await fetchBankSoal()
})

const fetchBankSoal = async () => {
  isLoading.value = true
  notification.value = null
  try {
    const snap = await getDocs(collection(db, 'bank_soal'))
    const list = []
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() })
    })

    if (list.length > 0) {
      soalList.value = list.sort((a, b) => {
        if (a.jenis_tes !== b.jenis_tes) {
          return a.jenis_tes === 'Pre-Test' ? -1 : 1
        }
        return (Number(a.nomor) || 0) - (Number(b.nomor) || 0)
      })
    } else {
      // Fallback ke seeder jika Firestore masih kosong
      soalList.value = [...allBankSoal]
    }
  } catch (err) {
    console.warn('Gagal fetch Firestore bank_soal, menggunakan data seeder lokal:', err)
    soalList.value = [...allBankSoal]
  } finally {
    isLoading.value = false
  }
}

const filteredSoal = computed(() => {
  return soalList.value.filter((soal) => {
    const matchJenis = filterJenisTes.value === 'Semua' || soal.jenis_tes === filterJenisTes.value
    const matchKategori = filterKategori.value === 'Semua' || soal.kategori === filterKategori.value
    const matchSearch = (soal.pertanyaan || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchJenis && matchKategori && matchSearch
  })
})

const totalPreTest = computed(() => soalList.value.filter((s) => s.jenis_tes === 'Pre-Test').length)
const totalPostTest = computed(() => soalList.value.filter((s) => s.jenis_tes === 'Post-Test').length)
const totalPG = computed(() => soalList.value.filter((s) => s.kategori === 'Pilihan Ganda').length)
const totalPraktik = computed(() => soalList.value.filter((s) => s.kategori === 'Praktik').length)

// Buka Modal Tambah Baru
const openCreateModal = () => {
  isEditMode.value = false
  currentDocId.value = null
  const targetJenis = filterJenisTes.value !== 'Semua' ? filterJenisTes.value : 'Pre-Test'
  const sameTypeSoal = soalList.value.filter((s) => s.jenis_tes === targetJenis)
  const nextNomor = sameTypeSoal.length > 0 ? Math.max(...sameTypeSoal.map((s) => Number(s.nomor) || 0)) + 1 : 1

  formData.value = {
    nomor: nextNomor,
    kategori: 'Pilihan Ganda',
    jenis_tes: targetJenis,
    pertanyaan: '',
    opsiA: '',
    opsiB: '',
    opsiC: '',
    opsiD: '',
    kunci_jawaban: 'A',
  }
  isModalOpen.value = true
}

// Buka Modal Edit
const openEditModal = (soal) => {
  isEditMode.value = true
  const prefix = soal.jenis_tes === 'Pre-Test' ? 'pre' : 'post'
  currentDocId.value = soal.id || `${prefix}_soal_${soal.nomor}`
  formData.value = {
    nomor: soal.nomor || 1,
    kategori: soal.kategori || 'Pilihan Ganda',
    jenis_tes: soal.jenis_tes || 'Pre-Test',
    pertanyaan: soal.pertanyaan || '',
    opsiA: soal.opsi?.A || '',
    opsiB: soal.opsi?.B || '',
    opsiC: soal.opsi?.C || '',
    opsiD: soal.opsi?.D || '',
    kunci_jawaban: soal.kunci_jawaban || 'A',
  }
  isModalOpen.value = true
}

// Simpan Data (Create / Update)
const handleSubmit = async () => {
  if (!formData.value.pertanyaan.trim()) {
    alert('Kalimat pertanyaan tidak boleh kosong!')
    return
  }

  isSubmitting.value = true
  notification.value = null

  try {
    const prefix = formData.value.jenis_tes === 'Pre-Test' ? 'pre' : 'post'
    const docId = isEditMode.value && currentDocId.value ? currentDocId.value : `${prefix}_soal_${formData.value.nomor}`

    const payload = {
      nomor: Number(formData.value.nomor),
      kategori: formData.value.kategori,
      jenis_tes: formData.value.jenis_tes,
      pertanyaan: formData.value.pertanyaan.trim(),
      updated_at: serverTimestamp(),
    }

    if (formData.value.kategori === 'Pilihan Ganda') {
      payload.opsi = {
        A: formData.value.opsiA.trim() || 'Opsi A',
        B: formData.value.opsiB.trim() || 'Opsi B',
        C: formData.value.opsiC.trim() || 'Opsi C',
        D: formData.value.opsiD.trim() || 'Opsi D',
      }
      payload.kunci_jawaban = formData.value.kunci_jawaban
      payload.bobot = 1
    } else {
      payload.opsi = ['Bisa', 'Belum Bisa']
      payload.kunci_jawaban = null
      payload.bobot = 1
    }

    // Simpan ke Firestore
    try {
      const docRef = doc(db, 'bank_soal', docId)
      const setPromise = setDoc(docRef, payload, { merge: true })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 2000)
      )
      await Promise.race([setPromise, timeoutPromise])
    } catch (fsErr) {
      console.warn('Firestore offline/demo fallback:', fsErr)
    }

    // Perbarui state lokal
    if (isEditMode.value) {
      const idx = soalList.value.findIndex((s) => s.id === docId || s.nomor === payload.nomor)
      if (idx !== -1) {
        soalList.value[idx] = { id: docId, ...payload }
      }
      notification.value = { type: 'success', message: `Soal #${payload.nomor} berhasil diperbarui!` }
    } else {
      soalList.value.push({ id: docId, ...payload })
      soalList.value.sort((a, b) => a.nomor - b.nomor)
      notification.value = { type: 'success', message: `Soal #${payload.nomor} berhasil ditambahkan ke bank soal!` }
    }

    isModalOpen.value = false
  } catch (err) {
    console.error(err)
    notification.value = { type: 'error', message: 'Gagal menyimpan soal: ' + err.message }
  } finally {
    isSubmitting.value = false
  }
}

// Konfirmasi Hapus
const confirmDelete = (soal) => {
  deleteConfirmItem.value = soal
}

const executeDelete = async () => {
  if (!deleteConfirmItem.value) return
  const item = deleteConfirmItem.value
  const docId = item.id || `soal_${item.nomor}`

  try {
    try {
      const delPromise = deleteDoc(doc(db, 'bank_soal', docId))
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 2000)
      )
      await Promise.race([delPromise, timeoutPromise])
    } catch (fsErr) {
      console.warn('Firestore delete offline/demo mode:', fsErr)
    }

    soalList.value = soalList.value.filter((s) => (s.id || `soal_${s.nomor}`) !== docId && s.nomor !== item.nomor)
    notification.value = { type: 'success', message: `Soal #${item.nomor} berhasil dihapus dari bank soal.` }
  } catch (err) {
    notification.value = { type: 'error', message: 'Gagal menghapus soal: ' + err.message }
  } finally {
    deleteConfirmItem.value = null
  }
}

const handleReSeed = async () => {
  isLoading.value = true
  notification.value = null
  try {
    await runSeeder()
    await fetchBankSoal()
    notification.value = { type: 'success', message: 'Bank soal berhasil di-reset ke 12 butir standar portofolio!' }
  } catch (err) {
    notification.value = { type: 'error', message: 'Gagal reset data: ' + err.message }
    isLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <AdminNav title="BANK SOAL (CRUD)" />

    <!-- Header Section -->
    <header class="bg-neo-yellow border-3 border-neo-black p-4 sm:p-8 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
      <div class="space-y-2">
        <div class="inline-block bg-neo-pink text-neo-black px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-xs font-bold uppercase border-2 border-neo-black shadow-neo">
          Workshop Pembuatan Website Portfolio dengan Google Sites
        </div>
        <h1 class="font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-neo-black leading-none">
          Bank Soal Pre & Post Test
        </h1>
        <p class="text-xs sm:text-sm font-medium text-neo-black/80 max-w-xl">
          Kelola pertanyaan, opsi jawaban, dan kunci instrumen evaluasi pembuatan website portfolio dengan Google Sites.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
        <button
          @click="openCreateModal"
          class="neo-button bg-neo-pink px-4 sm:px-5 py-2.5 sm:py-3 text-xs uppercase tracking-wider text-neo-black font-bold cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          <span>Tambah Soal Baru</span>
        </button>
        <button
          @click="handleReSeed"
          class="neo-button bg-white px-4 py-2.5 sm:py-3 text-xs uppercase tracking-wider text-neo-black font-bold cursor-pointer text-center flex items-center justify-center gap-1.5"
        >
          <span class="material-symbols-outlined text-base">restart_alt</span>
          <span>Reset ke 12 Soal Standar</span>
        </button>
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
      <button @click="notification = null" class="cursor-pointer flex items-center">
        <span class="material-symbols-outlined text-base">close</span>
      </button>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white border-3 border-neo-black p-4 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Total Instrumen</span>
        <div class="font-display text-3xl sm:text-4xl text-neo-black mt-1 leading-none">{{ soalList.length }}</div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-1 block">Semua Butir Soal</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-4 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Pre-Test</span>
        <div class="font-display text-3xl sm:text-4xl text-neo-pink mt-1 leading-none">{{ totalPreTest }}</div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-1 block">Awal Workshop</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-4 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">Post-Test</span>
        <div class="font-display text-3xl sm:text-4xl text-neo-yellow mt-1 leading-none">{{ totalPostTest }}</div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-1 block">Akhir Workshop</span>
      </div>

      <div class="bg-white border-3 border-neo-black p-4 shadow-neo">
        <span class="text-xs font-mono font-bold uppercase text-neo-black/60 block">PG / Praktik</span>
        <div class="font-display text-2xl sm:text-3xl text-neo-blue mt-1 leading-none">{{ totalPG }} / {{ totalPraktik }}</div>
        <span class="text-[11px] font-bold text-neo-black/70 mt-1 block">Proporsi Instrumen</span>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="bg-white border-3 border-neo-black p-4 sm:p-6 shadow-neo space-y-3">
      <!-- Search -->
      <div class="w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari kalimat pertanyaan soal..."
          class="w-full px-4 py-2.5 bg-neo-bg border-3 border-neo-black text-sm font-medium focus:bg-white focus:outline-none focus:shadow-neo transition-all"
        />
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-t-2 border-neo-black/20">
        <!-- Filter Jenis Sesi Tes -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-bold uppercase shrink-0">Sesi:</span>
          <button
            v-for="jenis in ['Semua', 'Pre-Test', 'Post-Test']"
            :key="jenis"
            @click="filterJenisTes = jenis"
            :class="[
              'px-3 py-1 text-xs font-bold uppercase border-2 border-neo-black transition-all cursor-pointer',
              filterJenisTes === jenis ? 'bg-neo-pink text-neo-black shadow-neo' : 'bg-neo-bg hover:bg-white'
            ]"
          >
            {{ jenis }}
          </button>
        </div>

        <!-- Filter Kategori -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-bold uppercase shrink-0">Kategori:</span>
          <button
            v-for="kat in ['Semua', 'Pilihan Ganda', 'Praktik']"
            :key="kat"
            @click="filterKategori = kat"
            :class="[
              'px-3 py-1 text-xs font-bold uppercase border-2 border-neo-black transition-all cursor-pointer',
              filterKategori === kat ? 'bg-neo-blue text-neo-black shadow-neo' : 'bg-neo-bg hover:bg-white'
            ]"
          >
            {{ kat }}
          </button>
        </div>
      </div>
    </div>

    <!-- List Soal Cards -->
    <div v-if="isLoading" class="bg-white border-3 border-neo-black p-12 text-center shadow-neo">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-neo-black border-t-transparent rounded-full mb-3"></div>
      <p class="font-display text-2xl uppercase tracking-wider">Memuat Bank Soal...</p>
    </div>

    <div v-else-if="filteredSoal.length === 0" class="bg-white border-3 border-neo-black p-12 text-center shadow-neo">
      <div class="font-display text-3xl uppercase tracking-wider mb-2">Tidak Ada Soal Ditemukan</div>
      <p class="text-xs text-neo-black/70">Sesuaikan filter atau klik tombol "Tambah Soal Baru" di atas.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="soal in filteredSoal"
        :key="soal.id || `${soal.jenis_tes}_${soal.nomor}`"
        class="bg-white border-3 border-neo-black p-4 sm:p-6 shadow-neo space-y-4 transition-all hover:border-neo-black hover:translate-x-0.5"
      >
        <!-- Card Top Bar -->
        <div class="flex items-center justify-between flex-wrap gap-2 border-b-2 border-neo-black pb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              :class="[
                'px-2.5 py-1 font-display text-lg uppercase tracking-wider border-2 border-neo-black shadow-neo',
                soal.jenis_tes === 'Pre-Test' ? 'bg-neo-pink text-neo-black' : 'bg-neo-yellow text-neo-black'
              ]"
            >
              {{ soal.jenis_tes }} #{{ soal.nomor }}
            </span>
            <span class="bg-neo-black text-neo-bg px-2 py-0.5 font-mono text-xs font-bold uppercase">
              {{ soal.kategori }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <span v-if="soal.kategori === 'Pilihan Ganda'" class="bg-neo-yellow border border-neo-black px-2.5 py-1 text-xs font-mono font-bold">
              Kunci: <strong>{{ soal.kunci_jawaban }}</strong>
            </span>
            <button
              @click="openEditModal(soal)"
              class="border-2 border-neo-black bg-white px-3 py-1 text-xs font-bold uppercase shadow-neo hover:bg-neo-yellow transition-all cursor-pointer flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-sm">edit</span>
              <span>Edit</span>
            </button>
            <button
              @click="confirmDelete(soal)"
              class="border-2 border-neo-black bg-[#ff6b6b] text-white px-3 py-1 text-xs font-bold uppercase shadow-neo hover:bg-red-600 transition-all cursor-pointer flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
              <span>Hapus</span>
            </button>
          </div>
        </div>

        <!-- Pertanyaan -->
        <p class="font-bold text-base md:text-lg text-neo-black leading-snug">
          {{ soal.pertanyaan }}
        </p>

        <!-- Opsi Jawaban Display -->
        <div v-if="soal.kategori === 'Pilihan Ganda'" class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div
            v-for="item in getSortedOpsi(soal.opsi)"
            :key="item.key"
            :class="[
              'p-2.5 border-2 border-neo-black flex items-start gap-2',
              item.key === soal.kunci_jawaban ? 'bg-neo-yellow/70 font-bold' : 'bg-neo-bg'
            ]"
          >
            <span class="font-mono font-bold bg-neo-black text-white px-1.5 py-0.5 text-[11px]">{{ item.key }}</span>
            <span>{{ item.teks }}</span>
          </div>
        </div>

        <div v-else class="flex gap-2 text-xs font-bold items-center flex-wrap">
          <span class="px-3 py-1.5 border-2 border-neo-black bg-neo-green inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">thumb_up</span>
            <span>Bisa</span>
          </span>
          <span class="px-3 py-1.5 border-2 border-neo-black bg-neo-pink inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">thumb_down</span>
            <span>Belum Bisa</span>
          </span>
          <span class="px-3 py-1.5 border border-neo-black bg-neo-bg text-neo-black/60 italic">Penilaian Diri Unjuk Kerja</span>
        </div>
      </div>
    </div>

    <!-- MODAL FORM CREATE / EDIT (Neo Brutalism Style) -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 bg-neo-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
    >
      <div class="bg-white border-3 border-neo-black max-w-2xl w-full p-4 sm:p-8 shadow-neo max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-6">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b-3 border-neo-black pb-3 sm:pb-4 gap-2">
          <div class="min-w-0">
            <span class="bg-neo-yellow text-neo-black px-2 py-0.5 border border-neo-black font-mono text-[10px] sm:text-xs font-bold uppercase inline-block">
              {{ isEditMode ? 'Edit Soal' : 'Soal Baru' }}
            </span>
            <h3 class="font-display text-2xl sm:text-3xl uppercase tracking-wider mt-1 truncate">
              {{ isEditMode ? `Edit Soal #${formData.nomor}` : 'Tambah Soal Baru' }}
            </h3>
          </div>
          <button
            @click="isModalOpen = false"
            class="w-9 h-9 sm:w-10 sm:h-10 border-3 border-neo-black bg-[#ff6b6b] text-white flex items-center justify-center shadow-neo hover:bg-red-600 cursor-pointer shrink-0"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Sesi, Nomor & Kategori -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase">Sesi Tes *</label>
              <select
                v-model="formData.jenis_tes"
                class="w-full px-3 py-2 bg-neo-bg border-2 border-neo-black font-bold"
              >
                <option value="Pre-Test">Pre-Test (Awal)</option>
                <option value="Post-Test">Post-Test (Akhir)</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase">Nomor Urut *</label>
              <input
                v-model="formData.nomor"
                type="number"
                min="1"
                required
                class="w-full px-3 py-2 bg-neo-bg border-2 border-neo-black font-mono font-bold"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase">Kategori *</label>
              <select
                v-model="formData.kategori"
                class="w-full px-3 py-2 bg-neo-bg border-2 border-neo-black font-bold"
              >
                <option value="Pilihan Ganda">Pilihan Ganda (A-D)</option>
                <option value="Praktik">Praktik (Penilaian Diri)</option>
              </select>
            </div>
          </div>

          <!-- Pertanyaan -->
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase">Teks Pertanyaan / Indikator *</label>
            <textarea
              v-model="formData.pertanyaan"
              rows="3"
              required
              placeholder="Tuliskan pertanyaan atau deskripsi indikator kompetensi portofolio di sini..."
              class="w-full px-3 py-2 bg-neo-bg border-2 border-neo-black font-medium text-sm focus:bg-white"
            ></textarea>
          </div>

          <!-- Opsi Khusus Pilihan Ganda -->
          <div v-if="formData.kategori === 'Pilihan Ganda'" class="space-y-3 border-2 border-neo-black p-4 bg-neo-bg">
            <div class="flex items-center justify-between">
              <span class="font-display text-lg uppercase">Pilihan Jawaban (A/B/C/D)</span>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold">Kunci:</span>
                <select
                  v-model="formData.kunci_jawaban"
                  class="px-2 py-1 border-2 border-neo-black bg-neo-yellow font-bold text-xs"
                >
                  <option value="A">Kunci A</option>
                  <option value="B">Kunci B</option>
                  <option value="C">Kunci C</option>
                  <option value="D">Kunci D</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 flex items-center justify-center font-bold bg-neo-black text-white shrink-0">A</span>
                <input v-model="formData.opsiA" type="text" placeholder="Teks opsi A..." required class="w-full p-2 bg-white border border-neo-black text-xs font-medium" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 flex items-center justify-center font-bold bg-neo-black text-white shrink-0">B</span>
                <input v-model="formData.opsiB" type="text" placeholder="Teks opsi B..." required class="w-full p-2 bg-white border border-neo-black text-xs font-medium" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 flex items-center justify-center font-bold bg-neo-black text-white shrink-0">C</span>
                <input v-model="formData.opsiC" type="text" placeholder="Teks opsi C..." required class="w-full p-2 bg-white border border-neo-black text-xs font-medium" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 flex items-center justify-center font-bold bg-neo-black text-white shrink-0">D</span>
                <input v-model="formData.opsiD" type="text" placeholder="Teks opsi D..." required class="w-full p-2 bg-white border border-neo-black text-xs font-medium" />
              </div>
            </div>
          </div>

          <div v-else class="p-3 bg-neo-blue/20 border-2 border-neo-black text-xs font-medium flex items-center gap-2">
            <span class="material-symbols-outlined text-lg shrink-0">lightbulb</span>
            <span>Untuk kategori <strong>Praktik</strong>, opsi secara otomatis ditetapkan sebagai <strong>'Bisa'</strong> dan <strong>'Belum Bisa'</strong> tanpa kunci jawaban tunggal.</span>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-neo-black">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 text-xs font-bold uppercase border-2 border-neo-black bg-white shadow-neo cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2.5 text-xs font-bold uppercase border-3 border-neo-black bg-neo-pink text-neo-black shadow-neo hover:shadow-neo-hover cursor-pointer flex items-center gap-1.5"
            >
              <span v-if="isSubmitting">Menyimpan...</span>
              <span v-else class="flex items-center gap-1">
                <span>{{ isEditMode ? 'Simpan Perubahan' : 'Tambahkan ke Bank Soal' }}</span>
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS -->
    <div
      v-if="deleteConfirmItem"
      class="fixed inset-0 z-50 bg-neo-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div class="bg-white border-3 border-neo-black max-w-md w-full p-4 sm:p-6 shadow-neo space-y-4">
        <h3 class="font-display text-2xl uppercase tracking-wider text-red-600 flex items-center gap-2">
          <span class="material-symbols-outlined text-2xl">warning</span>
          <span>Konfirmasi Hapus Soal</span>
        </h3>
        <p class="text-sm font-medium">
          Apakah Anda yakin ingin menghapus <strong>Soal #{{ deleteConfirmItem.nomor }}</strong>?
        </p>
        <p class="text-xs bg-neo-bg p-3 border border-neo-black italic">
          "{{ deleteConfirmItem.pertanyaan }}"
        </p>
        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="deleteConfirmItem = null"
            class="px-4 py-2 text-xs font-bold uppercase border-2 border-neo-black bg-white shadow-neo cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="executeDelete"
            class="px-5 py-2 text-xs font-bold uppercase border-2 border-neo-black bg-[#ff6b6b] text-white shadow-neo cursor-pointer"
          >
            Ya, Hapus Soal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
