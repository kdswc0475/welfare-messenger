import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// ⚠️  아래 값을 Firebase Console에서 발급한 실제 값으로 교체하세요.
// Firebase Console → 프로젝트 설정 → 웹 앱 추가 → 구성(Config) 복사
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_AUTH_DOMAIN",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
}

const app      = initializeApp(firebaseConfig)
export const auth     = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// 로그인 시 Google 계정 선택 팝업 항상 표시
googleProvider.setCustomParameters({ prompt: 'select_account' })
