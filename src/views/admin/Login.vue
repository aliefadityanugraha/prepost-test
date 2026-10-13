<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const isRegisterMode = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const toggleMode = (register) => {
  isRegisterMode.value = register
  errorMessage.value = ''
  infoMessage.value = ''
}

const handleLogin = async () => {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Email dan Password wajib diisi!'
    return
  }

  isLoading.value = true
  try {
    await authStore.loginWithFirebase(email.value.trim(), password.value)
    router.push('/admin/dashboard')
  } catch (err) {
    console.error('Firebase Auth Error:', err)
    let msg = 'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      msg = 'Kredensial salah: Email atau password tidak sesuai.'
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Format alamat email tidak valid.'
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.'
    } else if (err.code === 'auth/configuration-not-found') {
      msg = 'Layanan Firebase Authentication belum diaktifkan di Firebase Console! Buka Firebase Console > Authentication > klik "Get started" lalu aktifkan "Email/Password".'
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = 'Provider Email/Password belum diaktifkan di Firebase Console! Buka Firebase Console > Authentication > Sign-in method > Aktifkan "Email/Password".'
    } else if (err.code === 'auth/api-key-not-valid' || err.message?.includes('API key')) {
      msg = 'API Key Firebase belum valid di .env. Anda dapat menggunakan mode "Login Demo Admin" di bawah untuk pengujian lokal.'
    } else {
      msg = `Error (${err.code || 'Auth'}): ${err.message}`
    }
    errorMessage.value = msg
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Email dan Password wajib diisi!'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Kata sandi minimal 6 karakter!'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok!'
    return
  }

  isLoading.value = true
  try {
    await authStore.registerWithFirebase(email.value.trim(), password.value)
    infoMessage.value = 'Akun admin berhasil didaftarkan ke Firebase!'
    setTimeout(() => {
      router.push('/admin/dashboard')
    }, 600)
  } catch (err) {
    console.error('Firebase Register Error:', err)
    let msg = 'Gagal mendaftarkan akun admin.'
    if (err.code === 'auth/email-already-in-use') {
      msg = 'Email ini sudah terdaftar! Silakan beralih ke tab "Masuk".'
    } else if (err.code === 'auth/configuration-not-found') {
      msg = 'Layanan Firebase Authentication belum diaktifkan di Firebase Console! Buka Firebase Console > Authentication > klik "Get started" lalu aktifkan "Email/Password".'
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = 'Provider Email/Password belum diaktifkan di Firebase Console! Buka Firebase Console > Authentication > Sign-in method > Aktifkan "Email/Password".'
    } else if (err.code === 'auth/weak-password') {
      msg = 'Kata sandi terlalu lemah (minimal 6 karakter).'
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Format alamat email tidak valid.'
    } else {
      msg = `Error (${err.code || 'Auth'}): ${err.message}`
    }
    errorMessage.value = msg
  } finally {
    isLoading.value = false
  }
}

const handleDemoLogin = () => {
  authStore.loginAsDemoAdmin()
  infoMessage.value = 'Berhasil login sebagai Demo Administrator!'
  setTimeout(() => {
    router.push('/admin/dashboard')
  }, 400)
}
</script>

