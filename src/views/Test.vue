<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { useUserStore } from "../stores/userStore";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  allBankSoal,
  dataSoalPreTest,
  dataSoalPostTest,
} from "../utils/seeder";
import { calculateScore, getSortedOpsi } from "../utils/scoring";

const router = useRouter();
const userStore = useUserStore();

const soalList = ref([]);
const jawaban = ref({});
const isLoading = ref(true);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref("");
const validationErrors = ref([]);
const highlightedSoalNomor = ref(null);
const restoredDraftNotice = ref(false);

// State posisi sidebar: 'right' (default) atau 'left'
const sidebarPosition = ref(
  localStorage.getItem("prepost_sidebar_pos") || "right",
);
const isMobilePaletteOpen = ref(false);

const toggleSidebarPosition = () => {
  sidebarPosition.value = sidebarPosition.value === "right" ? "left" : "right";
  try {
    localStorage.setItem("prepost_sidebar_pos", sidebarPosition.value);
  } catch (e) {
    console.warn("Gagal menyimpan preferensi posisi sidebar:", e);
  }
};

// Timer Stopwatch Pengerjaan
const elapsedSeconds = ref(0);
let timerInterval = null;

const formattedTimer = computed(() => {
  const mins = Math.floor(elapsedSeconds.value / 60);
  const secs = elapsedSeconds.value % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
});

// Kunci penyimpanan draft lokal
const draftStorageKey = computed(() => {
  return `prepost_draft_jawaban_${userStore.status_tes_aktif || "general"}`;
});

