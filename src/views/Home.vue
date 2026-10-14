<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/userStore";

const router = useRouter();
const userStore = useUserStore();

const inputNama = ref(userStore.nama || "");
const inputKelas = ref(userStore.kelas || "");
const formError = ref("");

onMounted(() => {
  userStore.initPengaturanListener();
});

const isTestClosed = computed(() => {
  return userStore.status_tes_aktif === "Ditutup";
});

const isFormValid = computed(() => {
  return (
    inputNama.value.trim().length > 0 && inputKelas.value.trim().length > 0
  );
});

// Judul Dinamis Utama Berdasarkan Status Sesi
const pageTitle = computed(() => {
  if (userStore.status_tes_aktif === "Pre-Test") return "PRE-TEST";
  if (userStore.status_tes_aktif === "Post-Test") return "POST-TEST";
  return "SESI EVALUASI DITUTUP";
});

// Label Badge Sesi
const pageBadge = computed(() => {
  if (userStore.status_tes_aktif === "Pre-Test") {
    return "ASESMEN AWAL • WORKSHOP GOOGLE SITES";
  }
  if (userStore.status_tes_aktif === "Post-Test") {
    return "ASESMEN AKHIR • WORKSHOP GOOGLE SITES";
  }
  return "AKSES DITUTUP SEMENTARA";
});

// Deskripsi Ringkas Sesuai Status Sesi
const pageDescription = computed(() => {
  if (userStore.status_tes_aktif === "Pre-Test") {
    return "Ukur tingkat pemahaman konsep awal dan kesiapan keterampilan praktik pembuatan website portfolio digital Anda dengan Google Sites sebelum materi workshop dimulai.";
  }
  if (userStore.status_tes_aktif === "Post-Test") {
    return "Ukur peningkatan kompetensi, penguasaan konsep, dan kecakapan praktik mandiri pembuatan website portfolio Google Sites setelah mengikuti seluruh sesi pelatihan.";
  }
  return "Sesi tes saat ini belum dibuka atau telah dihentikan oleh instruktur workshop. Sistem akan mendeteksi pembukaan sesi secara realtime tanpa perlu memuat ulang halaman.";
});

// Pengaturan Tema Visual Sesuai Sesi
const themeConfig = computed(() => {
  if (userStore.status_tes_aktif === "Pre-Test") {
    return {
      badgeClass: "bg-neo-pink text-neo-black",
      headerAccent: "text-neo-pink",
      buttonClass: "bg-neo-pink text-neo-black",
      highlightDot: "bg-neo-pink",
    };
  }
  if (userStore.status_tes_aktif === "Post-Test") {
    return {
      badgeClass: "bg-neo-blue text-neo-black",
      headerAccent: "text-neo-blue",
      buttonClass: "bg-neo-green text-neo-black",
      highlightDot: "bg-neo-green",
    };
  }
  return {
    badgeClass: "bg-[#ff6b6b] text-white",
    headerAccent: "text-[#ff6b6b]",
    buttonClass: "bg-gray-300 text-gray-600",
    highlightDot: "bg-[#ff6b6b]",
  };
});

