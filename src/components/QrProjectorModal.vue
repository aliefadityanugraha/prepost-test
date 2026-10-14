<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { useUserStore } from '../stores/userStore'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const userStore = useUserStore()
const modalRef = ref(null)

// State URL dan QR
const defaultUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:5173/'
const targetUrl = ref(defaultUrl)
const isCustomUrl = ref(false)
const qrDataUrl = ref('')
const isGenerating = ref(false)

// State UI
const copied = ref(false)
const isFullscreen = ref(false)
const showScanBeam = ref(true)

// Sinkronkan status tes aktif
const statusTes = computed(() => userStore.status_tes_aktif || 'Ditutup')

const statusBadgeInfo = computed(() => {
  if (statusTes.value === 'Pre-Test') {
    return {
      text: 'PRE-TEST AKTIF',
      icon: 'play_circle',
      bgClass: 'bg-neo-yellow text-neo-black',
      desc: 'Peserta akan langsung masuk ke tahap Pre-Test',
    }
  }
  if (statusTes.value === 'Post-Test') {
    return {
      text: 'POST-TEST AKTIF',
      icon: 'rocket_launch',
      bgClass: 'bg-neo-pink text-neo-black',
      desc: 'Peserta akan langsung masuk ke tahap Post-Test',
    }
  }
  return {
    text: 'SESI TES DITUTUP',
    icon: 'block',
    bgClass: 'bg-[#ff6b6b] text-white',
    desc: 'Aktifkan sesi di Pengaturan agar siswa bisa mulai',
  }
})

// Generate QR Code beresolusi tinggi (800x800px)
const generateQr = async () => {
  if (!targetUrl.value) return
  isGenerating.value = true
  try {
    const url = await QRCode.toDataURL(targetUrl.value.trim(), {
      width: 800,
      margin: 2,
      color: {
        dark: '#121212',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
    qrDataUrl.value = url
  } catch (err) {
    console.error('Gagal generate QR Code:', err)
  } finally {
    isGenerating.value = false
  }
}

// Watchers
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (!isCustomUrl.value && typeof window !== 'undefined') {
        targetUrl.value = `${window.location.origin}/`
      }
      generateQr()
    }
  },
  { immediate: true }
)

watch(targetUrl, () => {
  generateQr()
})

// Salin URL ke clipboard
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(targetUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  } catch (err) {
    console.error('Gagal menyalin URL:', err)
  }
}

