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
 * 1. INSTRUMEN PRE-TEST (SEBELUM WORKSHOP)
 * Workshop Pembuatan Website Portfolio dengan Google Sites
 * Total: 7 Soal Pilihan Ganda (10 poin/soal) + 5 Soal Praktik/Penilaian Diri (6 poin/soal)
 * =========================================================================
 */
export const dataPreTestPG = [
  {
    nomor: 1,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Di industri kreatif saat ini, hal utama yang paling dicari oleh perusahaan (DUDI) atau klien untuk membuktikan kemampuan kita adalah...',
    opsi: {
      A: 'Kumpulan sertifikat kelulusan',
      B: 'Nilai ijazah yang tinggi',
      C: 'Portofolio karya nyata (proof of work)',
      D: 'Surat keterangan dari RT/RW',
    },
    kunci_jawaban: 'C',
    bobot: 1,
  },
  {
    nomor: 2,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Apa kendala terbesar yang sering membuat lulusan SMK gagal di tahap awal seleksi lamaran kerja industri kreatif?',
    opsi: {
      A: 'Tidak memiliki tautan (link) portofolio digital yang terstruktur',
      B: 'Jarak rumah ke tempat kerja terlalu jauh',
      C: 'Tidak bisa menggunakan komputer',
      D: 'Kurangnya teori di dalam kelas',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 3,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Platform buatan Google apa yang paling mudah, gratis, dan tanpa coding untuk membuat web portofolio?',
    opsi: {
      A: 'Google Docs',
      B: 'Google Sites',
      C: 'Google Maps',
      D: 'Google Meet',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 4,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Mengapa Google Sites sangat cocok digunakan sebagai solusi pembuatan portofolio siswa?',
    opsi: {
      A: 'Karena harganya mahal dan eksklusif',
      B: 'Karena gratis, mudah digunakan tanpa coding, dan terintegrasi dengan Google Drive/YouTube',
      C: 'Karena mewajibkan penggunanya jago bahasa pemrograman',
      D: 'Karena hanya bisa digunakan untuk menyimpan teks',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 5,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Bagi siswa jurusan Produksi Film, karya apa saja yang paling tepat dimasukkan ke dalam etalase web portofolio?',
    opsi: {
      A: 'Catatan pelajaran matematika dan bahasa Inggris',
      B: 'Video sinematografi, desain poster film, dan fotografi produk',
      C: 'Daftar absensi kelas selama 3 tahun',
      D: 'Foto-foto liburan pribadi yang tidak diedit',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 6,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Apa fungsi utama dari mengelompokkan dan mengkurasi karya-karya terbaik Anda ke dalam satu website digital?',
    opsi: {
      A: 'Agar harddisk komputer sekolah tidak penuh',
      B: 'Sebagai alat personal branding yang mudah dilampirkan saat melamar pekerjaan/freelance',
      C: 'Untuk menghapus karya yang sudah lama',
      D: 'Hanya untuk syarat kelulusan sekolah saja',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 7,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Jika Anda memiliki karya video yang ukurannya sangat besar, cara terbaik menampilkannya di web portofolio adalah...',
    opsi: {
      A: 'Dikirim menggunakan flashdisk kepada klien',
      B: 'Diintegrasikan/disematkan (embed) langsung dari tautan YouTube',
      C: 'Dihapus sebagian agar durasinya pendek',
      D: 'Dicetak di atas kertas foto',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
]

export const dataPreTestPraktik = [
  {
    nomor: 8,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saat ini, saya sudah bisa membuat website menggunakan Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 9,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah tahu cara menyeleksi (kurasi) karya terbaik saya untuk portofolio.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 10,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah bisa memasukkan (embed) video YouTube ke dalam sebuah website.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 11,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah memiliki rancangan susunan (layout) portofolio digital yang rapi.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 12,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya sudah memiliki link web portofolio pribadi yang siap dikirim untuk melamar kerja.',
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
 * Total: 7 Soal Pilihan Ganda (10 poin/soal) + 5 Soal Praktik/Penilaian Diri (6 poin/soal)
 * =========================================================================
 */
export const dataPostTestPG = [
  {
    nomor: 1,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Di industri kreatif saat ini, hal utama yang paling dicari oleh perusahaan (DUDI) atau klien untuk membuktikan kemampuan kita adalah...',
    opsi: {
      A: 'Kumpulan sertifikat kelulusan',
      B: 'Nilai ijazah yang tinggi',
      C: 'Portofolio karya nyata (proof of work)',
      D: 'Surat keterangan dari RT/RW',
    },
    kunci_jawaban: 'C',
    bobot: 1,
  },
  {
    nomor: 2,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Apa kendala terbesar yang sering membuat lulusan SMK gagal di tahap awal seleksi lamaran kerja industri kreatif?',
    opsi: {
      A: 'Tidak memiliki tautan (link) portofolio digital yang terstruktur',
      B: 'Jarak rumah ke tempat kerja terlalu jauh',
      C: 'Tidak bisa menggunakan komputer',
      D: 'Kurangnya teori di dalam kelas',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 3,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Platform buatan Google apa yang paling mudah, gratis, dan tanpa coding untuk membuat web portofolio?',
    opsi: {
      A: 'Google Docs',
      B: 'Google Sites',
      C: 'Google Maps',
      D: 'Google Meet',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 4,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Mengapa Google Sites sangat cocok digunakan sebagai solusi pembuatan portofolio siswa?',
    opsi: {
      A: 'Karena harganya mahal dan eksklusif',
      B: 'Karena gratis, mudah digunakan tanpa coding, dan terintegrasi dengan Google Drive/YouTube',
      C: 'Karena mewajibkan penggunanya jago bahasa pemrograman',
      D: 'Karena hanya bisa digunakan untuk menyimpan teks',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 5,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Bagi siswa jurusan Produksi Film, karya apa saja yang paling tepat dimasukkan ke dalam etalase web portofolio?',
    opsi: {
      A: 'Catatan pelajaran matematika dan bahasa Inggris',
      B: 'Video sinematografi, desain poster film, dan fotografi produk',
      C: 'Daftar absensi kelas selama 3 tahun',
      D: 'Foto-foto liburan pribadi yang tidak diedit',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 6,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Apa fungsi utama dari mengelompokkan dan mengkurasi karya-karya terbaik Anda ke dalam satu website digital?',
    opsi: {
      A: 'Agar harddisk komputer sekolah tidak penuh',
      B: 'Sebagai alat personal branding yang mudah dilampirkan saat melamar pekerjaan/freelance',
      C: 'Untuk menghapus karya yang sudah lama',
      D: 'Hanya untuk syarat kelulusan sekolah saja',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 7,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Jika Anda memiliki karya video yang ukurannya sangat besar, cara terbaik menampilkannya di web portofolio adalah...',
    opsi: {
      A: 'Dikirim menggunakan flashdisk kepada klien',
      B: 'Diintegrasikan/disematkan (embed) langsung dari tautan YouTube',
      C: 'Dihapus sebagian agar durasinya pendek',
      D: 'Dicetak di atas kertas foto',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
]

export const dataPostTestPraktik = [
  {
    nomor: 8,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa membuat halaman website baru menggunakan Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 9,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa memilih/mengkurasi karya visual terbaik saya (video/foto/poster) untuk dipamerkan.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 10,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa memasukkan (upload/embed) foto atau link video YouTube ke dalam Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 11,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa mengatur tata letak (layout) website agar terlihat rapi dan profesional.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 12,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Saya bisa memublikasikan (Publish) website dan menyalin link-nya untuk dibagikan.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
]

export const dataSoalPostTest = [...dataPostTestPG, ...dataPostTestPraktik]

/**
 * Seluruh koleksi bank soal (Pre-Test: 12 butir, Post-Test: 12 butir = Total 24 butir)
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

  // Push 12 Soal Pre-Test & 12 Soal Post-Test ke Firestore
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
