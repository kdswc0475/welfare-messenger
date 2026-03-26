import React, { useState, useCallback, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore'
import Sidebar from './components/Sidebar.jsx'
import ChatMain from './components/ChatMain.jsx'
import TodoPanel from './components/TodoPanel.jsx'
import MobileLayout from './components/MobileLayout.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import Login from './components/Login.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { db } from './firebase.js'
import './App.css'

const INITIAL_TODOS = [
  { id: 1, type: 'directive', done: false, text: '긴급복지 신청서 검토 및 제출', assignee: '이복지', due: 'D-1', urgent: true },
  { id: 2, type: 'directive', done: true,  text: '주간 케이스 회의 안건 작성',   assignee: '박사복', due: '완료',  urgent: false },
  { id: 3, type: 'personal',  done: false, text: '방문일지 작성 (홍길동)',         assignee: '',       due: '오늘',  urgent: false },
  { id: 4, type: 'personal',  done: false, text: '상급기관 보고 공문 초안',        assignee: '',       due: '금요일',urgent: false },
]

function formatTime(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

async function callAI(model, message) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, message }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'AI 오류')
  return data.reply
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'linear-gradient(135deg, #f0efec 0%, #e8edf5 100%)',
    }}>
      <div style={{
        width: 48, height: 48, border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>잠시만 기다려주세요...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  const [workspaceName, setWorkspaceName] = useState('복지4팀')
  const [messages, setMessages]           = useState([])
  const [todos, setTodos]                 = useState(INITIAL_TODOS)
  const [aiModel, setAiModel]             = useState('Gemini Flash')
  const [settingsOpen, setSettingsOpen]   = useState(false)

  // ── Firestore 실시간 메시지 구독 ──────────────────────────
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'), limit(100))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
    })
    return unsubscribe
  }, [user])

  // ── 메시지 전송 ───────────────────────────────────────────
  const sendMessage = useCallback(async (text, file = null) => {
    const displayName = user?.displayName || '사용자'
    const photoURL    = user?.photoURL || null

    let fileData = null
    // 파일은 base64로 Firestore에 직접 저장 (500KB 이하)
    if (file) {
      if (file.size <= 500 * 1024) {
        fileData = {
          fileURL:  file.dataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }
      } else {
        alert('파일 크기는 500KB 이하만 첨부 가능합니다. (Storage 업그레이드 시 제한 해제)')
      }
    }

    const msgData = {
      author:      displayName,
      avatar:      displayName.charAt(0),
      avatarColor: 'blue',
      photoURL,
      text:        text || '',
      type:        'text',
      createdAt:   serverTimestamp(),
      ...fileData,
    }
    await addDoc(collection(db, 'messages'), msgData)

    // AI 응답
    const lower = text.toLowerCase()
    if (lower.includes('@ai비서') || lower.includes('@ai')) {
      const aiRef = await addDoc(collection(db, 'messages'), {
        author:      'AI 비서',
        avatar:      'AI',
        avatarColor: 'ai',
        photoURL:    null,
        text:        '⏳ 답변을 생성하고 있습니다...',
        type:        'ai',
        model:       aiModel,
        createdAt:   serverTimestamp(),
      })
      callAI(aiModel, text)
        .then(reply  => updateDoc(doc(db, 'messages', aiRef.id), { text: reply }))
        .catch(err   => updateDoc(doc(db, 'messages', aiRef.id), {
          text: `❌ ${err.message || 'AI 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}`,
        }))
    }
  }, [user, aiModel])

  const addTodo    = useCallback((todo) => setTodos(prev => [...prev, { ...todo, id: Date.now(), done: false }]), [])
  const toggleTodo = useCallback((id)   => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)), [])

  if (loading) return <LoadingScreen />
  if (!user)   return <Login />

  // Firestore timestamp → 표시 시간 변환
  const displayMessages = messages.map(m => ({
    ...m,
    time: m.createdAt ? formatTime(m.createdAt) : '',
  }))

  const sharedProps = {
    workspaceName, setWorkspaceName,
    messages: displayMessages, sendMessage,
    todos, addTodo, toggleTodo,
    aiModel, setAiModel, setSettingsOpen,
  }

  return (
    <>
      <div className="desktop-layout desktop-only">
        <Sidebar {...sharedProps} />
        <ChatMain {...sharedProps} />
        <TodoPanel {...sharedProps} />
      </div>
      <div className="mobile-only">
        <MobileLayout {...sharedProps} />
      </div>
      {settingsOpen && (
        <SettingsModal
          workspaceName={workspaceName}
          setWorkspaceName={setWorkspaceName}
          aiModel={aiModel}
          setAiModel={setAiModel}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
