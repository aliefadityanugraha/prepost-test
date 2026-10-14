import * as XLSX from 'xlsx'

/**
 * Helper untuk format tanggal/waktu submit yang aman
 */
const formatWaktu = (created_at, waktu_selesai) => {
  if (created_at?.toDate) {
    return created_at.toDate().toLocaleString('id-ID')
  }
  if (waktu_selesai) {
    try {
      return new Date(waktu_selesai).toLocaleString('id-ID')
    } catch {
      return String(waktu_selesai)
    }
  }
  return '-'
}

/**
 * Mengambil kunci jawaban dari bank_soal untuk nomor dan jenis tes tertentu
 */
const getKunciJawaban = (bankSoalList, jenisTes, nomor) => {
  const q = bankSoalList.find(
    (s) => s.jenis_tes === jenisTes && Number(s.nomor) === Number(nomor)
  )
  return q?.kunci_jawaban || ''
}

/**
 * Membangun array of arrays (AOA) detail perorangan untuk Pre-Test atau Post-Test
 * Kolom lengkap mencakup:
 * - Identitas: No, Nama, Kelas, Jenis Tes
 * - Skor Total, Status Kelulusan (KKM 70)
 * - Sub-Total Pilihan Ganda (Skor /70, Benar x/7)
 * - Sub-Total Praktik (Skor /30, Mampu x/5)
 * - Detail Soal 1 s.d. 7 (Jawaban Siswa, Kunci Jawaban, Poin Didapat [0 atau 10])
 * - Detail Soal 8 s.d. 12 (Jawaban Siswa [Bisa/Belum Bisa], Poin Didapat [0 atau 6])
 * - Waktu Submit
 */
const buildDetailSheetAoa = (items, jenisTes, bankSoalList) => {
  // Baris Header 1 (Grouping Header)
  const headerRow1 = [
    'No',
    'Nama Peserta',
    'Kelas',
    'Jenis Tes',
    'Total Skor (/100)',
    'Status Kelulusan',
    'Nilai PG (/70)',
    'Benar PG (dr 7)',
    'Nilai Praktik (/30)',
    'Bisa Praktik (dr 5)',
    // Soal 1-7
    'BAGIAN I: PILIHAN GANDA (Bobot 10 Poin / Butir)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    // Soal 8-12
    'BAGIAN II: PENILAIAN DIRI PRAKTIK (Bobot 6 Poin / Butir)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Waktu Submit',
  ]

  // Baris Header 2 (Nama Kolom Spesifik)
  const headerRow2 = [
    'No',
    'Nama Peserta',
    'Kelas',
    'Jenis Tes',
    'Total Skor',
    'Status (KKM 70)',
    'Skor PG',
    'Benar PG',
    'Skor Praktik',
    'Bisa Praktik',
    // Kolom Soal PG 1 - 7
    'Jwb No 1',
    'Kunci No 1',
    'Skor No 1',
    'Jwb No 2',
    'Kunci No 2',
    'Skor No 2',
    'Jwb No 3',
    'Kunci No 3',
    'Skor No 3',
    'Jwb No 4',
    'Kunci No 4',
    'Skor No 4',
    'Jwb No 5',
    'Kunci No 5',
    'Skor No 5',
    'Jwb No 6',
    'Kunci No 6',
    'Skor No 6',
    'Jwb No 7',
    'Kunci No 7',
    'Skor No 7',
    // Kolom Soal Praktik 8 - 12
    'Jwb No 8',
    'Skor No 8',
    'Jwb No 9',
    'Skor No 9',
    'Jwb No 10',
    'Skor No 10',
    'Jwb No 11',
    'Skor No 11',
    'Jwb No 12',
    'Skor No 12',
    'Waktu Submit',
  ]

  const rows = items.map((item, idx) => {
    const skorTotal = Number(item.skor_total) || 0
    const statusKelulusan = skorTotal >= 70 ? 'TUNTAS' : 'BELUM TUNTAS'
    const skorPg = Number(item.skor_pg) || 0
    const benarPg = Number(item.benar_pg) || 0
    const skorPraktik = Number(item.skor_praktik) || 0
    const bisaPraktik = Number(item.bisa_praktik) || 0

    // Rincian Pilihan Ganda (1 - 7)
    const detailPg = []
    for (let no = 1; no <= 7; no++) {
      const jwb = item.jawaban?.[no] || item.jawaban?.[String(no)] || '-'
      const kunci = getKunciJawaban(bankSoalList, jenisTes, no) || '-'
      const poin = jwb !== '-' && jwb === kunci ? 10 : 0
      detailPg.push(jwb, kunci, poin)
    }

    // Rincian Penilaian Praktik (8 - 12)
    const detailPraktik = []
    for (let no = 8; no <= 12; no++) {
      const jwb = item.jawaban?.[no] || item.jawaban?.[String(no)] || '-'
      const poin = jwb === 'Bisa' ? 6 : 0
      detailPraktik.push(jwb, poin)
    }

    return [
      idx + 1,
      item.nama || 'Tanpa Nama',
      item.kelas || '-',
      jenisTes,
      skorTotal,
      statusKelulusan,
      skorPg,
      benarPg,
      skorPraktik,
      bisaPraktik,
      ...detailPg,
      ...detailPraktik,
      formatWaktu(item.created_at, item.waktu_selesai),
    ]
  })

  return [headerRow1, headerRow2, ...rows]
}

