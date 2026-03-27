import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext(null)

// Firestore에 접속 상태 기록
async function setPresence(user, online) {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid:         user.uid,
      displayName: user.displayName,
      email:       user.email,
      photoURL:    user.photoURL,
      online,
      lastSeen:    serverTimestamp(),
    }, { merge: true })
  } catch (e) {
    console.warn('presence 기록 실패:', e)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      if (firebaseUser) {
        // 로그인 → 온라인 표시
        await setPresence(firebaseUser, true)
        // 브라우저 닫힐 때 오프라인 처리
        window.addEventListener('beforeunload', () => setPresence(firebaseUser, false))
      }
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    }
  }

  const logout = async () => {
    if (user) await setPresence(user, false)
    await signOut(auth)
  }

  const updateMemberProfile = async ({ displayName, photoURL }) => {
    if (!auth.currentUser) throw new Error('로그인 정보가 없습니다.')

    const trimmedName = (displayName || '').trim()
    if (!trimmedName) throw new Error('닉네임을 입력해주세요.')

    const normalizedPhotoURL = (photoURL || '').trim()
    if (normalizedPhotoURL && !/^https?:\/\//i.test(normalizedPhotoURL)) {
      throw new Error('사진 URL은 http:// 또는 https://로 시작해야 합니다.')
    }

    await updateProfile(auth.currentUser, {
      displayName: trimmedName,
      photoURL: normalizedPhotoURL || null,
    })

    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      uid: auth.currentUser.uid,
      displayName: trimmedName,
      email: auth.currentUser.email,
      photoURL: normalizedPhotoURL || null,
      lastSeen: serverTimestamp(),
    }, { merge: true })

    // Reflect updates in the current UI without requiring re-login.
    setUser(auth.currentUser ? { ...auth.currentUser } : null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, logout, updateMemberProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
