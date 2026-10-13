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
 * Mengukur pemahaman awal, konsep dasar portofolio digital, dan kesiapan siswa.
 * Total: 7 Soal Pilihan Ganda (10 poin/soal) + 5 Soal Praktik/Penilaian Diri (6 poin/soal)
 * =========================================================================
 */
export const dataPreTestPG = [
  {
    nomor: 1,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Apa tujuan utama penyusunan sebuah website portofolio digital bagi siswa atau profesional?',
    opsi: {
      A: 'Menyimpan berkas cadangan secara privat tanpa dapat diakses publik',
      B: 'Mendokumentasikan dan mempublikasikan rekam jejak karya, keahlian, serta pencapaian secara terstruktur',
      C: 'Menggantikan media sosial untuk percakapan pesan instan harian',
      D: 'Menjual barang fisik secara otomatis dengan sistem pembayaran rumit',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 2,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Mengapa platform Google Sites sangat cocok dipilih oleh pemula untuk membuat website portofolio tanpa keahlian pemrograman?',
    opsi: {
      A: 'Menyediakan editor visual drag-and-drop dan terintegrasi langsung secara gratis dengan Google Workspace',
      B: 'Memerlukan keahlian konfigurasi server Linux mandiri secara offline',
      C: 'Mengharuskan pengguna menguasai bahasa pengkodean backend seperti PHP dan SQL',
      D: 'Hanya bisa dibuka melalui komputer dengan sistem operasi berbayar khusus',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 3,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Pada dasbor editor Google Sites, tiga menu tab utama di panel samping kanan yang digunakan untuk membangun situs adalah...',
    opsi: {
      A: 'Menu Berkas (File), Edit, dan Tampilan (View)',
      B: 'Menu Sisipkan (Insert), Halaman (Pages), dan Tema (Themes)',
      C: 'Menu Database, Server, dan Terminal Perintah',
      D: 'Menu Animasi, Transisi, dan Desain Grafis',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 4,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Elemen halaman yang paling mendasar dan wajib ada pada website portofolio untuk memperkenalkan diri kepada audiens pertama kali adalah...',
    opsi: {
      A: 'Halaman Beranda (Home / Profil Diri Singkat)',
      B: 'Halaman Kebijakan Privasi Hukum yang panjang',
      C: 'Halaman Keranjang Belanja Toko Daring',
      D: 'Halaman Lisensi Konfigurasi Server Basis Data',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 5,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Layanan Google Workspace yang paling tepat digunakan sebagai tempat penyimpanan awal berkas dokumen karya, slide, atau sertifikat sebelum disematkan ke Google Sites adalah...',
    opsi: {
      A: 'Google Play Store',
      B: 'Google Drive',
      C: 'Google Translate',
      D: 'Google Maps',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 6,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Perbedaan mendasar antara fitur "Pratinjau (Preview)" dan tombol "Publikasikan (Publish)" pada Google Sites adalah...',
    opsi: {
      A: 'Preview menghapus draf situs, sedangkan Publish menyalin kode HTML mentah',
      B: 'Preview untuk mensimulasikan tampilan situs oleh pemilik, sedangkan Publish membuat situs dapat diakses daring oleh publik melalui tautan resmi',
      C: 'Preview membutuhkan akun berbayar, sedangkan Publish gratis',
      D: 'Tidak ada perbedaan sama sekali antara fungsi Preview dan Publish',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 7,
    jenis_tes: 'Pre-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Fitur pratinjau (Preview) pada Google Sites memungkinkan kreator memeriksa kenyamanan tampilan responsif website dalam 3 ukuran perangkat, yaitu...',
    opsi: {
      A: 'Layar Proyektor Bioskop, Televisi Tabung, dan Radio',
      B: 'Komputer (Desktop), Tablet, dan Ponsel Pintar (Smartphone)',
      C: 'Smartwatch saja tanpa layar komputer',
      D: 'Mesin pencetak printer foto warna',
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
    pertanyaan: 'Sebelum mengikuti workshop, saya sudah memahami konsep dan komponen penting yang harus ada dalam sebuah portofolio digital.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 9,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Sebelum mengikuti workshop, saya mampu membuat halaman web baru menggunakan platform Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 10,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Sebelum mengikuti workshop, saya mampu menyisipkan teks, gambar, dan tata letak konten sederhana pada Google Sites.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 11,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Sebelum mengikuti workshop, saya mengetahui cara menghubungkan dan menyematkan berkas karya dari Google Drive ke halaman web.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 12,
    jenis_tes: 'Pre-Test',
    kategori: 'Praktik',
    pertanyaan: 'Sebelum mengikuti workshop, saya mampu mempublikasikan website Google Sites sehingga menghasilkan tautan yang dapat diakses orang lain.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
]

export const dataSoalPreTest = [...dataPreTestPG, ...dataPreTestPraktik]

/**
 * =========================================================================
 * 2. INSTRUMEN POST-TEST (SETELAH WORKSHOP)
 * Mengukur capaian hasil belajar, penguasaan teknis unjuk kerja,
 * tata letak galeri karya, pemecahan masalah akses, dan publikasi portofolio.
 * Total: 7 Soal Pilihan Ganda (10 poin/soal) + 5 Soal Praktik/Penilaian Diri (6 poin/soal)
 * =========================================================================
 */
export const dataPostTestPG = [
  {
    nomor: 1,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Untuk menampilkan galeri beberapa artefak karya proyek secara rapi dengan susunan gambar di atas dan teks deskripsi singkat di bawahnya, fitur Google Sites yang paling efektif digunakan adalah...',
    opsi: {
      A: 'Blok Tata Letak Konten (Content Blocks / Layouts)',
      B: 'Pemisah Garis (Divider) kosong tanpa bingkai',
      C: 'Tombol (Button) navigasi tanpa tautan tujuan',
      D: 'Teks yang dapat diciutkan (Collapsible Group) tanpa gambar',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 2,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Jika Anda ingin mengorganisasikan menu portofolio karya ke dalam beberapa kategori seperti: "Karya" -> "Desain Grafis" dan "Video Editing", langkah yang harus dilakukan pada tab Halaman (Pages) adalah...',
    opsi: {
      A: 'Menghapus halaman utama dan membuat berkas Google Sites baru',
      B: 'Menambahkan Subhalaman (Add Subpage) di bawah halaman induk "Karya"',
      C: 'Menyisipkan kode iframe script khusus dari luar',
      D: 'Mengganti palet warna latar belakang menjadi tema gelap',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 3,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Saat pengunjung membuka portofolio Anda, artefak dokumen Google Drive yang Anda sematkan memunculkan pesan "Anda Memerlukan Akses (Access Denied)". Tindakan solusi yang tepat adalah...',
    opsi: {
      A: 'Menghapus halaman Google Sites tersebut',
      B: 'Mengubah setelan berbagi file di Google Drive menjadi "Siapa saja yang memiliki link dapat melihat (Viewer)"',
      C: 'Meminta setiap pengunjung mengirimkan email konfirmasi izin manual',
      D: 'Mengubah nama dokumen sumber di Google Drive menjadi huruf kapital',
    },
    kunci_jawaban: 'B',
    bobot: 1,
  },
  {
    nomor: 4,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Untuk memperkuat identitas personal branding profesional pada Google Sites, elemen visual apa yang dapat disesuaikan pada bagian Header dan setelan situs?',
    opsi: {
      A: 'Mengunggah Logo Situs, Favicon, Banner Header yang relevan, serta memilih Palet Tema Font yang konsisten',
      B: 'Memasang iklan komersial pop-up otomatis di halaman depan',
      C: 'Memasang kode enkripsi rahasia agar halaman tidak dapat dibaca',
      D: 'Menghilangkan seluruh menu navigasi situs',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 5,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Bagaimana cara terbaik menyajikan formulir kontak atau pesan balik agar pengunjung dapat langsung mengirimkan pesan kepada pemilik portofolio tanpa berpindah tab?',
    opsi: {
      A: 'Menyematkan instrumen Google Forms langsung melalui menu Sisipkan (Insert -> Forms)',
      B: 'Menuliskan nomor kontak berulang kali di setiap baris halaman situs',
      C: 'Mengunggah file PDF yang dikunci dengan password pribadi',
      D: 'Menyediakan tombol unduh file ZIP mentah',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 6,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Setelah menekan tombol Publikasikan dengan alamat web unik "portfolio-siswa", format struktur tautan publik resmi yang valid dan siap dibagikan kepada penguji adalah...',
    opsi: {
      A: 'https://sites.google.com/view/portfolio-siswa',
      B: 'https://drive.google.com/file/d/portfolio-siswa',
      C: 'file:///C:/Users/Documents/Sites/index.html',
      D: 'ftp://localhost:8080/portfolio-siswa',
    },
    kunci_jawaban: 'A',
    bobot: 1,
  },
  {
    nomor: 7,
    jenis_tes: 'Post-Test',
    kategori: 'Pilihan Ganda',
    pertanyaan: 'Apa yang wajib dilakukan seorang kreator portofolio setelah menambahkan artefak karya baru pada editor Google Sites agar publik dapat langsung melihat perubahannya?',
    opsi: {
      A: 'Tidak perlu melakukan apa pun karena draf otomatis tayang untuk publik',
      B: 'Mengeklik tombol "Publikasikan" kembali untuk meninjau pratinjau perubahan draf vs situs tayang lalu mengonfirmasi publikasi',
      C: 'Mengganti alamat tautan web dengan nama yang sepenuhnya baru',
      D: 'Membuat akun Google baru dari awal',
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
    pertanyaan: 'Setelah mengikuti workshop, saya mampu merancang struktur navigasi dan hierarki halaman portofolio (Beranda, Profil Diri, Galeri Karya, dan Kontak) secara mandiri.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 9,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Setelah mengikuti workshop, saya mampu menyusun tata letak karya menggunakan Content Blocks, banner header, dan tema visual secara menarik dan proporsional.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 10,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Setelah mengikuti workshop, saya mampu mengintegrasikan artefak digital dari Google Drive serta mengatur izin akses tautan publik dengan benar.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 11,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Setelah mengikuti workshop, saya mampu mempublikasikan website portofolio Google Sites dan membagikan tautan publik resmi yang dapat diakses oleh siapa saja.',
    opsi: ['Bisa', 'Belum Bisa'],
    kunci_jawaban: null,
    bobot: 1,
  },
  {
    nomor: 12,
    jenis_tes: 'Post-Test',
    kategori: 'Praktik',
    pertanyaan: 'Setelah mengikuti workshop, saya mampu melakukan evaluasi mandiri terhadap kerapian tata letak, tampilan ponsel/desktop, dan keterbacaan tautan portofolio.',
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

    batch.set(
      docRef,
      {
        ...soal,
        created_at: serverTimestamp(),
      },
      { merge: true }
    )
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