/**
 * Mengatur lebar kolom agar rapi saat dibuka di Microsoft Excel
 */
const setColumnWidths = (ws) => {
  ws['!cols'] = [
    { wch: 5 }, // No
    { wch: 26 }, // Nama Peserta
    { wch: 14 }, // Kelas
    { wch: 12 }, // Jenis Tes
    { wch: 15 }, // Total Skor
    { wch: 16 }, // Status Kelulusan
    { wch: 12 }, // Nilai PG
    { wch: 12 }, // Benar PG
    { wch: 14 }, // Nilai Praktik
    { wch: 14 }, // Bisa Praktik
    // Soal 1-7 (Jwb, Kunci, Skor)
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    // Soal 8-12 (Jwb, Skor)
    { wch: 14 }, { wch: 10 },
    { wch: 14 }, { wch: 10 },
    { wch: 14 }, { wch: 10 },
    { wch: 14 }, { wch: 10 },
    { wch: 14 }, { wch: 10 },
    { wch: 22 }, // Waktu Submit
  ]
}

/**
 * Ekspor Workbook Excel Lengkap (.xlsx) dengan Sheet Terpisah untuk Pre-Test dan Post-Test
 */
export const exportLaporanExcelLengkap = ({ listEvaluasi = [], bankSoalList = [] }) => {
  const preItems = listEvaluasi.filter((i) => i.jenis_tes === 'Pre-Test')
  const postItems = listEvaluasi.filter((i) => i.jenis_tes === 'Post-Test')

  const hitungRata = (items, key) => {
    if (!items || items.length === 0) return 0
    const sum = items.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0)
    return Math.round((sum / items.length) * 10) / 10
  }

  const rataTotalPre = hitungRata(preItems, 'skor_total')
  const rataTotalPost = hitungRata(postItems, 'skor_total')
  const rataPgPre = hitungRata(preItems, 'skor_pg')
  const rataPgPost = hitungRata(postItems, 'skor_pg')
  const rataPraktikPre = hitungRata(preItems, 'skor_praktik')
  const rataPraktikPost = hitungRata(postItems, 'skor_praktik')

  const deltaTotal = Math.round((rataTotalPost - rataTotalPre) * 10) / 10
  const deltaPg = Math.round((rataPgPost - rataPgPre) * 10) / 10
  const deltaPraktik = Math.round((rataPraktikPost - rataPraktikPre) * 10) / 10

  const wb = XLSX.utils.book_new()

  // ==========================================
  // SHEET 1: RINGKASAN & STATISTIK EFEKTIVITAS
  // ==========================================
  const summaryAoa = [
    ['LAPORAN HASIL PRE-TEST & POST-TEST WORKSHOP GOOGLE SITES'],
    ['Waktu Ekspor:', new Date().toLocaleString('id-ID')],
    ['Target KKM Kelulusan:', '70 Poin'],
    [],
    ['KOMPONEN EVALUASI', 'RERATA PRE-TEST', 'RERATA POST-TEST', 'SELISIH PENINGKATAN (GAIN)', 'SKOR MAKSIMAL'],
    ['Total Nilai Akhir Evaluasi', rataTotalPre, rataTotalPost, `+${deltaTotal}`, '100 Poin'],
    ['Bagian I: Konsep Pilihan Ganda (PG)', rataPgPre, rataPgPost, `+${deltaPg}`, '70 Poin'],
    ['Bagian II: Penilaian Diri Praktik Mandiri', rataPraktikPre, rataPraktikPost, `+${deltaPraktik}`, '30 Poin'],
    [],
    ['JUMLAH PESERTA', 'PRE-TEST', 'POST-TEST', 'TOTAL SUBMISI'],
    ['Jumlah Siswa Terekam', preItems.length, postItems.length, listEvaluasi.length],
    [],
    ['KETERANGAN STRUKTUR EXCEL:'],
    ['1. Sheet "Hasil Pre-Test (Detail)" memuat seluruh jawaban soal 1-12 beserta poin per butir untuk peserta Pre-Test.'],
    ['2. Sheet "Hasil Post-Test (Detail)" memuat seluruh jawaban soal 1-12 beserta poin per butir untuk peserta Post-Test.'],
    ['3. Sheet "Ketercapaian Butir Soal" menganalisis persentase penguasaan kompetensi per nomor soal.'],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa)
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan & Efektivitas')

  // ==========================================
  // SHEET 2: HASIL PRE-TEST (DETAIL LENGKAP 1-12)
  // ==========================================
  const preAoa = buildDetailSheetAoa(preItems, 'Pre-Test', bankSoalList)
  const wsPre = XLSX.utils.aoa_to_sheet(preAoa)
  setColumnWidths(wsPre)
  XLSX.utils.book_append_sheet(wb, wsPre, 'Hasil Pre-Test (Detail)')

  // ==========================================
  // SHEET 3: HASIL POST-TEST (DETAIL LENGKAP 1-12)
  // ==========================================
  const postAoa = buildDetailSheetAoa(postItems, 'Post-Test', bankSoalList)
  const wsPost = XLSX.utils.aoa_to_sheet(postAoa)
  setColumnWidths(wsPost)
  XLSX.utils.book_append_sheet(wb, wsPost, 'Hasil Post-Test (Detail)')

  // ==========================================
  // SHEET 4: KETERCAPAIAN BUTIR SOAL (1 - 12)
  // ==========================================
  const targetSoal = bankSoalList
    .filter((s) => s.jenis_tes === 'Post-Test')
    .sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0))

  const butirAoa = [
    [
      'No',
      'Kategori',
      'Indikator Pertanyaan / Kompetensi',
      'Kunci Jawaban',
      'Bobot Maks',
      'Ketercapaian Pre-Test (%)',
      'Ketercapaian Post-Test (%)',
      'Peningkatan Gain (%)',
    ],
  ]

  targetSoal.forEach((soal) => {
    const no = soal.nomor
    const isPg = soal.kategori === 'Pilihan Ganda'
    const kunci = soal.kunci_jawaban || '-'

    let prePercent = 0
    if (preItems.length > 0) {
      if (isPg) {
        const correct = preItems.filter((i) => (i.jawaban?.[no] || i.jawaban?.[String(no)]) === kunci).length
        prePercent = Math.round((correct / preItems.length) * 100)
      } else {
        const bisa = preItems.filter((i) => (i.jawaban?.[no] || i.jawaban?.[String(no)]) === 'Bisa').length
        prePercent = Math.round((bisa / preItems.length) * 100)
      }
    }

    let postPercent = 0
    if (postItems.length > 0) {
      if (isPg) {
        const correct = postItems.filter((i) => (i.jawaban?.[no] || i.jawaban?.[String(no)]) === kunci).length
        postPercent = Math.round((correct / postItems.length) * 100)
      } else {
        const bisa = postItems.filter((i) => (i.jawaban?.[no] || i.jawaban?.[String(no)]) === 'Bisa').length
        postPercent = Math.round((bisa / postItems.length) * 100)
      }
    }

    const deltaGain = postPercent - prePercent

    butirAoa.push([
      Number(no),
      soal.kategori,
      soal.pertanyaan,
      kunci,
      isPg ? 10 : 6,
      prePercent,
      postPercent,
      deltaGain,
    ])
  })

  const wsButir = XLSX.utils.aoa_to_sheet(butirAoa)
  wsButir['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 60 },
    { wch: 14 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(wb, wsButir, 'Ketercapaian Butir Soal')

  // Generate nama file unik dengan tanggal
  const fileName = `Laporan_Lengkap_PrePostTest_GoogleSites_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)

  return fileName
}
