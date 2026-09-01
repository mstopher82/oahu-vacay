import { getStorage } from 'firebase/storage'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAzuiSFnzk-XtgZzgUoGcNoBE8W1JS1WE8',
  authDomain: 'oahu-trip-8c57c.firebaseapp.com',
  projectId: 'oahu-trip-8c57c',
  storageBucket: 'oahu-trip-8c57c.firebasestorage.app',
  messagingSenderId: '682409237917',
  appId: '1:682409237917:web:c0b772a42ace7d8de76374',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()