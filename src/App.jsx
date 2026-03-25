import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatMain from './components/ChatMain.jsx'
import TodoPanel from './components/TodoPanel.jsx'
import MobileLayout from './components/MobileLayout.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import './App.css'

const INITIAL_MESSAGES = [
  {
    id: 1,
    author: '김팀장',
    avatar: '김',
    avatarColor: 'green',
    time: '오전 9:00',
    type: 'notice',
    text: '이번 주 수요일 오후 2시에 케이스 회의가 있습니다. @전체 참석 부탁드립니다.',
  },
  {
    id: 2,
    author: '이복지',
    avatar: '이',
    avatarColor: 'blue',
    time: '오전 9:15',
    type: 'text',
    text: '확인했습니다!',
  },
  {
    id: 3,
    author: '박사복',
    avatar: '박',
    avatarColor: 'coral',
    time: '오전 9:22',
    type: 'text',
    text: '네, 준비하겠습니다.',
  },
]

const INITIAL_TODOS = [
  { id: 1, type: 'directive', done: false, text: '긴급복지 신청서 검토 및 제출', assignee: '이복지', due: 'D-1', urgent: true },
  { id: 2, type: 'directive', done: true,  text: '주간 케이스 회의 안건 작성',   assignee: '박사복', due: '완료',  urgent: false },
  { id: 3, type: 'personal',  done: false, text: '방문일지 작성 (홍길동)',         assignee: '',       due: '오늘',  urgent: false },
  { id: 4, type: 'personal',  done: false, text: '상급기관 보고 공문 초안',        assignee: '',       due: '금요일',urgent: false },
]

const AI_RESPONSES = {
  '방문일지': '방문일지 필수 항목:\n① 방문일시·장소\n② 대상자 기본정보\n③ 방문목적\n④ 서비스 현황 및 욕구\n⑤ 개입 내용 및 결과\n⑥ 다음 방문 계획\n⑦ 담당자 서명\n\n사회보장정보시스템(행복e음)에 동일 항목 입력 필수입니다.',
  '긴급복지': '긴급복지지원 신청 요건:\n① 소득기준: 중위소득 75% 이하\n② 재산: 대도시 2.4억 이하\n③ 위기사유: 실직·질병·화재·이혼 등\n\n지원내용: 생계·의료·주거·사회복지서비스 연계',
  '공문': '상급기관 보고 공문 초안:\n\n수 신: OO시 복지정책과장\n제 목: 긴급복지지원 처리 결과 보고\n\n1. 관련: 사회복지사업법 제33조의7\n2. 위 호와 관련하여 아래와 같이 보고합니다.\n\n아 래\n가. 지원일시: 2025.03\n나. 지원대상: O명\n다. 지원금액: O원',
  '케이스': '케이스 기록 작성 시 포함 항목:\n① 인적사항 및 가구 현황\n② 욕구 및 문제 사정\n③ 서비스 계획 및 목표\n④ 개입 내용 (날짜순)\n⑤ 평가 및 종결 사유',
}

export default function App() {
  const [workspaceName, setWorkspaceName] = useState('복지팀')
  const [messages, setMessages]           = useState(INITIAL_MESSAGES)
  const [todos, setTodos]                 = useState(INITIAL_TODOS)
  const [aiModel, setAiModel]             = useState('Gemini Flash')
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [nextId, setNextId]               = useState(100)

  const genId = useCallback(() => { setNextId(n => n + 1); return nextId }, [nextId])

  const sendMessage = useCallback((text) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    const newMsg = { id: genId(), author: '이복지', avatar: '이', avatarColor: 'blue', time: now, type: 'text', text }
    setMessages(prev => [...prev, newMsg])

    const lower = text.toLowerCase()
    if (lower.includes('@ai') || lower.includes('@AI')) {
      let reply = '네, 확인했습니다! 더 구체적으로 질문해 주시면 도움드릴게요.'
      for (const [key, val] of Object.entries(AI_RESPONSES)) {
        if (lower.includes(key)) { reply = val; break }
      }
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          author: 'AI 비서',
          avatar: 'AI',
          avatarColor: 'ai',
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          type: 'ai',
          text: reply,
          model: aiModel,
        }])
      }, 700)
    }
  }, [genId, aiModel])

  const addTodo = useCallback((todo) => {
    setTodos(prev => [...prev, { ...todo, id: Date.now(), done: false }])
  }, [])

  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [])

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
