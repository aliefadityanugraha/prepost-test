import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '../firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

let authInitPromise = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthReady = ref(false)
  const isDemoAdmin = ref(localStorage.getItem('neo_demo_admin') === 'true')

  if (isDemoAdmin.value && !user.value) {
    user.value = {
      email: 'admin@neobrutal.dev',
      displayName: 'Administrator Neo Brutal',
      uid: 'demo_admin_uid',
    }
  }

  // Inisialisasi Firebase Auth listener (singleton promise agar konsisten saat refresh)
  const initAuth = () => {
    if (authInitPromise) {
      return authInitPromise
    }

    authInitPromise = new Promise((resolve) => {
      onAuthStateChanged(
        auth,
        (firebaseUser) => {
          user.value = firebaseUser
          isAuthReady.value = true
          resolve(firebaseUser)
        },
        (err) => {
          console.warn('Firebase Auth state error:', err)
          isAuthReady.value = true
          resolve(null)
        }
      )

      // Fallback timeout agar tidak blocking selamanya jika network error / offline
      setTimeout(() => {
        if (!isAuthReady.value) {
          isAuthReady.value = true
          resolve(user.value)
        }
      }, 2500)
    })

    return authInitPromise
  }

  const isAuthenticated = computed(() => {
    return !!user.value || isDemoAdmin.value
  })

  const adminEmail = computed(() => {
    if (user.value?.email) return user.value.email
    if (isDemoAdmin.value) return 'admin@neobrutal.dev (Demo)'
    return null
  })

  const loginWithFirebase = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      isDemoAdmin.value = false
      localStorage.removeItem('neo_demo_admin')
      return userCredential.user
    } catch (err) {
      console.warn('Firebase Auth login failed/offline:', err.code, err.message)
      throw err
    }
  }

  const registerWithFirebase = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      isDemoAdmin.value = false
      localStorage.removeItem('neo_demo_admin')
      return userCredential.user
    } catch (err) {
      console.warn('Firebase Auth register failed:', err.code, err.message)
      throw err
    }
  }

  const loginAsDemoAdmin = () => {
    isDemoAdmin.value = true
    localStorage.setItem('neo_demo_admin', 'true')
    user.value = {
      email: 'admin@neobrutal.dev',
      displayName: 'Administrator Neo Brutal',
      uid: 'demo_admin_uid',
    }
  }

  const logoutAdmin = async () => {
    isDemoAdmin.value = false
    localStorage.removeItem('neo_demo_admin')
    user.value = null
    try {
      await signOut(auth)
    } catch (err) {
      console.warn('SignOut warning:', err)
    }
  }

  return {
    user,
    isAuthReady,
    isDemoAdmin,
    isAuthenticated,
    adminEmail,
    initAuth,
    loginWithFirebase,
    registerWithFirebase,
    loginAsDemoAdmin,
    logoutAdmin,
  }
})
