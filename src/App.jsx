import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatMain from './components/ChatMain.jsx'
import TodoPanel from './components/TodoPanel.jsx'
import MobileLayout from './components/MobileLayout.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import Login from './components/Login.jsx'
import { useAuth } from './context/AuthContext.jsx'
import './App.css'

const INITIAL_MESSAGES = []

const INITIAL_TODOS = [
  { id: 1, type: 'directive', done: false, text: '긴급복지 신청서 검토 및 제출', assignee: '이복지', due: 'D-1', urgent: true },
  { id: 2, type: 'directive', done: true,  text: '주간 케이스 회의 안건 작성',   assignee: '박사복', due: '완료',  urgent: false },
  { id: 3, type: 'personal',  done: false, text: '방문일지 작성 (홍길동)',         assignee: '',       due: '오늘',  urgent: false },
  { id: 4, type: 'personal',  done: false, text: '상급기관 보고 공문 초안',        assignee: '',       due: '금요일',urgent: false },
]

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

// 로딩 스피너
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
  const [messages, setMessages]           = useState(INITIAL_MESSAGES)
  const [todos, setTodos]                 = useState(INITIAL_TODOS)
  const [aiModel, setAiModel]             = useState('Gemini Flash')
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [nextId, setNextId]               = useState(100)

  const genId = useCallback(() => { setNextId(n => n + 1); return nextId }, [nextId])

  const sendMessage = useCallback((text, file = null) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

    // 로그인한 Google 계정 정보 사용
    const displayName = user?.displayName || '사용자'
    const firstChar   = displayName.charAt(0)
    const photoURL    = user?.photoURL || null

    const newMsg = {
      id: genId(),
      author: displayName,
      avatar: firstChar,
      avatarColor: 'blue',
      photoURL,
      time: now,
      type: 'text',
      text,
      file: file || null,
    }
    setMessages(prev => [...prev, newMsg])

    const lower = text.toLowerCase()
    if (lower.includes('@ai비서') || lower.includes('@ai')) {
      const thinkingId = Date.now()
      setMessages(prev => [...prev, {
        id: thinkingId,
        author: 'AI 비서',
        avatar: 'AI',
        avatarColor: 'ai',
        photoURL: null,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'ai',
        text: '⏳ 답변을 생성하고 있습니다...',
        model: aiModel,
      }])

      callAI(aiModel, text)
        .then(reply => {
          setMessages(prev => prev.map(m =>
            m.id === thinkingId ? { ...m, text: reply } : m
          ))
        })
        .catch(err => {
          setMessages(prev => prev.map(m =>
            m.id === thinkingId
              ? { ...m, text: `❌ 오류: ${err.message}` }
              : m
          ))
        })
    }
  }, [genId, aiModel, user])

  const addTodo = useCallback((todo) => {
    setTodos(prev => [...prev, { ...todo, id: Date.now(), done: false }])
  }, [])

  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [])

  // 로딩 중
  if (loading) return <LoadingScreen />

  // 미로그인 → 로그인 화면
  if (!user) return <Login />

  const sharedProps = { workspaceName, setWorkspaceName, messages, sendMessage, todos, addTodo, toggleTodo, aiModel, setAiModel, setSettingsOpen }

  return (
    <>
      {/* Desktop */}
      <div className="desktop-layout desktop-only">
        <Sidebar {...sharedProps} />
        <ChatMain {...sharedProps} />
        <TodoPanel {...sharedProps} />
      </div>

      {/* Mobile */}
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