// Peringatan saat hendak menutup tab / refresh browser
const handleBeforeUnload = (e) => {
  if (!isSubmitted.value && totalTerjawab.value > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
};

// Navigation guard untuk mencegah perpindahan rute tak sengaja
onBeforeRouteLeave((to, from, next) => {
  if (!isSubmitted.value && totalTerjawab.value > 0 && to.name !== "result") {
    const confirmLeave = window.confirm(
      "⚠️ Ujian Anda sedang berjalan dan belum dikirim.\n\nDraft jawaban Anda tetap tersimpan di browser ini. Apakah Anda yakin ingin meninggalkan halaman ujian?",
    );
    if (confirmLeave) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

onMounted(async () => {
  // Validasi jika peserta belum mengisi nama atau sesi ditutup
  if (!userStore.nama || !userStore.kelas) {
    router.replace("/");
    return;
  }
  if (userStore.status_tes_aktif === "Ditutup") {
    router.replace("/");
    return;
  }

  // Pasang listener sebelum tab ditutup
  window.addEventListener("beforeunload", handleBeforeUnload);

  // Jalankan timer pengerjaan
  timerInterval = setInterval(() => {
    elapsedSeconds.value++;
  }, 1000);

  await fetchSoal();
  restoreDraftAnswers();
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Pulihkan draft jawaban yang tersimpan di localStorage
const restoreDraftAnswers = () => {
  try {
    const saved = localStorage.getItem(draftStorageKey.value);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed === "object" &&
        Object.keys(parsed).length > 0
      ) {
        jawaban.value = parsed;
        restoredDraftNotice.value = true;
        setTimeout(() => {
          restoredDraftNotice.value = false;
        }, 6000);
      }
    }
  } catch (err) {
    console.warn("Gagal memulihkan draft jawaban:", err);
  }
};

const fetchSoal = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  const activeTestType = userStore.status_tes_aktif; // 'Pre-Test' | 'Post-Test'

  try {
    const querySnapshot = await getDocs(collection(db, "bank_soal"));
    const fetched = [];
    querySnapshot.forEach((docSnap) => {
      fetched.push({ id: docSnap.id, ...docSnap.data() });
    });

    let filtered = [];
    if (fetched.length > 0) {
      // Filter soal yang cocok dengan sesi aktif
      filtered = fetched.filter(
        (soal) =>
          soal.jenis_tes === activeTestType ||
          soal.jenis_tes === "Pre-Test & Post-Test" ||
          soal.jenis_tes === "Semua",
      );
    }

    // Jika filter Firestore kosong (atau offline), gunakan dataset lokal spesifik
    if (filtered.length === 0) {
      const defaultData =
        activeTestType === "Pre-Test" ? dataSoalPreTest : dataSoalPostTest;
      filtered = [...defaultData];
    }

    // Urutkan soal berdasarkan field nomor
    soalList.value = filtered.sort(
      (a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0),
    );
  } catch (err) {
    console.warn("Gagal fetch Firestore, menggunakan dataset lokal:", err);
    const defaultData =
      activeTestType === "Pre-Test" ? dataSoalPreTest : dataSoalPostTest;
    soalList.value = [...defaultData].sort(
      (a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0),
    );
  } finally {
    isLoading.value = false;
  }
};

// Menghitung progress pengisian
const totalSoal = computed(() => soalList.value.length);
const totalTerjawab = computed(() => Object.keys(jawaban.value).length);
const persentaseSelesai = computed(() => {
  if (totalSoal.value === 0) return 0;
  return Math.round((totalTerjawab.value / totalSoal.value) * 100);
});

const selectOpsi = (nomorSoal, pilihan) => {
  jawaban.value[nomorSoal] = pilihan;
  // Hapus dari daftar error validasi jika sudah dijawab
  validationErrors.value = validationErrors.value.filter(
    (n) => n !== nomorSoal,
  );

  // Simpan otomatis ke localStorage
  try {
    localStorage.setItem(draftStorageKey.value, JSON.stringify(jawaban.value));
  } catch (err) {
    console.warn("Gagal auto-save jawaban ke localStorage:", err);
  }
};

// Navigasi cepat klik palet nomor soal
const scrollToSoal = (nomor) => {
  isMobilePaletteOpen.value = false;
  highlightedSoalNomor.value = nomor;
  const el = document.getElementById(`soal-card-${nomor}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  setTimeout(() => {
    highlightedSoalNomor.value = null;
  }, 2200);
};

// Tombol lompat langsung ke butir soal kosong berikutnya
const jumpToNextUnanswered = () => {
  const nextEmpty = soalList.value.find(
    (s) =>
      jawaban.value[s.nomor] === undefined || jawaban.value[s.nomor] === null,
  );
  if (nextEmpty) {
    scrollToSoal(nextEmpty.nomor);
  }
};

const handleSubmit = async () => {
  errorMessage.value = "";
  validationErrors.value = [];

  // Validasi form: pastikan seluruh soal terjawab
  const belumDijawab = soalList.value
    .filter(
      (soal) =>
        jawaban.value[soal.nomor] === undefined ||
        jawaban.value[soal.nomor] === null,
    )
    .map((soal) => soal.nomor);

  if (belumDijawab.length > 0) {
    validationErrors.value = belumDijawab;
    errorMessage.value = `Masih ada ${belumDijawab.length} butir soal yang belum Anda jawab (Soal No: ${belumDijawab.join(", ")}). Mohon lengkapi seluruh soal sebelum mengirim.`;

    // Auto scroll ke soal pertama yang belum dijawab
    scrollToSoal(belumDijawab[0]);
    return;
  }

  isSubmitting.value = true;

  try {
    // 1. Hitung skor otomatis menggunakan pure function calculateScore
    const hasilSkor = calculateScore(soalList.value, jawaban.value);

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
      durasi_detik: elapsedSeconds.value,
      durasi_format: formattedTimer.value,
      waktu_selesai: new Date().toISOString(),
      created_at: serverTimestamp(),
    };

    // 3. Simpan ke Firestore collection 'evaluasi_peserta'
    let docId = "local_" + Date.now();
    let isCloudSaved = false;
    let cloudError = null;

    try {
      const firestoreSave = addDoc(collection(db, "evaluasi_peserta"), payload);
      const timeoutFallback = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Firestore timeout: Server tidak merespons dalam 6 detik",
              ),
            ),
          6000,
        ),
      );
      const docRef = await Promise.race([firestoreSave, timeoutFallback]);
      docId = docRef.id;
      isCloudSaved = true;
      console.log(
        "✅ Evaluasi berhasil disimpan permanen ke Cloud Firestore (evaluasi_peserta):",
        docId,
      );
    } catch (saveError) {
      cloudError = saveError?.message || "Gagal menyimpan ke Firestore Cloud";
      console.warn(
        "⚠️ Penyimpanan remote Firestore gagal/timeout, data dicadangkan ke sesi lokal:",
        saveError,
      );
    }

    // 4. Tandai bahwa ujian telah selesai dan bersihkan draft localStorage
    isSubmitted.value = true;
    try {
      localStorage.removeItem(draftStorageKey.value);
    } catch (e) {
      console.warn("Gagal menghapus draft dari localStorage:", e);
    }

    // 5. Simpan hasil di store dan redirect ke Result.vue
    userStore.setLastResult({
      id: docId,
      isCloudSaved,
      cloudError,
      ...payload,
    });

    router.push("/result");
  } catch (err) {
    console.error("Terjadi kesalahan saat submit evaluasi:", err);
    errorMessage.value = "Gagal mengirim evaluasi: " + err.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-5 sm:space-y-6">
    <!-- Header Lembar Ujian -->
    <header
      class="bg-white border-3 border-neo-black rounded-2xl p-4 sm:p-6 shadow-neo flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <span
            :class="[
              'px-2.5 py-0.5 border-2 border-neo-black rounded-lg font-mono text-[11px] sm:text-xs font-bold uppercase shadow-[2px_2px_0px_0px_#282a36]',
              userStore.status_tes_aktif === 'Pre-Test'
                ? 'bg-neo-pink text-neo-black'
                : 'bg-neo-blue text-neo-black',
            ]"
          >
            {{ userStore.status_tes_aktif }}
          </span>
          <span
            class="text-[11px] sm:text-xs font-mono font-bold text-neo-black/70"
          >
            Workshop Website Portfolio • Google Sites
          </span>
        </div>
        <h1
          class="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-neo-black mt-1"
        >
          Lembar Soal {{ userStore.status_tes_aktif }}
        </h1>
        <p class="text-xs sm:text-sm font-medium mt-1 text-neo-black/85">
          Peserta:
          <strong
            class="text-neo-black underline decoration-neo-pink decoration-2"
            >{{ userStore.nama }}</strong
          >
          (Kelas: <strong>{{ userStore.kelas }}</strong
          >)
        </p>
      </div>

      <!-- Quick Info Mobile Badge (Waktu & Progres) -->
      <div class="flex items-center gap-2.5 sm:gap-3 lg:hidden">
        <div
          class="bg-neo-black text-white px-3 py-1.5 border-2 border-black rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 shadow-neo"
        >
          <span class="material-symbols-outlined text-sm text-neo-yellow"
            >timer</span
          >
          <span>{{ formattedTimer }}</span>
        </div>
        <div
          class="bg-neo-yellow text-neo-black px-3 py-1.5 border-2 border-black rounded-xl font-mono text-xs font-bold shadow-neo"
        >
          <span>Terjawab: {{ totalTerjawab }}/{{ totalSoal }}</span>
        </div>
      </div>
    </header>

    <!-- Alert Notifikasi Pemulihan Draft Otomatis -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="restoredDraftNotice"
        class="bg-neo-yellow border-3 border-neo-black rounded-xl p-3 text-neo-black font-bold text-xs shadow-neo flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-base">restore</span>
          <span
            >Draft jawaban sebelumnya berhasil dipulihkan secara otomatis. Anda
            dapat melanjutkan pengerjaan.</span
          >
        </div>
        <button
          type="button"
          @click="restoredDraftNotice = false"
          class="w-5 h-5 rounded-full bg-neo-black text-white text-[10px] flex items-center justify-center font-bold hover:bg-neo-pink hover:text-neo-black"
        >
          ✕
        </button>
      </div>
    </transition>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="bg-white border-3 border-neo-black rounded-2xl p-8 sm:p-12 text-center shadow-neo"
    >
      <div
        class="animate-spin inline-block w-8 h-8 border-4 border-neo-black border-t-transparent rounded-full mb-3"
      ></div>
      <p class="font-display text-xl sm:text-2xl uppercase tracking-wider">
        Memuat Instrumen Soal...
      </p>
    </div>

    <!-- Error Global Alert -->
    <div
      v-if="errorMessage"
      class="bg-[#ff6b6b] text-white border-3 border-neo-black rounded-xl p-3.5 sm:p-4 font-bold text-xs sm:text-sm shadow-neo flex items-center gap-2"
    >
      <span class="material-symbols-outlined text-base">warning</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 2-COLUMN RESPONSIVE LAYOUT: SOAL (MAIN) + SIDEBAR NAVIGASI SOAL (DESKTOP) -->
    <div v-if="!isLoading" class="flex flex-col lg:flex-row items-start gap-6">
      <!-- KOLOM UTAMA: DAFTAR BUTIR SOAL -->
      <form
        @submit.prevent="handleSubmit"
        :class="[
          'flex-1 min-w-0 space-y-4 sm:space-y-6 w-full pb-24 lg:pb-0',
          sidebarPosition === 'left' ? 'lg:order-2' : 'lg:order-1',
        ]"
      >
        <div
          v-for="soal in soalList"
          :key="soal.nomor"
          :id="`soal-card-${soal.nomor}`"
          :class="[
            'border-3 p-4 sm:p-6 shadow-neo transition-all duration-200 relative rounded-2xl',
            highlightedSoalNomor === soal.nomor
              ? 'ring-4 ring-neo-yellow border-neo-black scale-[1.01]'
              : '',
            validationErrors.includes(soal.nomor)
              ? 'border-[#ff6b6b] bg-red-50'
              : jawaban[soal.nomor] !== undefined
                ? 'border-neo-black bg-white'
                : 'border-neo-black bg-neo-bg',
          ]"
        >
          <!-- Card Header Badge -->
          <div
            class="flex items-center justify-between flex-wrap gap-2 mb-3 sm:mb-4"
          >
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-2.5 py-0.5 sm:px-3 sm:py-1 font-display text-base sm:text-lg tracking-wider border-2 border-neo-black rounded-lg uppercase shadow-[2px_2px_0px_0px_#282a36]',
                  soal.kategori === 'Pilihan Ganda'
                    ? 'bg-neo-pink text-neo-black'
                    : 'bg-neo-blue text-neo-black',
                ]"
              >
                Soal #{{ soal.nomor }}
              </span>
              <span
                class="bg-neo-black text-neo-bg px-2 py-0.5 text-[11px] sm:text-xs font-mono font-bold uppercase rounded-md"
              >
                {{ soal.kategori }}
              </span>
            </div>

            <span
              :class="[
                'text-[11px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 border border-neo-black rounded-md inline-flex items-center gap-1',
                jawaban[soal.nomor] !== undefined
                  ? 'bg-neo-green text-neo-black shadow-[1px_1px_0px_0px_#000]'
                  : 'bg-gray-200 text-gray-700',
              ]"
            >
              <span
                v-if="jawaban[soal.nomor] !== undefined"
                class="material-symbols-outlined text-xs"
                >check</span
              >
              <span>{{
                jawaban[soal.nomor] !== undefined
                  ? "Sudah Terjawab"
                  : "Belum Dijawab"
              }}</span>
            </span>
          </div>

          <!-- Question Text -->
          <h2
            class="font-sans font-bold text-base sm:text-lg md:text-xl text-neo-black mb-4 sm:mb-6 leading-snug"
          >
            {{ soal.pertanyaan }}
          </h2>

          <!-- TIPE: Pilihan Ganda (A, B, C, D Terurut) -->
          <div
            v-if="soal.kategori === 'Pilihan Ganda'"
            class="space-y-2.5 sm:space-y-3"
          >
            <label
              v-for="item in getSortedOpsi(soal.opsi)"
              :key="item.key"
              @click="selectOpsi(soal.nomor, item.key)"
              :class="[
                'flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 border-3 border-neo-black rounded-xl cursor-pointer transition-all duration-150 select-none',
                jawaban[soal.nomor] === item.key
                  ? 'bg-neo-yellow shadow-neo translate-x-1 font-bold border-neo-black'
                  : 'bg-white hover:bg-neo-yellow/30 hover:translate-x-0.5',
              ]"
            >
              <span
                :class="[
                  'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-display text-lg sm:text-xl border-2 border-neo-black rounded-lg shrink-0 mt-0.5 transition-colors',
                  jawaban[soal.nomor] === item.key
                    ? 'bg-neo-black text-neo-bg'
                    : 'bg-neo-bg text-neo-black',
                ]"
              >
                {{ item.key }}
              </span>
              <span
                class="text-xs sm:text-base leading-relaxed break-words flex-1"
                >{{ item.teks }}</span
              >
              <span
                v-if="jawaban[soal.nomor] === item.key"
                class="material-symbols-outlined text-neo-black font-bold text-xl shrink-0"
              >
                check_circle
              </span>
            </label>
          </div>

          <!-- TIPE: Penilaian Diri (Praktik: Bisa / Belum Bisa) -->
          <div
            v-else-if="soal.kategori === 'Praktik'"
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          >
            <button
              type="button"
              @click="selectOpsi(soal.nomor, 'Bisa')"
              :class="[
                'p-3.5 sm:p-4 border-3 border-neo-black rounded-xl font-display text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer select-none',
                jawaban[soal.nomor] === 'Bisa'
                  ? 'bg-neo-green text-neo-black shadow-neo -translate-y-0.5 sm:-translate-y-1 font-black ring-2 ring-black'
                  : 'bg-white hover:bg-neo-green/30',
              ]"
            >
              <span class="material-symbols-outlined text-2xl">thumb_up</span>
              <span>BISA</span>
              <span
                v-if="jawaban[soal.nomor] === 'Bisa'"
                class="material-symbols-outlined text-2xl font-black"
                >check</span
              >
            </button>

            <button
              type="button"
              @click="selectOpsi(soal.nomor, 'Belum Bisa')"
              :class="[
                'p-3.5 sm:p-4 border-3 border-neo-black rounded-xl font-display text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer select-none',
                jawaban[soal.nomor] === 'Belum Bisa'
                  ? 'bg-neo-pink text-neo-black shadow-neo -translate-y-0.5 sm:-translate-y-1 font-black ring-2 ring-black'
                  : 'bg-white hover:bg-neo-pink/30',
              ]"
            >
              <span class="material-symbols-outlined text-2xl">thumb_down</span>
              <span>BELUM BISA</span>
              <span
                v-if="jawaban[soal.nomor] === 'Belum Bisa'"
                class="material-symbols-outlined text-2xl font-black"
                >check</span
              >
            </button>
          </div>
        </div>

        <!-- Submit Section Card -->
        <div
          class="bg-neo-yellow border-3 border-neo-black rounded-2xl p-4 sm:p-6 md:p-8 shadow-neo space-y-4"
        >
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3
                class="font-display text-xl sm:text-2xl uppercase tracking-wider"
              >
                Konfirmasi & Pengiriman
              </h3>
              <p class="text-[11px] sm:text-xs font-medium text-neo-black/80">
                Pastikan seluruh soal telah Anda jawab dengan cermat sebelum
                menyelesaikan sesi.
              </p>
            </div>
            <span
              class="font-mono font-bold text-xs sm:text-sm bg-white border-2 border-neo-black rounded-lg px-2.5 sm:px-3 py-1 shadow-[2px_2px_0px_0px_#000]"
            >
              Status: {{ totalTerjawab }} / {{ totalSoal }} Soal Selesai
            </span>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3.5 sm:py-4 px-4 sm:px-6 text-center font-display text-xl sm:text-2xl md:text-3xl uppercase tracking-wider border-3 border-neo-black rounded-xl bg-neo-pink text-neo-black shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span
              v-if="isSubmitting"
              class="flex items-center justify-center gap-2"
            >
              <span
                class="animate-spin inline-block w-6 h-6 border-3 border-neo-black border-t-transparent rounded-full"
              ></span>
              <span>Mengirim & Menghitung Skor...</span>
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <span>Kirim Jawaban & Selesaikan Tes</span>
              <span class="material-symbols-outlined text-2xl"
                >arrow_forward</span
              >
            </span>
          </button>
        </div>
      </form>

      <!-- KOLOM SIDEBAR: PALET NOMOR SOAL (STICKY DI KANAN / KIRI PADA DESKTOP) -->
      <aside
        :class="[
          'hidden lg:block w-80 shrink-0 sticky top-28 z-20 space-y-4',
          sidebarPosition === 'left' ? 'lg:order-1' : 'lg:order-2',
        ]"
      >
        <div
          class="bg-white border-3 border-neo-black shadow-neo overflow-hidden mt-3 rounded-2xl"
        >
          <!-- Window Header Bar dengan Tombol Pengatur Posisi (Kanan/Kiri) -->
          <div
            class="bg-neo-black text-white px-3.5 py-2.5 flex items-center justify-between border-b-3 border-neo-black select-none"
          >
            <div class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black inline-block"
              ></span>
              <span
                class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black inline-block"
              ></span>
              <span
                class="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black inline-block"
              ></span>
              <span
                class="font-mono text-xs font-bold uppercase tracking-wider ml-1 text-neo-yellow"
              >
                PALET SOAL
              </span>
            </div>

            <!-- Tombol Tukar Posisi Kanan / Kiri -->
            <button
              type="button"
              @click="toggleSidebarPosition"
              class="px-2 py-0.5 bg-neo-yellow text-neo-black text-[10px] font-mono font-bold uppercase hover:bg-white transition-colors cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_0px_#000] rounded-md"
              :title="`Pindahkan navigasi soal ke sisi ${sidebarPosition === 'right' ? 'Kiri' : 'Kanan'}`"
            >
              <span class="material-symbols-outlined text-[13px]">{{
                sidebarPosition === "right" ? "arrow_back" : "arrow_forward"
              }}</span>
              <span>{{
                sidebarPosition === "right" ? "Posisi Kiri" : "Posisi Kanan"
              }}</span>
            </button>
          </div>

          <div class="p-4 space-y-4">
            <!-- Timer & Skor Ringkas -->
            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="bg-neo-black text-white p-2.5 border-2 border-black rounded-xl">
                <span
                  class="text-[10px] font-mono uppercase text-neo-yellow block"
                  >WAKTU:</span
                >
                <span
                  class="font-display text-2xl tracking-widest text-white leading-none mt-0.5 inline-block"
                  >{{ formattedTimer }}</span
                >
              </div>
              <div
                class="bg-neo-yellow text-neo-black p-2.5 border-2 border-black rounded-xl"
              >
                <span
                  class="text-[10px] font-mono font-bold uppercase text-neo-black block"
                  >TERJAWAB:</span
                >
                <span
                  class="font-display text-2xl text-neo-black leading-none mt-0.5 inline-block"
                  >{{ totalTerjawab }} / {{ totalSoal }}</span
                >
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-1">
              <div
                class="flex justify-between text-[11px] font-mono font-bold text-neo-black"
              >
                <span>Kelengkapan:</span>
                <span>{{ persentaseSelesai }}%</span>
              </div>
              <div
                class="h-2.5 bg-gray-200 border-2 border-black overflow-hidden rounded-full"
              >
                <div
                  class="h-full bg-neo-green transition-all duration-300 rounded-full"
                  :style="{ width: `${persentaseSelesai}%` }"
                ></div>
              </div>
            </div>

            <!-- Grid 12 Tombol Nomor Soal (4 Kolom x 3 Baris) -->
            <div>
              <span
                class="text-[10px] font-mono font-bold uppercase text-neo-black/60 block mb-1.5"
              >
                PILIH NOMOR BUTIR:
              </span>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="soal in soalList"
                  :key="soal.nomor"
                  type="button"
                  @click="scrollToSoal(soal.nomor)"
                  :class="[
                    'h-11 flex flex-col items-center justify-center border-2 border-black rounded-lg font-display text-lg transition-all cursor-pointer select-none',
                    validationErrors.includes(soal.nomor)
                      ? 'bg-[#ff5555] text-white animate-pulse font-black shadow-[2px_2px_0px_0px_#000]'
                      : jawaban[soal.nomor] !== undefined
                        ? 'bg-neo-green text-neo-black font-black shadow-[2px_2px_0px_0px_#000] hover:scale-105'
                        : 'bg-white text-neo-black hover:bg-neo-yellow hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_#000]',
                  ]"
                  :title="`Nomor ${soal.nomor}: ${jawaban[soal.nomor] !== undefined ? 'Sudah Terjawab (' + jawaban[soal.nomor] + ')' : 'Belum Dijawab'}`"
                >
                  <span class="leading-none">{{ soal.nomor }}</span>
                  <span
                    v-if="jawaban[soal.nomor] !== undefined"
                    class="material-symbols-outlined text-[12px] -mt-0.5 font-black"
                    >check</span
                  >
                </button>
              </div>
            </div>

            <!-- Legenda Status -->
            <div
              class="pt-2 border-t-2 border-neo-black/20 flex items-center justify-between text-[10px] font-mono font-bold text-neo-black/80"
            >
              <div class="flex items-center gap-1">
                <span
                  class="w-3 h-3 bg-neo-green border border-black rounded inline-block"
                ></span>
                <span>Terjawab</span>
              </div>
              <div class="flex items-center gap-1">
                <span
                  class="w-3 h-3 bg-white border border-black rounded inline-block"
                ></span>
                <span>Belum</span>
              </div>
              <div class="flex items-center gap-1">
                <span
                  class="w-3 h-3 bg-[#ff5555] border border-black rounded inline-block"
                ></span>
                <span>Kurang</span>
              </div>
            </div>

            <!-- Aksi Lompat ke Soal Kosong -->
            <button
              v-if="totalTerjawab < totalSoal"
              type="button"
              @click="jumpToNextUnanswered"
              class="w-full py-2.5 px-3 bg-neo-pink text-neo-black border-2 border-neo-black rounded-xl font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-white active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">skip_next</span>
              <span>Lompat ke Soal Kosong</span>
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- FLOATING TOGGLE NAVIGASI UNTUK MOBILE (DOCK DI BAWAH KIRI, TIDAK TERTUTUP NAVBAR) -->
    <button
      v-if="!isLoading"
      type="button"
      @click="isMobilePaletteOpen = true"
      class="lg:hidden fixed bottom-5 left-4 z-40 px-3.5 py-2.5 bg-neo-yellow text-neo-black border-3 border-neo-black rounded-xl shadow-neo font-mono font-bold text-xs uppercase flex items-center gap-2 hover:bg-white active:translate-y-0.5 transition-all cursor-pointer"
    >
      <span class="material-symbols-outlined text-base">grid_view</span>
      <span>Palet Soal ({{ totalTerjawab }}/{{ totalSoal }})</span>
    </button>

    <!-- MODAL / BOTTOM SHEET PALET MOBILE -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-6"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-6"
    >
      <div
        v-if="isMobilePaletteOpen"
        @click.self="isMobilePaletteOpen = false"
        class="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div
          class="bg-white border-t-3 sm:border-3 border-neo-black w-full max-w-md p-5 shadow-neo max-h-[85vh] overflow-y-auto space-y-4 rounded-t-3xl sm:rounded-2xl"
        >
          <div
            class="flex items-center justify-between border-b-2 border-neo-black pb-3"
          >
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-xl">grid_view</span>
              <h3 class="font-display text-xl uppercase tracking-wider">
                Palet Nomor Soal
              </h3>
            </div>
            <button
              @click="isMobilePaletteOpen = false"
              class="w-8 h-8 rounded-full bg-neo-black text-white font-bold flex items-center justify-center hover:bg-neo-pink hover:text-neo-black cursor-pointer"
              title="Tutup Palet"
            >
              ✕
            </button>
          </div>

          <!-- Timer & Info di Modal Mobile -->
          <div
            class="flex items-center justify-between text-xs font-mono font-bold bg-neo-bg p-2.5 border-2 border-black rounded-xl"
          >
            <span>⏱️ Waktu: {{ formattedTimer }}</span>
            <span
              >✅ Terjawab: {{ totalTerjawab }}/{{ totalSoal }} ({{
                persentaseSelesai
              }}%)</span
            >
          </div>

          <!-- Grid 12 Tombol di Modal Mobile -->
          <div class="grid grid-cols-4 gap-2.5">
            <button
              v-for="soal in soalList"
              :key="soal.nomor"
              type="button"
              @click="scrollToSoal(soal.nomor)"
              :class="[
                'h-12 flex flex-col items-center justify-center border-2 border-black rounded-lg font-display text-xl transition-all cursor-pointer',
                validationErrors.includes(soal.nomor)
                  ? 'bg-[#ff5555] text-white font-black shadow-neo animate-pulse'
                  : jawaban[soal.nomor] !== undefined
                    ? 'bg-neo-green text-neo-black font-black shadow-neo'
                    : 'bg-white text-neo-black shadow-neo',
              ]"
            >
              <span>{{ soal.nomor }}</span>
              <span
                v-if="jawaban[soal.nomor] !== undefined"
                class="material-symbols-outlined text-xs -mt-1 font-black"
                >check</span
              >
            </button>
          </div>

          <button
            v-if="totalTerjawab < totalSoal"
            type="button"
            @click="jumpToNextUnanswered"
            class="w-full py-2.5 bg-neo-pink text-neo-black border-2 border-neo-black rounded-xl font-mono font-bold text-xs uppercase shadow-neo flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white transition-colors"
          >
            <span class="material-symbols-outlined text-base">skip_next</span>
            <span>Lompat ke Soal Belum Terjawab</span>
          </button>

          <button
            @click="isMobilePaletteOpen = false"
            class="w-full py-2 bg-gray-200 border-2 border-black rounded-xl font-mono font-bold text-xs uppercase cursor-pointer hover:bg-gray-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