<template>
  <div class="max-w-md mx-auto my-6 sm:my-12 space-y-6">
    <!-- Back to Public Link -->
    <div class="flex items-center justify-between">
      <router-link
        to="/"
        class="inline-flex items-center gap-2 border-3 border-neo-black bg-white px-3 py-1 text-xs font-bold uppercase shadow-neo hover:bg-neo-yellow transition-all"
      >
        ← Kembali ke Halaman Peserta
      </router-link>
      <span class="text-xs font-mono font-bold uppercase text-neo-black/70">
        Portal Keamanan
      </span>
    </div>

    <!-- Login Card -->
    <div class="bg-white border-3 border-neo-black p-6 sm:p-10 shadow-neo space-y-6">
      <!-- Mode Tabs (Masuk vs Daftar) -->
      <div class="grid grid-cols-2 border-3 border-neo-black bg-neo-bg">
        <button
          type="button"
          @click="toggleMode(false)"
          :class="[
            'py-2.5 font-display text-lg uppercase tracking-wider transition-all',
            !isRegisterMode ? 'bg-neo-pink text-neo-black font-bold border-r-3 border-neo-black shadow-inner' : 'bg-transparent text-neo-black/70 hover:bg-white'
          ]"
        >
          Masuk Admin
        </button>
        <button
          type="button"
          @click="toggleMode(true)"
          :class="[
            'py-2.5 font-display text-lg uppercase tracking-wider transition-all',
            isRegisterMode ? 'bg-neo-yellow text-neo-black font-bold shadow-inner' : 'bg-transparent text-neo-black/70 hover:bg-white'
          ]"
        >
          Daftar Admin Baru
        </button>
      </div>

      <!-- Header -->
      <div class="border-b-3 border-neo-black pb-4 text-center space-y-2">
        <div class="w-12 h-12 mx-auto bg-neo-blue border-3 border-neo-black shadow-neo flex items-center justify-center font-display text-3xl text-neo-black">
          {{ isRegisterMode ? '📝' : '🔐' }}
        </div>
        <h1 class="font-display text-3xl sm:text-4xl uppercase tracking-wider text-neo-black leading-none mt-2">
          {{ isRegisterMode ? 'Registrasi Admin' : 'Admin Login' }}
        </h1>
        <p class="text-xs font-medium text-neo-black/80">
          {{ isRegisterMode ? 'Daftarkan akun admin baru ke Firebase Authentication' : 'Autentikasi Firebase Modular untuk Instruktur & Evaluator' }}
        </p>
      </div>

      <!-- Alerts -->
      <div v-if="errorMessage" class="p-4 bg-[#ff6b6b] text-white border-3 border-neo-black font-bold text-xs shadow-neo leading-relaxed">
        ⚠️ {{ errorMessage }}
      </div>
      <div v-if="infoMessage" class="p-4 bg-neo-green border-3 border-neo-black font-bold text-xs shadow-neo leading-relaxed">
        🎉 {{ infoMessage }}
      </div>

      <!-- Form -->
      <form @submit.prevent="isRegisterMode ? handleRegister() : handleLogin()" class="space-y-4">
        <!-- Input Email -->
        <div class="space-y-1.5">
          <label for="admin-email" class="block font-bold text-xs uppercase tracking-wider text-neo-black">
            Email Administrator <span class="text-neo-pink">*</span>
          </label>
          <input
            id="admin-email"
            v-model="email"
            type="email"
            placeholder="admin@sekolah.sch.id"
            required
            class="w-full px-4 py-3 bg-neo-bg border-3 border-neo-black text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
          />
        </div>

        <!-- Input Password -->
        <div class="space-y-1.5">
          <label for="admin-password" class="block font-bold text-xs uppercase tracking-wider text-neo-black">
            Kata Sandi <span class="text-neo-pink">*</span>
          </label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            class="w-full px-4 py-3 bg-neo-bg border-3 border-neo-black text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
          />
          <p v-if="isRegisterMode" class="text-[11px] font-mono text-neo-black/60">
            Minimal 6 karakter.
          </p>
        </div>

        <!-- Input Konfirmasi Password (Mode Daftar) -->
        <div v-if="isRegisterMode" class="space-y-1.5">
          <label for="admin-confirm-password" class="block font-bold text-xs uppercase tracking-wider text-neo-black">
            Konfirmasi Kata Sandi <span class="text-neo-pink">*</span>
          </label>
          <input
            id="admin-confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            class="w-full px-4 py-3 bg-neo-bg border-3 border-neo-black text-neo-black font-medium text-sm focus:bg-white focus:outline-none focus:shadow-neo transition-all"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          :class="[
            'w-full py-3.5 px-6 font-display text-2xl uppercase tracking-wider border-3 border-neo-black text-neo-black shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed',
            isRegisterMode ? 'bg-neo-yellow' : 'bg-neo-pink'
          ]"
        >
          <span v-if="isLoading" class="animate-spin inline-block w-4 h-4 border-2 border-neo-black border-t-transparent rounded-full"></span>
          <span>{{ isLoading ? 'Memproses...' : (isRegisterMode ? 'Daftar Akun Baru ➔' : 'Masuk Admin ➔') }}</span>
        </button>
      </form>

      <!-- Mode Switch Helper -->
      <div class="text-center pt-2">
        <button
          type="button"
          @click="toggleMode(!isRegisterMode)"
          class="text-xs font-bold underline hover:text-neo-pink transition-colors cursor-pointer"
        >
          {{ isRegisterMode ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun admin? Buat akun di sini' }}
        </button>
      </div>

      <!-- Quick Demo Login Alternative -->
      <div class="border-t-3 border-neo-black pt-4 text-center space-y-3">
        <span class="text-[11px] font-bold uppercase tracking-wider text-neo-black/70 block">
          Pengujian Lokal / Mode Cepat?
        </span>
        <button
          type="button"
          @click="handleDemoLogin"
          class="w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-3 border-neo-black bg-neo-blue text-neo-black shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer"
        >
          ⚡ Masuk Cepat sebagai Demo Admin
        </button>
      </div>
    </div>
  </div>
</template>