const handleStartTest = () => {
  formError.value = "";

  if (!inputNama.value.trim() || !inputKelas.value.trim()) {
    formError.value =
      "Silakan isi Nama Lengkap dan Kelas Anda terlebih dahulu!";
    return;
  }

  if (isTestClosed.value) {
    formError.value =
      "Mohon maaf, sesi evaluasi saat ini sedang DITUTUP oleh instruktur.";
    return;
  }

  userStore.setPeserta(inputNama.value, inputKelas.value);
  router.push("/test");
};
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8">
    <!-- Header Hero Dinamis (Sesuai State: Pre-Test / Post-Test / Ditutup) -->
    <header class="text-center space-y-3 sm:space-y-4 px-1">
      <!-- Badge Header Dinamis -->
      <div
        class="inline-flex items-center gap-2 border-3 border-neo-black px-3 sm:px-4 py-1 sm:py-1.5 font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider shadow-neo transition-all transform -rotate-1 hover:rotate-0 max-w-full truncate"
        :class="themeConfig.badgeClass"
      >
        <span
          class="w-2.5 h-2.5 rounded-full border border-neo-black shrink-0"
          :class="themeConfig.highlightDot"
        ></span>
        <span class="truncate">{{ pageBadge }}</span>
      </div>

      <!-- Judul Dinamis Utama: PRE-TEST / POST-TEST / SESI EVALUASI DITUTUP -->
      <h1
        class="font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-wider text-neo-black leading-none drop-shadow-sm break-words"
      >
        {{ pageTitle }}
      </h1>

      <!-- Deskripsi Kontekstual -->
      <p
        class="text-xs sm:text-sm md:text-base font-medium text-neo-black/85 max-w-xl mx-auto leading-relaxed px-1"
      >
        {{ pageDescription }}
      </p>
    </header>

    <!-- Main Card Form (Neo Brutalism Retro Window Style) -->
    <div class="bg-white border-3 border-neo-black shadow-neo overflow-hidden">
      <!-- Window Title Bar -->
      <div
        class="bg-neo-black text-neo-bg px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b-3 border-neo-black"
      >
        <div class="flex items-center gap-1.5 sm:gap-2">
          <span
            class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] border border-black inline-block"
          ></span>
          <span
            class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] border border-black inline-block"
          ></span>
          <span
            class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] border border-black inline-block"
          ></span>
          <span
            class="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider ml-1.5 sm:ml-2 text-white/90"
          >
            LEMBAR IDENTITAS PESERTA
          </span>
        </div>
        <span
          class="text-[10px] sm:text-[11px] font-mono font-bold text-neo-yellow hidden sm:inline-block"
        >
          ● REALTIME READY
        </span>
      </div>

      <div class="p-4 sm:p-8 md:p-10 space-y-5 sm:space-y-6">
        <!-- Banner Khusus Ketika Sesi Ditutup -->
        <div
          v-if="isTestClosed"
          class="p-3.5 sm:p-4 bg-[#ff6b6b] text-white border-3 border-neo-black shadow-neo flex items-start gap-3"
        >
          <span class="material-symbols-outlined text-2xl sm:text-3xl shrink-0">lock</span>
          <div class="space-y-1">
            <h2
              class="font-display text-lg sm:text-xl uppercase tracking-wider leading-tight"
            >
              Sesi Evaluasi Belum Dibuka
            </h2>
            <p
              class="text-[11px] sm:text-xs font-medium leading-relaxed opacity-95"
            >
              Instruktur workshop belum membuka akses pengerjaan tes. Silakan
              menunggu arahan dari instruktur di kelas. Halaman ini akan terbuka
              otomatis saat sesi dibuka.
            </p>
          </div>
        </div>

        <!-- Error Alert -->
        <div
          v-if="formError"
          class="p-3.5 sm:p-4 bg-[#ff6b6b] text-white border-3 border-neo-black font-bold text-xs shadow-neo flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-base">warning</span>
          <span>{{ formError }}</span>
        </div>

        <!-- Form Input Peserta -->
        <form @submit.prevent="handleStartTest" class="space-y-4 sm:space-y-5">
          <!-- Input Nama -->
          <div class="space-y-1.5">
            <label
              for="nama"
              class="block font-bold text-xs uppercase tracking-wider text-neo-black flex items-center justify-between"
            >
              <span
                >Nama Lengkap Peserta <span class="text-neo-pink">*</span></span
              >
              <span
                class="text-[10px] sm:text-[11px] font-mono font-normal text-neo-black/60"
                >Sesuai Presensi</span
              >
            </label>
            <input
              id="nama"
              v-model="inputNama"
              type="text"
              placeholder="Contoh: Budi Pratama"
              required
              class="w-full px-3.5 py-3 sm:px-4 sm:py-3.5 bg-neo-bg border-3 border-neo-black text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
            />
          </div>

          <!-- Input Kelas -->
          <div class="space-y-1.5">
            <label
              for="kelas"
              class="block font-bold text-xs uppercase tracking-wider text-neo-black flex items-center justify-between"
            >
              <span
                >Kelas / Rombel / Kelompok
                <span class="text-neo-pink">*</span></span
              >
              <span
                class="text-[10px] sm:text-[11px] font-mono font-normal text-neo-black/60"
                >Contoh: XII RPL 1</span
              >
            </label>
            <input
              id="kelas"
              v-model="inputKelas"
              type="text"
              placeholder="Contoh: XII RPL 1 / Kelompok A"
              required
              class="w-full px-3.5 py-3 sm:px-4 sm:py-3.5 bg-neo-bg border-3 border-neo-black text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
            />
          </div>

          <!-- Tombol Aksi Utama -->
          <div class="pt-2 sm:pt-3">
            <button
              type="submit"
              :disabled="isTestClosed || !isFormValid"
              :class="[
                'w-full py-3.5 sm:py-4 px-4 sm:px-6 text-center font-display text-lg sm:text-2xl md:text-3xl uppercase tracking-wider border-3 border-neo-black transition-all duration-150 flex items-center justify-center gap-2 sm:gap-3',
                isTestClosed || !isFormValid
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                  : `${themeConfig.buttonClass} shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 cursor-pointer`,
              ]"
            >
              <span v-if="isTestClosed" class="flex items-center gap-2">
                <span class="material-symbols-outlined text-2xl">lock</span>
                <span>Sesi Tes Masih Ditutup</span>
              </span>
              <span v-else-if="!isFormValid"
                >Lengkapi Nama & Kelas Terlebih Dahulu</span
              >
              <span v-else class="flex items-center gap-2">
                <span>Mulai {{ pageTitle }} Sekarang</span>
                <span class="material-symbols-outlined text-2xl">arrow_forward</span>
              </span>
            </button>
          </div>
        </form>

        <!-- Petunjuk Ringkas Pengerjaan -->
        <div
          class="pt-2 border-t-2 border-neo-black/20 text-xs text-neo-black/80 space-y-2"
        >
          <p
            class="font-bold uppercase tracking-wider text-[11px] text-neo-black flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">lightbulb</span>
            <span>Petunjuk Singkat Evaluasi:</span>
          </p>
          <ul
            class="space-y-1 text-[11px] list-disc list-inside text-neo-black/75 pl-1 leading-relaxed"
          >
            <li>Pastikan data Nama Lengkap dan Kelas diisi dengan benar.</li>
            <li>
              Jawab seluruh butir soal; sistem akan memeriksa kelengkapan
              sebelum pengiriman.
            </li>
            <li>
              Skor evaluasi dan predikat kompetensi portofolio langsung tampil
              di akhir tes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
