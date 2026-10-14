import { describe, it, expect } from 'vitest'
import { calculateScore } from './scoring'

describe('Unit Test: Algoritma Kalkulasi Skor Pre & Post Test Workshop Google Sites', () => {
  // Mock dataset instrumen (7 Pilihan Ganda & 5 Praktik)
  const mockBankSoal = [
    { nomor: 1, kategori: 'Pilihan Ganda', kunci_jawaban: 'B' },
    { nomor: 2, kategori: 'Pilihan Ganda', kunci_jawaban: 'A' },
    { nomor: 3, kategori: 'Pilihan Ganda', kunci_jawaban: 'B' },
    { nomor: 4, kategori: 'Pilihan Ganda', kunci_jawaban: 'C' },
    { nomor: 5, kategori: 'Pilihan Ganda', kunci_jawaban: 'B' },
    { nomor: 6, kategori: 'Pilihan Ganda', kunci_jawaban: 'C' },
    { nomor: 7, kategori: 'Pilihan Ganda', kunci_jawaban: 'A' },
    { nomor: 8, kategori: 'Praktik', opsi: ['Bisa', 'Belum Bisa'] },
    { nomor: 9, kategori: 'Praktik', opsi: ['Bisa', 'Belum Bisa'] },
    { nomor: 10, kategori: 'Praktik', opsi: ['Bisa', 'Belum Bisa'] },
    { nomor: 11, kategori: 'Praktik', opsi: ['Bisa', 'Belum Bisa'] },
    { nomor: 12, kategori: 'Praktik', opsi: ['Bisa', 'Belum Bisa'] },
  ]

  it('1. Harus menghasilkan skor sempurna 100 ketika seluruh jawaban benar dan menyatakan Bisa', () => {
    const jawabanSempurna = {
      1: 'B',
      2: 'A',
      3: 'B',
      4: 'C',
      5: 'B',
      6: 'C',
      7: 'A',
      8: 'Bisa',
      9: 'Bisa',
      10: 'Bisa',
      11: 'Bisa',
      12: 'Bisa',
    }

    const hasil = calculateScore(mockBankSoal, jawabanSempurna)

    expect(hasil.skor_pg).toBe(70) // 7 * 10
    expect(hasil.benar_pg).toBe(7)
    expect(hasil.skor_praktik).toBe(30) // 5 * 6
    expect(hasil.bisa_praktik).toBe(5)
    expect(hasil.skor_total).toBe(100) // 70 + 30
  })

  it('2. Harus menghasilkan skor 0 ketika semua PG salah dan seluruh praktik Belum Bisa', () => {
    const jawabanSalahSemua = {
      1: 'D', // seharusnya B
      2: 'C', // seharusnya A
      3: 'D', // seharusnya B
      4: 'A', // seharusnya C
      5: 'D', // seharusnya B
      6: 'A', // seharusnya C
      7: 'C', // seharusnya A
      8: 'Belum Bisa',
      9: 'Belum Bisa',
      10: 'Belum Bisa',
      11: 'Belum Bisa',
      12: 'Belum Bisa',
    }

    const hasil = calculateScore(mockBankSoal, jawabanSalahSemua)

    expect(hasil.skor_pg).toBe(0)
    expect(hasil.benar_pg).toBe(0)
    expect(hasil.skor_praktik).toBe(0)
    expect(hasil.bisa_praktik).toBe(0)
    expect(hasil.skor_total).toBe(0)
  })

  it('3. Harus menghitung skor kombinasi secara tepat (5 PG benar + 3 Praktik Bisa = 68 poin)', () => {
    const jawabanCampuran = {
      1: 'B', // Benar (10)
      2: 'A', // Benar (10)
      3: 'B', // Benar (10)
      4: 'C', // Benar (10)
      5: 'B', // Benar (10)
      6: 'A', // Salah (0)
      7: 'D', // Salah (0)
      8: 'Bisa', // Bisa (6)
      9: 'Bisa', // Bisa (6)
      10: 'Bisa', // Bisa (6)
      11: 'Belum Bisa', // (0)
      12: 'Belum Bisa', // (0)
    }

    const hasil = calculateScore(mockBankSoal, jawabanCampuran)

    expect(hasil.skor_pg).toBe(50) // 5 * 10
    expect(hasil.benar_pg).toBe(5)
    expect(hasil.skor_praktik).toBe(18) // 3 * 6
    expect(hasil.bisa_praktik).toBe(3)
    expect(hasil.skor_total).toBe(68) // 50 + 18
  })

  it('4. Harus menangani jawaban kosong atau tidak lengkap dengan aman', () => {
    const jawabanKosong = {}

    const hasil = calculateScore(mockBankSoal, jawabanKosong)

    expect(hasil.skor_pg).toBe(0)
    expect(hasil.skor_praktik).toBe(0)
    expect(hasil.skor_total).toBe(0)
  })

  it('5. Harus mengembalikan nilai default 0 tanpa runtime error saat input array bernilai null/undefined', () => {
    const hasilNull = calculateScore(null, null)

    expect(hasilNull.skor_total).toBe(0)
    expect(hasilNull.skor_pg).toBe(0)
    expect(hasilNull.skor_praktik).toBe(0)
  })

  it('6. Harus menghasilkan nilai maksimal tepat 100 (tidak boleh lebih) pada dataset 20 soal (15 PG + 5 Praktik)', () => {
    // 15 Pilihan Ganda + 5 Praktik
    const bank20Soal = []
    const jawabanSempurna20 = {}

    for (let i = 1; i <= 15; i++) {
      bank20Soal.push({ nomor: i, kategori: 'Pilihan Ganda', kunci_jawaban: 'A' })
      jawabanSempurna20[i] = 'A'
    }
    for (let i = 16; i <= 20; i++) {
      bank20Soal.push({ nomor: i, kategori: 'Praktik', opsi: ['Bisa', 'Belum Bisa'] })
      jawabanSempurna20[i] = 'Bisa'
    }

    const hasil = calculateScore(bank20Soal, jawabanSempurna20)

    expect(hasil.benar_pg).toBe(15)
    expect(hasil.total_pg).toBe(15)
    expect(hasil.skor_pg).toBe(70) // Maksimal 70
    expect(hasil.bisa_praktik).toBe(5)
    expect(hasil.total_praktik).toBe(5)
    expect(hasil.skor_praktik).toBe(30) // Maksimal 30
    expect(hasil.skor_total).toBe(100) // TEPAT 100, TIDAK BOLEH 180!
    expect(hasil.skor_total).toBeLessThanOrEqual(100)
  })

  it('7. Harus menghasilkan nilai proporsional <= 100 saat sebagian dijawab benar pada dataset 20 soal', () => {
    const bank20Soal = []
    const jawabanSebagian = {}

    for (let i = 1; i <= 15; i++) {
      bank20Soal.push({ nomor: i, kategori: 'Pilihan Ganda', kunci_jawaban: 'A' })
      // Hanya 10 yang benar
      jawabanSebagian[i] = i <= 10 ? 'A' : 'B'
    }
    for (let i = 16; i <= 20; i++) {
      bank20Soal.push({ nomor: i, kategori: 'Praktik', opsi: ['Bisa', 'Belum Bisa'] })
      // Hanya 3 yang 'Bisa'
      jawabanSebagian[i] = i <= 18 ? 'Bisa' : 'Belum Bisa'
    }

    const hasil = calculateScore(bank20Soal, jawabanSebagian)

    expect(hasil.benar_pg).toBe(10)
    expect(hasil.skor_pg).toBe(47) // Math.round((10/15)*70) = 47
    expect(hasil.bisa_praktik).toBe(3)
    expect(hasil.skor_praktik).toBe(18) // Math.round((3/5)*30) = 18
    expect(hasil.skor_total).toBe(65) // 47 + 18 = 65 <= 100
    expect(hasil.skor_total).toBeLessThanOrEqual(100)
  })
})
