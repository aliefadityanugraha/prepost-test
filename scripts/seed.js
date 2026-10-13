import { runSeeder } from '../src/utils/seeder.js'

console.log('📡 Menghubungkan ke Firebase project...')
try {
  const result = await runSeeder()
  console.log('🎉 SEEDING BERHASIL!')
  console.log('Hasil:', JSON.stringify(result, null, 2))
  process.exit(0)
} catch (err) {
  console.error('❌ SEEDING GAGAL:', err)
  process.exit(1)
}
