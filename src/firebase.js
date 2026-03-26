import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            "AIzaSyDngVFJGa1Ce7qDvsffp7X1ctV5eFDVdKo",
  authDomain:        "welfare-messenger.firebaseapp.com",
  projectId:         "welfare-messenger",
  storageBucket:     "welfare-messenger.firebasestorage.app",
  messagingSenderId: "30891500738",
  appId:             "1:30891500738:web:252625b3dfd16b8810075b",
  measurementId:     "G-ZCJSHLNHEP"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// 로그인 시 Google 계정 선택 팝업 항상 표시
googleProvider.setCustomParameters({ prompt: 'select_account' })
