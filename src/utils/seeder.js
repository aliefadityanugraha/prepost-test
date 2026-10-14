import { db } from '../firebase'
import {
  collection,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'

/**
 * =========================================================================
 * BANK SOAL PILIHAN GANDA (dipakai bersama oleh Pre-Test dan Post-Test)
 * Soal bersifat konseptual-kritis (mengapa / apa bedanya / apa akibatnya),
 * bukan soal cerita, dengan bahasa yang mudah dipahami siswa.
 * Soal PG sengaja identik di Pre-Test & Post-Test agar skor bisa dibandingkan.
 * =========================================================================
 */
const bankPG = [
  {
    nomor: 1,
    pertanyaan: 'Portofolio sering disebut sebagai "proof of work". Apa maksud sebenarnya?',
    opsi: {
      A: 'Bukti bahwa seseorang sudah lulus dari sekolah',
      B: 'Bukti bahwa seseorang punya banyak sertifikat',
      C: 'Bukti nyata kemampuan seseorang lewat hasil kerja yang bisa dilihat langsung',
      D: 'Bukti bahwa seseorang rajin masuk sekolah',
    },
    kunci_jawaban: 'C',
  },
  {
    nomor: 2,
    pertanyaan: 'Apa perbedaan paling mendasar antara CV dan portofolio?',
    opsi: {
      A: 'CV merangkum riwayat dan pengalaman, sedangkan portofolio memperlihatkan hasil karya secara langsung',
      B: 'CV hanya untuk karyawan, portofolio hanya untuk pelajar',
      C: 'CV harus berwarna, portofolio harus hitam putih',
      D: 'Tidak ada perbedaan, keduanya sama persis',
    },
    kunci_jawaban: 'A',
  },
  {
    nomor: 3,
    pertanyaan: 'Mengapa karya untuk portofolio perlu dikurasi (dipilih), bukan semua dimasukkan?',
    opsi: {
      A: 'Karena website punya batas maksimal 5 karya',
      B: 'Karena karya yang lama otomatis tidak boleh dipakai lagi',
      C: 'Karena perekrut hanya mau melihat karya yang berwarna',
      D: 'Karena karya terbaik akan lebih menonjol dan kemampuan kita lebih mudah dinilai jika yang ditampilkan hanya yang kuat dan relevan',
    },
    kunci_jawaban: 'D',
  },
  {
    nomor: 4,
    pertanyaan: 'Mengapa kita tidak boleh memasukkan karya orang lain dan mengaku sebagai milik sendiri di portofolio?',
    opsi: {
      A: 'Karena karya orang lain biasanya berukuran terlalu besar',
      B: 'Karena itu tidak jujur, melanggar hak cipta, dan bisa menghancurkan kepercayaan serta reputasi kita',
      C: 'Karena Google Sites melarang semua gambar dari luar',
      D: 'Karena hasilnya pasti terlihat jelek',
    },
    kunci_jawaban: 'B',
  },
  {
    nomor: 5,
    pertanyaan: 'Manakah alasan yang paling tepat mengapa Google Sites cocok untuk pemula yang ingin membuat portofolio?',
    opsi: {
      A: 'Karena wajib menguasai bahasa pemrograman terlebih dahulu',
      B: 'Karena gratis, tidak perlu coding, dan mudah terhubung dengan Google Drive serta YouTube',
      C: 'Karena hanya bisa diakses oleh pemiliknya sendiri',
      D: 'Karena semua desainnya bisa diubah sebebas-bebasnya seperti web berbasis kode',
    },
    kunci_jawaban: 'B',
  },
  {
    nomor: 6,
    pertanyaan: 'Dibandingkan website yang dibuat dengan kode (HTML/CSS), apa keterbatasan utama Google Sites?',
    opsi: {
      A: 'Pilihan desain dan kustomisasinya lebih terbatas',
      B: 'Harus membayar biaya bulanan yang mahal',
      C: 'Tidak bisa menampilkan foto sama sekali',
      D: 'Hanya bisa dibuka di komputer sekolah',
    },
    kunci_jawaban: 'A',
  },
  {
    nomor: 7,
    pertanyaan: 'Mengapa video portofolio lebih baik disematkan (embed) dari YouTube daripada diunggah langsung ke website?',
    opsi: {
      A: 'Karena video di YouTube otomatis menjadi lebih bagus kualitasnya',
      B: 'Karena video yang diunggah langsung pasti dihapus oleh Google',
      C: 'Karena pengunjung tidak bisa menonton video yang diunggah langsung',
      D: 'Karena menghemat ruang penyimpanan dan membuat halaman website lebih ringan dibuka',
    },
    kunci_jawaban: 'D',
  },
  {
    nomor: 8,
    pertanyaan: 'Mengapa setiap karya sebaiknya diberi deskripsi singkat (peran, alat yang dipakai, dan hasil)?',
    opsi: {
      A: 'Supaya halaman terlihat lebih penuh tulisan',
      B: 'Supaya website otomatis naik peringkat di Google',
      C: 'Supaya pengunjung paham kontribusi dan proses kerja kita, bukan hanya melihat hasil akhirnya',
      D: 'Supaya karya tidak bisa dicuri orang lain',
    },
    kunci_jawaban: 'C',
  },
  {
    nomor: 9,
    pertanyaan: 'Untuk karya kelompok, mengapa kita perlu menuliskan peran spesifik kita sendiri?',
    opsi: {
      A: 'Karena karya kelompok tidak boleh dimasukkan ke portofolio',
      B: 'Karena jujur soal kontribusi membuat portofolio lebih kredibel dan menunjukkan keahlian yang benar-benar kita kuasai',
      C: 'Karena anggota kelompok lain wajib dihapus namanya',
      D: 'Karena perekrut hanya peduli pada karya individu',
    },
    kunci_jawaban: 'B',
  },
  {
    nomor: 10,
    pertanyaan: 'Mengapa halaman utama portofolio sebaiknya berisi nama, bidang keahlian, dan beberapa karya unggulan?',
    opsi: {
      A: 'Karena pengunjung biasanya menilai dalam waktu singkat, sehingga informasi terpenting harus langsung terlihat',
      B: 'Karena halaman lain tidak boleh berisi apa pun',
      C: 'Karena Google Sites hanya mengizinkan satu halaman',
      D: 'Karena karya lain pasti tidak penting',
    },
    kunci_jawaban: 'A',
  },
  {
    nomor: 11,
    pertanyaan: 'Apa fungsi utama menu navigasi pada sebuah website portofolio?',
    opsi: {
      A: 'Menghiasi bagian atas halaman saja',
      B: 'Menyembunyikan karya agar tidak mudah dilihat',
      C: 'Memudahkan pengunjung menemukan bagian yang ingin dilihat tanpa kebingungan',
      D: 'Mengunci website agar tidak bisa diubah',
    },
    kunci_jawaban: 'C',
  },
  {
    nomor: 12,
    pertanyaan: 'Mengapa warna, jenis huruf, dan tata letak sebaiknya dibuat konsisten di seluruh halaman?',
    opsi: {
      A: 'Karena aturan Google Sites mewajibkannya',
      B: 'Karena website akan error jika desainnya berbeda-beda',
      C: 'Karena warna yang banyak membuat website lebih cepat dibuka',
      D: 'Karena konsistensi membuat tampilan lebih rapi, profesional, dan nyaman dibaca',
    },
    kunci_jawaban: 'D',
  },
  {
    nomor: 13,
    pertanyaan: 'Mengapa portofolio sebaiknya mencantumkan kontak (misalnya email aktif atau akun profesional)?',
    opsi: {
      A: 'Agar perekrut atau klien yang tertarik bisa langsung menghubungi kita',
      B: 'Agar website terlihat lebih panjang',
      C: 'Agar nomor telepon kita terkenal',
      D: 'Agar kita bisa menerima banyak iklan',
    },
    kunci_jawaban: 'A',
  },
  {
    nomor: 14,
    pertanyaan: 'Agar website Google Sites bisa dibuka orang lain melalui link, langkah yang harus dilakukan adalah...',
    opsi: {
      A: 'Cukup menyalin alamat dari bilah pencarian saat mengedit',
      B: 'Menekan Publish (Terbitkan) dan memastikan pengaturan aksesnya terbuka untuk umum',
      C: 'Mengirim file website lewat flashdisk',
      D: 'Menutup browser lalu membukanya kembali',
    },
    kunci_jawaban: 'B',
  },
  {
    nomor: 15,
    pertanyaan: 'Mengapa portofolio perlu diperbarui secara berkala?',
    opsi: {
      A: 'Karena Google akan menghapus website yang tidak diubah tiap minggu',
      B: 'Karena karya lama tidak boleh ditampilkan sama sekali',
      C: 'Karena portofolio harus mencerminkan kemampuan terbaru kita, sehingga tetap relevan saat dilihat perekrut',
      D: 'Karena link website akan berubah dengan sendirinya',
    },
    kunci_jawaban: 'C',
  },
]

const buatSoalPG = (jenis) =>
  bankPG.map((soal) => ({
    nomor: soal.nomor,
    jenis_tes: jenis,
    kategori: 'Pilihan Ganda',
    pertanyaan: soal.pertanyaan,
    opsi: soal.opsi,
    kunci_jawaban: soal.kunci_jawaban,
    bobot: 1,
  }))

/**
 * =========================================================================
 * 1. INSTRUMEN PRE-TEST (SEBELUM WORKSHOP)
 * Workshop Pembuatan Website Portfolio dengan Google Sites
 * Total: 20 Soal = 15 Pilihan Ganda (6 poin/soal) + 5 Praktik/Penilaian Diri (2 poin/soal) = 100 poin
 * =========================================================================
 */
export const dataPreTestPG = buatSoalPG('Pre-Test')

export const dataPreTestPraktik = [
  {
    nomor: 16,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saat ini, saya sudah bisa membuat website dengan beberapa halaman dan menu navigasi menggunakan Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 17,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah bisa memilih karya terbaik saya dengan alasan yang jelas (kualitas, variasi, dan relevansi).',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 18,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah bisa memasukkan (embed) video YouTube dan menambahkan foto ke dalam sebuah website.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 19,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah bisa menulis deskripsi singkat untuk tiap karya (peran saya, alat yang dipakai, dan hasilnya).',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 20,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah bisa memublikasikan website dan mengatur agar link-nya bisa dibuka oleh siapa saja.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
]

export const dataSoalPreTest = [...dataPreTestPG, ...dataPreTestPraktik]

/**
 * =========================================================================
 * 2. INSTRUMEN POST-TEST (SETELAH WORKSHOP)
 * Workshop Pembuatan Website Portfolio dengan Google Sites
 * Total: 20 Soal = 15 Pilihan Ganda (6 poin/soal) + 5 Praktik/Penilaian Diri (2 poin/soal) = 100 poin
 * =========================================================================
 */
export const dataPostTestPG = buatSoalPG('Post-Test')

export const dataPostTestPraktik = [
  {
    nomor: 16,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa membuat website dengan beberapa halaman dan menu navigasi menggunakan Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 17,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa memilih karya terbaik saya dengan alasan yang jelas (kualitas, variasi, dan relevansi).',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 18,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa memasukkan (embed) video YouTube dan menambahkan foto ke dalam Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 19,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa menulis deskripsi singkat untuk tiap karya (peran saya, alat yang dipakai, dan hasilnya).',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 20,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa memublikasikan website, mengatur agar link-nya bisa dibuka oleh siapa saja, lalu menyalinnya untuk dibagikan.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
]

export const dataSoalPostTest = [...dataPostTestPG, ...dataPostTestPraktik]

/**
 * Seluruh koleksi bank soal (Pre-Test: 20 butir, Post-Test: 20 butir = Total 40 butir)
 */
export const allBankSoal = [...dataSoalPreTest, ...dataSoalPostTest]

/**
 * Inisialisasi collection 'pengaturan'
 */
export async function seedPengaturan() {
  const docRef = doc(db, 'pengaturan', 'global')
  const payload = {
    status_tes_aktif: 'Ditutup',
    nama_aplikasi: 'Pre & Post Test - Workshop Pembuatan Website Portfolio dengan Google Sites',
    keterangan: 'Status tes dikontrol oleh Admin/Instruktur Workshop (Ditutup / Pre-Test / Post-Test)',
    updated_at: serverTimestamp(),
  }

  await setDoc(docRef, payload, { merge: true })
  console.log('✅ Collection "pengaturan" berhasil di-seed: status_tes_aktif = "Ditutup"')
  return payload
}

/**
 * Inisialisasi collection 'bank_soal'
 * Menyimpan instrumen Pre-Test dan Post-Test secara terpisah dengan ID unik
 */
export async function seedBankSoal() {
  const batch = writeBatch(db)
  const bankSoalCollection = collection(db, 'bank_soal')

  // Bersihkan ID lama legacy (soal_1 s/d soal_12) jika pernah tersimpan
  for (let i = 1; i <= 12; i++) {
    const legacyDoc = doc(bankSoalCollection, `soal_${i}`)
    batch.delete(legacyDoc)
  }

  // Push 20 Soal Pre-Test & 20 Soal Post-Test ke Firestore
  allBankSoal.forEach((soal) => {
    const prefix = soal.jenis_tes === 'Pre-Test' ? 'pre' : 'post'
    const docId = `${prefix}_soal_${soal.nomor}`
    const docRef = doc(bankSoalCollection, docId)

    batch.set(docRef, {
      ...soal,
      created_at: serverTimestamp(),
    })
  })

  await batch.commit()
  console.log(`✅ Collection "bank_soal" berhasil di-seed: ${allBankSoal.length} soal (${dataSoalPreTest.length} Pre-Test + ${dataSoalPostTest.length} Post-Test)`)
  return allBankSoal
}

/**
 * Seeder Utama
 */
export async function runSeeder() {
  console.log('🚀 Memulai proses seeding Firestore...')
  try {
    const pengaturan = await seedPengaturan()
    const soal = await seedBankSoal()
    console.log('🎉 Seeding Firestore selesai dengan sukses!')
    return {
      success: true,
      message: 'Instrumen Pre-Test dan Post-Test Workshop Google Sites berhasil di-seed ke Firestore.',
      pengaturan,
      total_soal: soal.length,
      pre_test_count: dataSoalPreTest.length,
      post_test_count: dataSoalPostTest.length,
    }
  } catch (error) {
    console.error('❌ Gagal menjalankan seeder Firestore:', error)
    throw error
  }
}

export default runSeeder