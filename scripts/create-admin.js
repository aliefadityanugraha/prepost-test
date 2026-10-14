import { auth } from '../src/firebase.js'
import { createUserWithEmailAndPassword } from 'firebase/auth'

const args = process.argv.slice(2)
const email = args[0] || 'admin@workshop.id'
const password = args[1] || 'admin123'

if (!args[0] || !args[1]) {
  console.log('ℹ️ Tidak ada argumen email/password yang diberikan.')
  console.log(`ℹ️ Menggunakan kredensial admin default: ${email} / ${password}`)
  console.log('📌 Tips: Anda juga dapat menentukan kredensial sendiri dengan:')
  console.log('   npm run create-admin <email> <password>\n')
}

try {
  console.log(`📡 Menghubungkan ke Firebase Auth...`)
  console.log(`Mendaftarkan email: ${email}`)
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  console.log('🎉 AKUN ADMIN BERHASIL DIDAFTARKAN KE FIREBASE!')
  console.log('UID   :', cred.user.uid)
  console.log('Email :', cred.user.email)
  console.log('Silakan login di halaman: http://localhost:5173/admin/login')
  process.exit(0)
} catch (err) {
  console.error('\n❌ GAGAL MENDAFTARKAN AKUN:')
  if (err.code === 'auth/configuration-not-found') {
    console.error('⚠️ Layanan Firebase Authentication belum diaktifkan di Firebase Console proyek Anda!')
    console.error('')
    console.error('👉 LANGKAH AKTIVASI (Hanya 1 Menit):')
    console.error('   1. Buka: https://console.firebase.google.com/project/prepost-test-1edce/authentication')
    console.error('   2. Klik tombol "Get started"')
    console.error('   3. Di tab "Sign-in method", klik "Email/Password"')
    console.error('   4. Aktifkan toggle "Enable" pada opsi pertama, lalu klik "Save"')
    console.error('   5. Jalankan kembali perintah ini: npm run create-admin ' + email + ' ' + password)
    console.error('')
  } else if (err.code === 'auth/operation-not-allowed') {
    console.error('⚠️ Provider Email/Password belum diaktifkan di Firebase Console!')
    console.error('👉 Buka Firebase Console > Authentication > Sign-in method > Aktifkan "Email/Password".')
  } else if (err.code === 'auth/email-already-in-use') {
    console.error('⚠️ Email ini sudah terdaftar sebelumnya!')
  } else if (err.code === 'auth/weak-password') {
    console.error('⚠️ Password terlalu lemah! Minimal harus 6 karakter.')
  } else {
    console.error(`[${err.code}] ${err.message}`)
  }
  process.exitCode = 1
}
