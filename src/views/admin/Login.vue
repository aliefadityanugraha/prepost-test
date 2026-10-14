<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const isLoading = ref(false);
const errorMessage = ref("");

const handleLogin = async () => {
  errorMessage.value = "";

  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = "Email dan Password wajib diisi!";
    return;
  }

  isLoading.value = true;
  try {
    await authStore.loginWithFirebase(email.value.trim(), password.value);
    const targetRedirect = route.query.redirect || "/admin/dashboard";
    router.push(targetRedirect);
  } catch (err) {
    console.error("Firebase Auth Error:", err);
    let msg = "Gagal masuk. Periksa kembali email dan kata sandi Anda.";
    if (
      err.code === "auth/invalid-credential" ||
      err.code === "auth/wrong-password" ||
      err.code === "auth/user-not-found"
    ) {
      msg = "Kredensial salah: Email atau password tidak sesuai.";
    } else if (err.code === "auth/invalid-email") {
      msg = "Format alamat email tidak valid.";
    } else if (err.code === "auth/network-request-failed") {
      msg =
        "Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.";
    } else if (err.code === "auth/configuration-not-found") {
      msg =
        'Layanan Firebase Authentication belum diaktifkan di Firebase Console! Buka Firebase Console > Authentication > klik "Get started" lalu aktifkan "Email/Password".';
    } else if (err.code === "auth/operation-not-allowed") {
      msg =
        'Provider Email/Password belum diaktifkan di Firebase Console! Buka Firebase Console > Authentication > Sign-in method > Aktifkan "Email/Password".';
    } else if (
      err.code === "auth/api-key-not-valid" ||
      err.message?.includes("API key")
    ) {
      msg =
        "API Key Firebase belum valid di .env. Periksa kembali konfigurasi kredensial Firebase Anda.";
    } else {
      msg = `Error (${err.code || "Auth"}): ${err.message}`;
    }
    errorMessage.value = msg;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="max-w-md mx-auto my-6 sm:my-12 space-y-6">
    <!-- Back to Public Link -->
    <div class="flex items-center justify-between">
      <router-link
        to="/"
        class="inline-flex items-center gap-1.5 border-3 border-neo-black bg-white rounded-lg px-3 py-1 text-xs font-bold uppercase shadow-neo hover:bg-neo-yellow transition-all"
      >
        <span class="material-symbols-outlined text-[14px]">arrow_back</span>
        <span>Kembali ke Halaman Peserta</span>
      </router-link>
      <span
        class="text-xs font-mono font-bold uppercase text-neo-black/70 flex items-center gap-1"
      >
        <span class="material-symbols-outlined text-[14px]">shield</span>
        <span>Portal Keamanan</span>
      </span>
    </div>

    <!-- Login Card -->
    <div
      class="bg-white border-3 border-neo-black rounded-2xl p-4 sm:p-8 md:p-10 shadow-neo space-y-5 sm:space-y-6"
    >
      <!-- Header -->
      <div class="border-b-3 border-neo-black pb-4 text-center space-y-2">
        <div
          class="w-12 h-12 mx-auto bg-neo-blue border-3 border-neo-black rounded-xl shadow-neo flex items-center justify-center font-display text-neo-black"
        >
          <span class="material-symbols-outlined text-2xl"
            >admin_panel_settings</span
          >
        </div>
        <h1
          class="font-display text-2xl sm:text-4xl uppercase tracking-wider text-neo-black leading-none mt-2"
        >
          Admin Login
        </h1>
        <p class="text-xs font-medium text-neo-black/80">
          Akses Khusus Instruktur & Evaluator Workshop
        </p>
      </div>

      <!-- Alerts -->
      <div
        v-if="errorMessage"
        class="p-3.5 sm:p-4 bg-[#ff6b6b] text-white border-3 border-neo-black rounded-xl font-bold text-xs shadow-neo leading-relaxed flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-base shrink-0"
          >warning</span
        >
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Form Login -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Input Email -->
        <div class="space-y-1.5">
          <label
            for="admin-email"
            class="block font-bold text-xs uppercase tracking-wider text-neo-black"
          >
            Email Administrator <span class="text-neo-pink">*</span>
          </label>
          <input
            id="admin-email"
            v-model="email"
            type="email"
            placeholder="admin@workshop.id"
            required
            class="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-neo-bg border-3 border-neo-black rounded-xl text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
          />
        </div>

        <!-- Input Password -->
        <div class="space-y-1.5">
          <label
            for="admin-password"
            class="block font-bold text-xs uppercase tracking-wider text-neo-black"
          >
            Kata Sandi <span class="text-neo-pink">*</span>
          </label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            class="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-neo-bg border-3 border-neo-black rounded-xl text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 sm:py-3.5 px-4 sm:px-6 font-display text-xl sm:text-2xl uppercase tracking-wider border-3 border-neo-black rounded-xl text-neo-black bg-neo-pink shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed font-bold"
        >
          <span
            v-if="isLoading"
            class="animate-spin inline-block w-4 h-4 border-2 border-neo-black border-t-transparent rounded-full"
          ></span>
          <span>{{ isLoading ? "Memproses..." : "Masuk Admin" }}</span>
          <span v-if="!isLoading" class="material-symbols-outlined text-xl"
            >arrow_forward</span
          >
        </button>
      </form>
    </div>
  </div>
</template>
