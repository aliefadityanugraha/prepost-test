/**
 * Menghitung skor instrumen Pre & Post Test Workshop Google Sites secara deterministik dan murni:
 * - Pilihan Ganda: 10 poin per jawaban benar (maks 70 poin untuk 7 butir)
 * - Penilaian Diri (Praktik): 6 poin per jawaban 'Bisa' (maks 30 poin untuk 5 butir)
 * - Total Skor Maksimal: 100 poin
 *
 * @param {Array} soalList - Array daftar soal dari bank_soal
 * @param {Object} jawaban - Objek map jawaban peserta (key: nomor_soal, value: opsi/jawaban)
 * @returns {Object} Rincian skor PG, Praktik, dan Total Skor
 */
export function calculateScore(soalList = [], jawaban = {}) {
  if (!Array.isArray(soalList)) {
    return {
      skor_pg: 0,
      benar_pg: 0,
      total_pg: 0,
      skor_praktik: 0,
      bisa_praktik: 0,
      total_praktik: 0,
      skor_total: 0,
    }
  }

  const userJawaban = jawaban || {}

  let skorPG = 0
  let benarPG = 0
  let totalPG = 0

  let skorPraktik = 0
  let bisaPraktik = 0
  let totalPraktik = 0

  soalList.forEach((soal) => {
    const nomor = soal.nomor
    const userAns = userJawaban[nomor]

    if (soal.kategori === 'Pilihan Ganda') {
      totalPG++
      if (userAns !== undefined && userAns !== null && userAns === soal.kunci_jawaban) {
        skorPG += 10
        benarPG++
      }
    } else if (soal.kategori === 'Praktik') {
      totalPraktik++
      if (userAns === 'Bisa') {
        skorPraktik += 6
        bisaPraktik++
      }
    }
  })

  // Pastikan batas skor tidak melebihi nilai maksimal
  const skorTotal = skorPG + skorPraktik

  return {
    skor_pg: skorPG,
    benar_pg: benarPG,
    total_pg: totalPG,
    skor_praktik: skorPraktik,
    bisa_praktik: bisaPraktik,
    total_praktik: totalPraktik,
    skor_total: skorTotal,
  }
}

/**
 * Mengurutkan opsi pilihan ganda secara pasti (A, B, C, D, ...)
 * Mencegah urutan acak akibat deserialisasi objek di JavaScript/Firestore.
 *
 * @param {Object|Array} opsi - Objek map opsi { A: '...', B: '...' }
 * @returns {Array<{key: string, teks: string}>} Array opsi terurut A, B, C, D
 */
export function getSortedOpsi(opsi) {
  if (!opsi) return []
  if (Array.isArray(opsi)) {
    return opsi.map((teks, idx) => ({ key: String.fromCharCode(65 + idx), teks }))
  }
  const standardKeys = ['A', 'B', 'C', 'D', 'E', 'F']
  return Object.keys(opsi)
    .sort((a, b) => {
      const idxA = standardKeys.indexOf(a.toUpperCase())
      const idxB = standardKeys.indexOf(b.toUpperCase())
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      return a.localeCompare(b)
    })
    .map((key) => ({ key, teks: opsi[key] }))
}

export default calculateScore
