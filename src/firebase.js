import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyDngVFJGa1Ce7qDvsffp7X1ctV5eFDVdKo",
  authDomain:        "welfare-messenger.firebaseapp.com",
  projectId:         "welfare-messenger",
  storageBucket:     "welfare-messenger.firebasestorage.app",
  messagingSenderId: "30891500738",
  appId:             "1:30891500738:web:252625b3dfd16b8810075b",
  measurementId:     "G-ZCJSHLNHEP"
}

export const app = initializeApp(firebaseConfig)

export const auth          = getAuth(app)
export const db            = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({ prompt: 'select_account' })
