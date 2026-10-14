/**
 * Menghitung skor instrumen Pre & Post Test Workshop Google Sites secara deterministik dan proporsional:
 * - Pilihan Ganda: Maksimal 70 poin (proporsional terhadap jumlah butir PG)
 * - Penilaian Diri (Praktik): Maksimal 30 poin (proporsional terhadap jumlah butir Praktik)
 * - Total Skor Maksimal: 100 poin (tidak akan pernah melebihi 100)
 *
 * @param {Array} soalList - Array daftar soal dari bank_soal
 * @param {Object} jawaban - Objek map jawaban peserta (key: nomor_soal, value: opsi/jawaban)
 * @returns {Object} Rincian skor PG, Praktik, dan Total Skor
 */
export function calculateScore(soalList = [], jawaban = {}) {
  if (!Array.isArray(soalList) || soalList.length === 0) {
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

  let benarPG = 0
  let totalPG = 0

  let bisaPraktik = 0
  let totalPraktik = 0

  soalList.forEach((soal) => {
    const nomor = soal.nomor
    const userAns = userJawaban[nomor] !== undefined ? userJawaban[nomor] : userJawaban[String(nomor)]

    if (soal.kategori === 'Pilihan Ganda') {
      totalPG++
      if (userAns !== undefined && userAns !== null && String(userAns).trim().toUpperCase() === String(soal.kunci_jawaban).trim().toUpperCase()) {
        benarPG++
      }
    } else if (soal.kategori === 'Praktik') {
      totalPraktik++
      if (userAns === 'Bisa') {
        bisaPraktik++
      }
    }
  })

  // Hitung skor secara proporsional berbobot (PG: 70%, Praktik: 30%, Total: 100%)
  let skorPG = 0
  let skorPraktik = 0

  if (totalPG > 0 && totalPraktik > 0) {
    skorPG = Math.round((benarPG / totalPG) * 70)
    skorPraktik = Math.round((bisaPraktik / totalPraktik) * 30)
  } else if (totalPG > 0) {
    skorPG = Math.round((benarPG / totalPG) * 100)
  } else if (totalPraktik > 0) {
    skorPraktik = Math.round((bisaPraktik / totalPraktik) * 100)
  }

  // Batasi agar skor PG <= 70 (jika ada praktik) atau <= 100, skor Praktik <= 30, dan Total <= 100
  const maxAllowedPG = totalPraktik > 0 ? 70 : 100
  const maxAllowedPraktik = totalPG > 0 ? 30 : 100

  const finalPG = Math.min(maxAllowedPG, Math.max(0, skorPG))
  const finalPraktik = Math.min(maxAllowedPraktik, Math.max(0, skorPraktik))
  const skorTotal = Math.min(100, Math.max(0, finalPG + finalPraktik))

  return {
    skor_pg: finalPG,
    benar_pg: benarPG,
    total_pg: totalPG,
    skor_praktik: finalPraktik,
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
