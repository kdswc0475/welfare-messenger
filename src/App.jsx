import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
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
import { detectMentionedModel } from './aiMentions.js'
import './App.css'

const INITIAL_TODOS = [
  { id: 1, type: 'directive', done: false, text: '긴급복지 신청서 검토 및 제출', assignee: '', due: 'D-1', urgent: true },
  { id: 2, type: 'directive', done: true,  text: '주간 케이스 회의 안건 작성',   assignee: '', due: '완료',  urgent: false },
  { id: 3, type: 'personal',  done: false, text: '방문일지 작성 (홍길동)',         assignee: '', due: '오늘',  urgent: false },
  { id: 4, type: 'personal',  done: false, text: '상급기관 보고 공문 초안',        assignee: '', due: '금요일',urgent: false },
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
  return { reply: data.reply, usedModel: data.usedModel || model }
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

function ResizeDivider({ onMouseDown }) {
  return <div className="resize-divider" onMouseDown={onMouseDown} />
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
  const [aiModel, setAiModel]             = useState('Llama 3.3 (무료)')
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [unread, setUnread]               = useState(0)

  // ── 알림 권한 요청 ────────────────────────────────────────
  const notifAllowed = useRef(false)
  useEffect(() => {
    if (!user || !('Notification' in window)) return
    if (Notification.permission === 'granted') { notifAllowed.current = true; return }
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { notifAllowed.current = p === 'granted' })
    }
  }, [user])

  // ── 탭 포커스 시 읽지 않은 수 초기화 ─────────────────────
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) setUnread(0) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // ── 읽지 않은 수 → 탭 제목에 표시 ───────────────────────
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) 복지 메신저` : '복지 메신저'
  }, [unread])

  // ── 패널 너비 (localStorage 유지) ────────────────────────
  const [sidebarW, setSidebarW] = useState(() => parseInt(localStorage.getItem('sidebarW') || '200', 10))
  const [todoW,    setTodoW]    = useState(() => parseInt(localStorage.getItem('todoW')    || '260', 10))
  const [resizing, setResizing] = useState(false)

  useEffect(() => { localStorage.setItem('sidebarW', sidebarW) }, [sidebarW])
  useEffect(() => { localStorage.setItem('todoW',    todoW)    }, [todoW])

  const startResize = useCallback((e, panel) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panel === 'left' ? sidebarW : todoW
    setResizing(true)
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      const delta = ev.clientX - startX
      if (panel === 'left') setSidebarW(clamp(startW + delta, 140, 420))
      else                  setTodoW   (clamp(startW - delta, 180, 500))
    }
    const onUp = () => {
      setResizing(false)
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }, [sidebarW, todoW])

  // ── Firestore 실시간 메시지 구독 + 알림 ──────────────────
  const prevMsgCount  = useRef(0)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    if (!user) return
    isInitialLoad.current = true
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'), limit(100))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

      // 초기 로드가 아닌 경우에만 알림 처리
      if (!isInitialLoad.current) {
        const newMsgs = msgs.slice(prevMsgCount.current)
        newMsgs.forEach(msg => {
          // 본인 메시지·AI 메시지는 알림 제외
          if (msg.uid === user.uid || msg.type === 'ai') return

          // 탭이 숨겨진 경우 unread 증가
          if (document.hidden) setUnread(n => n + 1)

          // OS 알림 표시
          if (notifAllowed.current) {
            const notif = new Notification(msg.author || '복지 메신저', {
              body: msg.text?.slice(0, 80) || (msg.fileName ? `📎 ${msg.fileName}` : '새 메시지'),
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: msg.id,
            })
            notif.onclick = () => { window.focus(); notif.close() }
          }
        })
      }

      isInitialLoad.current  = false
      prevMsgCount.current   = msgs.length
      setMessages(msgs)
    })
    return unsubscribe
  }, [user])

  // ── 메시지 전송 ───────────────────────────────────────────
  const sendMessage = useCallback(async (text, file = null, replyTo = null) => {
    const displayName = user?.displayName || '사용자'
    const photoURL    = user?.photoURL || null

    let fileData = null
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
      uid:         user?.uid || '',
      author:      displayName,
      avatar:      displayName.charAt(0),
      avatarColor: 'blue',
      photoURL,
      text:        text || '',
      type:        'text',
      createdAt:   serverTimestamp(),
      ...(replyTo ? { replyTo } : {}),
      ...fileData,
    }
    await addDoc(collection(db, 'messages'), msgData)

    // AI 응답 — 멘션으로 지정된 모델 또는 기본 모델 사용
    const targetModel = detectMentionedModel(text, aiModel)
    if (targetModel !== null) {
      const aiRef = await addDoc(collection(db, 'messages'), {
        author:      'AI 비서',
        avatar:      'AI',
        avatarColor: 'ai',
        photoURL:    null,
        text:        '⏳ 답변을 생성하고 있습니다...',
        type:        'ai',
        model:       targetModel,
        createdAt:   serverTimestamp(),
      })
      callAI(targetModel, text)
        .then(({ reply, usedModel }) => updateDoc(doc(db, 'messages', aiRef.id), { text: reply, model: usedModel }))
        .catch(err                   => updateDoc(doc(db, 'messages', aiRef.id), { text: `❌ 오류: ${err.message}` }))
    }
  }, [user, aiModel])

  // ── 메시지 삭제 ───────────────────────────────────────────
  const deleteMessage = useCallback(async (id) => {
    await deleteDoc(doc(db, 'messages', id))
  }, [])

  // ── 공지 지정 ─────────────────────────────────────────────
  const markAsNotice = useCallback(async (id) => {
    await updateDoc(doc(db, 'messages', id), { type: 'notice' })
  }, [])

  const addTodo    = useCallback((todo)        => setTodos(prev => [...prev, { ...todo, id: Date.now(), done: false }]), [])
  const toggleTodo = useCallback((id)          => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)), [])
  const editTodo   = useCallback((id, updates) => setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)), [])
  const deleteTodo = useCallback((id)          => setTodos(prev => prev.filter(t => t.id !== id)), [])

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
    todos, addTodo, toggleTodo, editTodo, deleteTodo,
    aiModel, setAiModel, setSettingsOpen,
    userDisplayName: user?.displayName || '사용자',
    currentUser: user,
    onDeleteMessage: deleteMessage,
    onMarkNotice:    markAsNotice,
  }

  return (
    <>
      <div
        className={`desktop-layout desktop-only${resizing ? ' resizing' : ''}`}
        style={{ '--sidebar-w': `${sidebarW}px`, '--todo-w': `${todoW}px` }}
      >
        <Sidebar {...sharedProps} />
        <ResizeDivider onMouseDown={e => startResize(e, 'left')} />
        <ChatMain {...sharedProps} />
        <ResizeDivider onMouseDown={e => startResize(e, 'right')} />
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
