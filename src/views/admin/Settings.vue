<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminNav from '../../components/AdminNav.vue'
import QrProjectorModal from '../../components/QrProjectorModal.vue'
import { db } from '../../firebase'
import { collection, getDocs, writeBatch } from 'firebase/firestore'
import { useUserStore } from '../../stores/userStore'
import { useAuthStore } from '../../stores/authStore'
import { runSeeder } from '../../utils/seeder'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()

const isUpdating = ref(false)
const notification = ref(null)
const seederLoading = ref(false)

// State QR Proyektor & Reset Data Uji Coba
const isQrModalOpen = ref(false)
const isResetModalOpen = ref(false)
const confirmResetInput = ref('')
const isResetting = ref(false)

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
      message: `Status tes berhasil diperbarui menjadi: "${statusBaru}"`,
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
      message: `Berhasil memperbarui instrumen bank soal (${res.total_soal} butir soal siap digunakan).`,
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

// Reset / Pembersihan Data Submisi Evaluasi Peserta
const executeResetData = async () => {
  if (confirmResetInput.value.trim().toUpperCase() !== 'RESET') return

  isResetting.value = true
  notification.value = null

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

    isResetModalOpen.value = false
    confirmResetInput.value = ''
    notification.value = {
      type: 'success',
      message: 'Seluruh data submisi uji coba peserta berhasil dibersihkan dari database.',
    }
  } catch (err) {
    console.error('Gagal reset data evaluasi:', err)
    notification.value = {
      type: 'error',
      message: `Gagal membersihkan data: ${err.message}`,
    }
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <AdminNav title="PENGATURAN SESI" />

    <!-- Main Header & Status Overview -->
    <header class="bg-neo-yellow border-3 border-neo-black p-4 sm:p-8 md:p-10 shadow-neo rounded-2xl space-y-3 sm:space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="bg-neo-black text-neo-bg px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md">
          Workshop Pembuatan Website Portfolio dengan Google Sites
        </span>
      </div>

      <h1 class="font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-neo-black leading-none">
        Kontrol Sesi Pre & Post Test
      </h1>
      <p class="text-xs sm:text-sm md:text-base font-medium text-neo-black/90 max-w-2xl">
        Atur pembukaan sesi Pre-Test, Post-Test, atau Ditutup untuk peserta workshop Google Sites secara realtime.
      </p>

      <!-- Active Status Display Badge & Projector Button -->
      <div class="pt-2 flex items-center gap-3 sm:gap-4 flex-wrap">
        <span class="font-bold text-xs sm:text-sm uppercase tracking-wider">Status Berjalan Saat Ini:</span>
        <div
          :class="[
            'px-3.5 sm:px-5 py-1.5 sm:py-2 font-display text-xl sm:text-3xl uppercase tracking-wider border-3 border-neo-black shadow-neo inline-flex items-center gap-2 rounded-xl',
            currentStatus === 'Pre-Test' ? 'bg-neo-pink text-neo-black' :
            currentStatus === 'Post-Test' ? 'bg-neo-blue text-neo-black' : 'bg-white text-neo-black'
          ]"
        >
          <span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-neo-black animate-pulse" :class="currentStatus === 'Ditutup' ? 'bg-red-500' : 'bg-green-500'"></span>
          {{ currentStatus }}
        </div>

        <button
          @click="isQrModalOpen = true"
          class="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-white text-neo-black border-3 border-neo-black shadow-neo font-display text-xs sm:text-sm uppercase tracking-wider hover:bg-neo-yellow hover:text-neo-black transition-all cursor-pointer flex items-center gap-1.5 font-bold rounded-xl"
          title="Buka QR Code untuk Ditampilkan di Proyektor Kelas"
        >
          <span class="material-symbols-outlined text-lg">qr_code_2</span>
          <span>Buka QR Proyektor</span>
        </button>
      </div>
    </header>

    <!-- Notification Alert -->
    <div
      v-if="notification"
      :class="[
        'p-3.5 sm:p-4 border-3 border-neo-black font-bold text-xs sm:text-sm shadow-neo rounded-xl flex items-center justify-between gap-4',
        notification.type === 'success' ? 'bg-neo-green text-neo-black' : 'bg-[#ff6b6b] text-white'
      ]"
    >
      <span>{{ notification.message }}</span>
      <button @click="notification = null" class="cursor-pointer flex items-center">
        <span class="material-symbols-outlined text-base">close</span>
      </button>
    </div>

    <!-- 3 Big Neo Brutalism Action Buttons -->
    <section class="space-y-3 sm:space-y-4">
      <div class="flex items-center gap-2">
        <span class="w-3.5 h-3.5 bg-neo-pink border-2 border-neo-black rounded-sm"></span>
        <h2 class="font-display text-xl sm:text-2xl md:text-3xl uppercase tracking-wider">
          Pilih Status Sesi (3 Tombol Neo Brutalism)
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <!-- Tombol 1: Pink (Pre-Test) -->
        <button
          @click="updateStatus('Pre-Test')"
          :disabled="isUpdating"
          :class="[
            'p-4 sm:p-6 md:p-8 border-3 border-neo-black bg-neo-pink text-neo-black shadow-neo text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[170px] sm:min-h-[200px] md:min-h-[220px] rounded-2xl',
            currentStatus === 'Pre-Test' ? 'ring-4 ring-neo-black translate-x-1 translate-y-1' : 'hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-1 hover:-translate-y-1'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-2 sm:mb-3">
              <span class="bg-neo-black text-neo-bg px-2 sm:px-2.5 py-0.5 font-mono text-[10px] sm:text-xs font-bold uppercase rounded-md">
                WARNA PINK
              </span>
              <span v-if="currentStatus === 'Pre-Test'" class="bg-white text-neo-black px-2 py-0.5 text-[10px] sm:text-xs font-bold border border-neo-black flex items-center gap-1 rounded-md">
                <span class="material-symbols-outlined text-[13px] text-neo-black">star</span>
                <span>AKTIF</span>
              </span>
            </div>
            <h3 class="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider leading-none">
              Pre-Test
            </h3>
            <p class="text-xs font-medium mt-2 sm:mt-3 leading-relaxed">
              Buka asesmen diagnostik awal bagi peserta sebelum materi/praktik portofolio dimulai.
            </p>
          </div>
          <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-neo-black font-display text-lg sm:text-xl uppercase tracking-wider flex items-center justify-between">
            <span>Set Pre-Test</span>
            <span class="material-symbols-outlined text-xl">arrow_forward</span>
          </div>
        </button>

        <!-- Tombol 2: Biru (Post-Test) -->
        <button
          @click="updateStatus('Post-Test')"
          :disabled="isUpdating"
          :class="[
            'p-4 sm:p-6 md:p-8 border-3 border-neo-black bg-neo-blue text-neo-black shadow-neo text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[170px] sm:min-h-[200px] md:min-h-[220px] rounded-2xl',
            currentStatus === 'Post-Test' ? 'ring-4 ring-neo-black translate-x-1 translate-y-1' : 'hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-1 hover:-translate-y-1'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-2 sm:mb-3">
              <span class="bg-neo-black text-neo-bg px-2 sm:px-2.5 py-0.5 font-mono text-[10px] sm:text-xs font-bold uppercase rounded-md">
                WARNA BIRU
              </span>
              <span v-if="currentStatus === 'Post-Test'" class="bg-white text-neo-black px-2 py-0.5 text-[10px] sm:text-xs font-bold border border-neo-black flex items-center gap-1 rounded-md">
                <span class="material-symbols-outlined text-[13px] text-neo-black">star</span>
                <span>AKTIF</span>
              </span>
            </div>
            <h3 class="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider leading-none">
              Post-Test
            </h3>
            <p class="text-xs font-medium mt-2 sm:mt-3 leading-relaxed">
              Buka asesmen akhir untuk mengukur peningkatan capaian kompetensi portofolio peserta.
            </p>
          </div>
          <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-neo-black font-display text-lg sm:text-xl uppercase tracking-wider flex items-center justify-between">
            <span>Set Post-Test</span>
            <span class="material-symbols-outlined text-xl">arrow_forward</span>
          </div>
        </button>

        <!-- Tombol 3: Kuning (Ditutup) -->
        <button
          @click="updateStatus('Ditutup')"
          :disabled="isUpdating"
          :class="[
            'p-4 sm:p-6 md:p-8 border-3 border-neo-black bg-neo-yellow text-neo-black shadow-neo text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[170px] sm:min-h-[200px] md:min-h-[220px] rounded-2xl',
            currentStatus === 'Ditutup' ? 'ring-4 ring-neo-black translate-x-1 translate-y-1' : 'hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-1 hover:-translate-y-1'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-2 sm:mb-3">
              <span class="bg-neo-black text-neo-bg px-2 sm:px-2.5 py-0.5 font-mono text-[10px] sm:text-xs font-bold uppercase rounded-md">
                WARNA KUNING
              </span>
              <span v-if="currentStatus === 'Ditutup'" class="bg-white text-neo-black px-2 py-0.5 text-[10px] sm:text-xs font-bold border border-neo-black flex items-center gap-1 rounded-md">
                <span class="material-symbols-outlined text-[13px] text-neo-black">star</span>
                <span>AKTIF</span>
              </span>
            </div>
            <h3 class="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider leading-none">
              Ditutup
            </h3>
            <p class="text-xs font-medium mt-2 sm:mt-3 leading-relaxed">
              Kunci akses ujian. Tombol di halaman peserta akan dinonaktifkan (disabled) secara otomatis.
            </p>
          </div>
          <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-neo-black font-display text-lg sm:text-xl uppercase tracking-wider flex items-center justify-between">
            <span>Kunci / Tutup Tes</span>
            <span class="material-symbols-outlined text-xl">lock</span>
          </div>
        </button>
      </div>
    </section>

    <!-- Additional Tools Section -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="w-3.5 h-3.5 bg-neo-blue border-2 border-neo-black rounded-sm"></span>
        <h3 class="font-display text-xl sm:text-2xl uppercase tracking-wider">
          Pemeliharaan Sistem & Manajemen Data
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Tool 1: Re-seed Bank Soal -->
        <div class="bg-white border-3 border-neo-black p-4 sm:p-6 shadow-neo rounded-2xl flex flex-col justify-between gap-4">
          <div>
            <h4 class="font-display text-xl uppercase tracking-wider">Sinkronisasi Bank Soal</h4>
            <p class="text-xs font-medium text-neo-black/70 mt-1">
              Reset dan sinkronkan kembali seluruh 24 butir soal instrumen ke standar kurikulum pelatihan.
            </p>
          </div>
          <button
            @click="handleReSeed"
            :disabled="seederLoading"
            class="border-3 border-neo-black bg-neo-bg px-4 py-2.5 text-xs font-bold uppercase shadow-neo hover:bg-neo-yellow transition-all cursor-pointer w-full text-center flex items-center justify-center gap-1.5 rounded-xl font-bold"
          >
            <span class="material-symbols-outlined text-base">restart_alt</span>
            <span>{{ seederLoading ? 'Memproses Seeding...' : 'Re-seed Bank Soal' }}</span>
          </button>
        </div>

        <!-- Tool 2: Reset Data Uji Coba -->
        <div class="bg-white border-3 border-neo-black p-4 sm:p-6 shadow-neo rounded-2xl flex flex-col justify-between gap-4 border-l-6 border-l-[#ff6b6b]">
          <div>
            <h4 class="font-display text-xl uppercase tracking-wider text-red-600">Reset Data Uji Coba</h4>
            <p class="text-xs font-medium text-neo-black/70 mt-1">
              Bersihkan seluruh hasil tes peserta uji coba agar database bersih siap pakai saat hari-H.
            </p>
          </div>
          <button
            @click="isResetModalOpen = true; confirmResetInput = ''"
            class="border-3 border-neo-black bg-[#ff6b6b] text-white px-4 py-2.5 text-xs font-bold uppercase shadow-neo hover:bg-red-700 transition-all cursor-pointer w-full text-center flex items-center justify-center gap-1.5 rounded-xl font-bold"
          >
            <span class="material-symbols-outlined text-base">delete_sweep</span>
            <span>Reset Data Submisi</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL RESET DATA UJI COBA (PENGAMAN GANDA) -->
    <div
      v-if="isResetModalOpen"
      class="fixed inset-0 z-50 bg-neo-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
    >
      <div class="bg-white border-3 border-neo-black max-w-lg w-full p-4 sm:p-8 shadow-neo rounded-3xl space-y-5">
        <div class="flex items-center justify-between border-b-3 border-neo-black pb-3 gap-2">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 bg-[#ff6b6b] border-2 border-neo-black rounded-sm"></span>
            <h3 class="font-display text-2xl sm:text-3xl uppercase tracking-wider text-red-600 leading-none">
              Konfirmasi Pembersihan Data
            </h3>
          </div>
          <button
            @click="isResetModalOpen = false"
            class="w-8 h-8 border-2 border-neo-black bg-white flex items-center justify-center hover:bg-[#ff6b6b] hover:text-white cursor-pointer rounded-xl"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div class="space-y-3 text-xs sm:text-sm">
          <p class="font-bold text-neo-black leading-relaxed">
            Perhatian: Seluruh data evaluasi peserta (hasil Pre-Test & Post-Test) yang tersimpan di Firestore akan <u>dihapus permanen</u>.
          </p>

          <p class="text-xs text-neo-black/80">
            Gunakan fitur ini setelah tahap pengujian coba-coba selesai dan workshop nyata hendak dimulai.
          </p>

          <div class="space-y-1.5 pt-1">
            <label class="block font-bold text-xs uppercase tracking-wider text-red-600">
              Ketik kata <span class="bg-neo-black text-neo-bg px-1.5 py-0.5 font-mono rounded-md">RESET</span> untuk mengonfirmasi:
            </label>
            <input
              v-model="confirmResetInput"
              type="text"
              placeholder="Ketik: RESET"
              class="w-full px-3 py-2 bg-neo-bg border-3 border-neo-black font-mono font-bold text-sm tracking-widest uppercase focus:bg-white focus:outline-none rounded-xl"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-neo-black">
          <button
            type="button"
            @click="isResetModalOpen = false"
            class="px-4 py-2 text-xs font-bold uppercase border-2 border-neo-black bg-white shadow-neo cursor-pointer hover:bg-gray-100 rounded-xl"
          >
            Batal
          </button>
          <button
            type="button"
            @click="executeResetData"
            :disabled="confirmResetInput.trim().toUpperCase() !== 'RESET' || isResetting"
            class="px-5 py-2.5 text-xs font-bold uppercase border-3 border-neo-black bg-[#ff6b6b] text-white shadow-neo hover:bg-red-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-xl font-bold"
          >
            <span v-if="isResetting" class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            <span v-else class="material-symbols-outlined text-base">delete_forever</span>
            <span>{{ isResetting ? 'Membersihkan...' : 'Bersihkan Database' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal QR Proyektor Kelas -->
    <QrProjectorModal :is-open="isQrModalOpen" @close="isQrModalOpen = false" />
  </div>
</template>