// Toggle Mode Layar Penuh (Fullscreen untuk Proyektor)
const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      if (modalRef.value?.requestFullscreen) {
        await modalRef.value.requestFullscreen()
        isFullscreen.value = true
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    }
  } catch (err) {
    console.warn('Fullscreen error:', err)
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// Unduh Gambar QR resolusi tinggi
const downloadQr = () => {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.download = `QR_Scan_Masuk_${statusTes.value || 'Workshop'}.png`
  link.href = qrDataUrl.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Cetak Lembar Meja Lab / Print
const printCard = () => {
  window.print()
}

const closeModal = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-neo-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white"
    @click.self="closeModal"
  >
    <div
      ref="modalRef"
      class="bg-white border-4 border-neo-black shadow-neo-lg rounded-3xl w-full max-w-4xl p-4 sm:p-8 space-y-6 relative print:border-none print:shadow-none print:p-4 transition-all"
      :class="{
        'h-screen max-w-none rounded-none flex flex-col justify-between overflow-y-auto p-6 sm:p-10 bg-neo-bg': isFullscreen,
      }"
    >
      <!-- Corner Brutalist Accents -->
      <div class="hidden sm:block absolute top-2 left-2 text-xs font-mono font-bold text-neo-black/40">⌜ PROYECTOR_MODE</div>
      <div class="hidden sm:block absolute top-2 right-2 text-xs font-mono font-bold text-neo-black/40">⌝</div>
      <div class="hidden sm:block absolute bottom-2 left-2 text-xs font-mono font-bold text-neo-black/40">⌞ CLASSROOM_SYNC</div>
      <div class="hidden sm:block absolute bottom-2 right-2 text-xs font-mono font-bold text-neo-black/40">⌟</div>

      <!-- Header Toolbar -->
      <div class="border-b-3 border-neo-black pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-neo-blue border-2 border-neo-black rounded-lg px-2 py-0.5 text-xs font-mono font-bold uppercase shadow-neo inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px]">qr_code_scanner</span>
              <span>SCAN TO JOIN</span>
            </span>
            <span
              class="border-2 border-neo-black rounded-lg px-2.5 py-0.5 text-xs font-display uppercase tracking-wider shadow-neo font-bold inline-flex items-center gap-1"
              :class="statusBadgeInfo.bgClass"
            >
              <span class="material-symbols-outlined text-[15px]">{{ statusBadgeInfo.icon }}</span>
              <span>{{ statusBadgeInfo.text }}</span>
            </span>
          </div>
          <h2 class="font-display text-2xl sm:text-4xl uppercase tracking-wider text-neo-black leading-tight">
            Pindai QR Untuk Masuk Tes
          </h2>
          <p class="text-xs font-medium text-neo-black/75">
            {{ statusBadgeInfo.desc }}
          </p>
        </div>

        <!-- Controls: Fullscreen & Close -->
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            @click="toggleFullscreen"
            class="px-3 py-1.5 border-2 border-neo-black rounded-xl bg-neo-yellow font-bold text-xs uppercase shadow-neo hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
            :title="isFullscreen ? 'Keluar Fullscreen' : 'Mode Layar Penuh Proyektor'"
          >
            <span class="material-symbols-outlined text-[16px]">{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</span>
            <span>{{ isFullscreen ? 'Perkecil' : 'Layar Penuh' }}</span>
          </button>
          <button
            @click="closeModal"
            class="px-3 py-1.5 border-2 border-neo-black rounded-xl bg-[#ff6b6b] text-white font-bold text-xs uppercase shadow-neo hover:bg-red-600 transition-all cursor-pointer flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-[16px]">close</span>
            <span>Tutup</span>
          </button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <!-- QR Code Area (6 cols) -->
        <div class="md:col-span-6 flex flex-col items-center justify-center space-y-3">
          <div
            class="relative bg-white border-4 border-neo-black rounded-2xl p-4 sm:p-6 shadow-neo-lg flex items-center justify-center max-w-[340px] sm:max-w-[420px] w-full aspect-square overflow-hidden group"
          >
            <!-- Scan Beam Effect -->
            <div
              v-if="showScanBeam"
              class="absolute inset-x-0 h-1 bg-neo-pink shadow-[0_0_12px_#ff4b91] z-10 pointer-events-none animate-scan-beam opacity-75"
            ></div>

            <!-- Loading State -->
            <div v-if="isGenerating" class="flex flex-col items-center justify-center space-y-2 py-12">
              <span class="animate-spin inline-block w-8 h-8 border-4 border-neo-black border-t-transparent rounded-full"></span>
              <span class="font-mono font-bold text-xs uppercase">Menyiapkan QR...</span>
            </div>

            <!-- QR Code Image -->
            <img
              v-else-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR Code Masuk Evaluasi"
              class="w-full h-full object-contain select-none"
            />
          </div>

          <!-- Micro Toggle Scan Beam -->
          <div class="flex items-center justify-between w-full max-w-[340px] sm:max-w-[420px] px-1 text-xs font-mono print:hidden">
            <span class="text-neo-black/60 font-bold">Status: Online</span>
            <button
              @click="showScanBeam = !showScanBeam"
              class="underline hover:text-neo-pink cursor-pointer font-bold inline-flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[14px]">tune</span>
              <span>{{ showScanBeam ? 'Matikan Efek Laser' : 'Nyalakan Efek Laser' }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions & URL Controls (6 cols) -->
        <div class="md:col-span-6 space-y-5">
          <!-- 3 Steps Instructions -->
          <div class="space-y-3 bg-neo-bg border-3 border-neo-black rounded-2xl p-4 sm:p-5 shadow-neo">
            <h3 class="font-display text-lg uppercase tracking-wider text-neo-black flex items-center gap-2">
              <span class="material-symbols-outlined text-lg">checklist</span>
              <span>Langkah Akses Peserta:</span>
            </h3>
            <ol class="space-y-2.5 text-xs sm:text-sm font-medium text-neo-black">
              <li class="flex items-start gap-2.5">
                <span class="bg-neo-black text-white font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>Buka aplikasi <strong>Kamera</strong> atau <strong>Pemindai QR</strong> di HP.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="bg-neo-black text-white font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span>Arahkan kamera ke <strong>QR Code</strong> di layar proyektor.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="bg-neo-black text-white font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>Isi <strong>Nama Lengkap & Kelas</strong> untuk langsung mulai!</span>
              </li>
            </ol>
          </div>

          <!-- URL Field & Quick Copy -->
          <div class="space-y-2 print:hidden">
            <label class="block font-bold text-xs uppercase tracking-wider text-neo-black flex items-center justify-between">
              <span class="inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">link</span>
                <span>Tautan Langsung Siswa:</span>
              </span>
              <button
                @click="isCustomUrl = !isCustomUrl"
                class="text-[11px] underline hover:text-neo-blue cursor-pointer font-bold inline-flex items-center gap-0.5"
              >
                <span class="material-symbols-outlined text-[13px]">edit</span>
                <span>{{ isCustomUrl ? 'Gunakan URL Otomatis' : 'Ubah URL Manual (IP Lab)' }}</span>
              </button>
            </label>

            <div class="flex items-stretch gap-2">
              <input
                v-model="targetUrl"
                :readonly="!isCustomUrl"
                type="text"
                class="flex-1 px-3 py-2 bg-neo-bg border-3 border-neo-black rounded-xl text-neo-black font-mono text-xs focus:bg-white focus:outline-none focus:shadow-neo transition-all truncate"
                :class="{ 'bg-white': isCustomUrl }"
              />
              <button
                @click="copyUrl"
                class="px-3.5 py-2 font-display text-xs uppercase tracking-wider border-3 border-neo-black rounded-xl shadow-neo active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0 font-bold inline-flex items-center gap-1"
                :class="copied ? 'bg-neo-green text-neo-black' : 'bg-neo-yellow text-neo-black hover:bg-white'"
              >
                <span class="material-symbols-outlined text-[15px]">{{ copied ? 'check' : 'content_copy' }}</span>
                <span>{{ copied ? 'Tersalin!' : 'Salin' }}</span>
              </button>
            </div>
            <p v-if="isCustomUrl" class="text-[11px] text-neo-black/70 italic flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">lightbulb</span>
              <span>Masukkan IP lokal lab (contoh: <code>http://192.168.1.10:5173/</code>) jika siswa berada di jaringan WiFi lokal yang sama.</span>
            </p>
          </div>

          <!-- Quick Action Buttons: Download & Print -->
          <div class="grid grid-cols-2 gap-2.5 pt-1 print:hidden">
            <button
              @click="downloadQr"
              class="neo-button bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-neo-black border-3 border-neo-black rounded-xl shadow-neo hover:bg-neo-blue hover:text-neo-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>Unduh PNG</span>
            </button>
            <button
              @click="printCard"
              class="neo-button bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-neo-black border-3 border-neo-black rounded-xl shadow-neo hover:bg-neo-pink hover:text-neo-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">print</span>
              <span>Cetak Lembar Meja</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Info in Fullscreen -->
      <div v-if="isFullscreen" class="pt-4 border-t-3 border-neo-black flex items-center justify-between text-xs font-mono font-bold text-neo-black/75">
        <span>Tekan <kbd class="px-1.5 py-0.5 border border-neo-black rounded bg-white">ESC</kbd> untuk keluar layar penuh</span>
        <span>Google Sites Portfolio Pre-Post Test Evaluation</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scanBeam {
  0% {
    top: 0%;
  }
  50% {
    top: 98%;
  }
  100% {
    top: 0%;
  }
}

.animate-scan-beam {
  animation: scanBeam 3s ease-in-out infinite;
}

@media print {
  /* Khusus cetak lembar meja di lab komputer */
  body * {
    visibility: hidden;
  }
  .print\:p-4,
  .print\:p-4 * {
    visibility: visible;
  }
}
</style>
