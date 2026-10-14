import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'

export const useUserStore = defineStore('user', () => {
  // State identitas peserta dengan persistensi localStorage
  const nama = ref(localStorage.getItem('prepost_peserta_nama') || '')
  const kelas = ref(localStorage.getItem('prepost_peserta_kelas') || '')

  // State status tes aktif ('Ditutup' | 'Pre-Test' | 'Post-Test')
  const status_tes_aktif = ref('Ditutup')
  const isLoadingStatus = ref(true)
  const isListenerActive = ref(false)

  // State hasil evaluasi peserta terakhir dengan persistensi sessionStorage
  let initialResult = null
  try {
    const rawResult = sessionStorage.getItem('prepost_last_result')
    if (rawResult) {
      initialResult = JSON.parse(rawResult)
    }
  } catch (e) {
    console.warn('Gagal membaca cache lastResult dari sessionStorage:', e)
  }
  const lastResult = ref(initialResult)

  /**
   * Menginisialisasi realtime listener dari Firestore collection 'pengaturan' dokumen 'global'
   */
  const initPengaturanListener = () => {
    if (isListenerActive.value) return

    try {
      const docRef = doc(db, 'pengaturan', 'global')
      onSnapshot(
        docRef,
        (snapshot) => {
          isLoadingStatus.value = false
          isListenerActive.value = true
          if (snapshot.exists()) {
            const data = snapshot.data()
            if (data.status_tes_aktif) {
              status_tes_aktif.value = data.status_tes_aktif
            }
          } else {
            status_tes_aktif.value = 'Ditutup'
          }
        },
        (error) => {
          console.warn('Realtime listener offline / firebase error, fallback ke mode lokal:', error)
          isLoadingStatus.value = false
        }
      )
    } catch (err) {
      console.warn('Error saat menghubungkan realtime listener Firestore:', err)
      isLoadingStatus.value = false
    }
  }

  /**
   * Helper action untuk mengubah status_tes_aktif (sinkron ke Firestore)
   */
  const setStatusTesAktif = async (statusBaru) => {
    status_tes_aktif.value = statusBaru
    try {
      const docRef = doc(db, 'pengaturan', 'global')
      const savePromise = setDoc(
        docRef,
        {
          status_tes_aktif: statusBaru,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      )
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SetDoc timeout')), 2500)
      )
      await Promise.race([savePromise, timeoutPromise])
    } catch (err) {
      console.warn('Gagal sinkron status tes ke remote Firestore (menggunakan state lokal):', err)
    }
  }

  const setPeserta = (namaPeserta, kelasPeserta) => {
    nama.value = namaPeserta?.trim() || ''
    kelas.value = kelasPeserta?.trim() || ''
    try {
      if (nama.value) localStorage.setItem('prepost_peserta_nama', nama.value)
      if (kelas.value) localStorage.setItem('prepost_peserta_kelas', kelas.value)
    } catch (e) {
      console.warn('Gagal menyimpan identitas ke localStorage:', e)
    }
  }

  const setLastResult = (resultPayload) => {
    lastResult.value = resultPayload
    try {
      if (resultPayload) {
        sessionStorage.setItem('prepost_last_result', JSON.stringify(resultPayload))
      } else {
        sessionStorage.removeItem('prepost_last_result')
      }
    } catch (e) {
      console.warn('Gagal menyimpan lastResult ke sessionStorage:', e)
    }
  }

  const resetPeserta = () => {
    nama.value = ''
    kelas.value = ''
    lastResult.value = null
    try {
      localStorage.removeItem('prepost_peserta_nama')
      localStorage.removeItem('prepost_peserta_kelas')
      sessionStorage.removeItem('prepost_last_result')
    } catch (e) {
      console.warn('Gagal membersihkan storage peserta:', e)
    }
  }

  return {
    nama,
    kelas,
    status_tes_aktif,
    isLoadingStatus,
    lastResult,
    initPengaturanListener,
    setStatusTesAktif,
    setPeserta,
    setLastResult,
    resetPeserta,
  }
})
