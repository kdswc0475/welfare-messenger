import React, { useState, useRef, useEffect } from 'react'
import './ChatMain.css'

function Message({ msg }) {
  const isAI = msg.type === 'ai'
  const isNotice = msg.type === 'notice'

  return (
    <div className="msg">
      <div className={`avatar av-${msg.avatarColor}`} style={{ width: 32, height: 32, fontSize: 12 }}>
        {msg.avatar}
      </div>
      <div className="msg-body">
        <div className="msg-meta">
          <span className="msg-name">{msg.author}</span>
          {isAI && <span className="ai-model-badge">{msg.model}</span>}
          <span className="msg-time">{msg.time}</span>
        </div>
        {isNotice ? (
          <div className="notice-bubble">
            <span className="notice-label">공지</span>
            <div>{msg.text}</div>
          </div>
        ) : isAI ? (
          <div className="ai-bubble">
            <span className="ai-label">AI 답변</span>
            <div style={{ whiteSpace: 'pre-line', marginTop: 4 }}>{msg.text}</div>
          </div>
        ) : (
          <div className="msg-text">{msg.text}</div>
        )}
      </div>
    </div>
  )
}

export default function ChatMain({ messages, sendMessage, aiModel }) {
  const [input, setInput] = useState('')
  const [tab, setTab]     = useState('chat')
  const bottomRef         = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <main className="chat-main">
      {/* Top tabs */}
      <div className="top-tabs">
        {['chat', 'ai', 'files'].map(t => (
          <button
            key={t}
            className={`top-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {{ chat: '채팅', ai: 'AI 비서', files: '파일' }[t]}
          </button>
        ))}
      </div>

      {/* Channel header */}
      <div className="chat-header">
        <span className="ch-lock">🔒</span>
        <span className="chat-ch-name">공지사항</span>
        <span className="member-count">멤버 3명</span>
        <div className="header-actions">
          <button className="hbtn" title="파일 첨부">📎</button>
          <button className="hbtn" title="화상회의">🎥</button>
          <button className="hbtn" title="멤버">👥</button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-hint">@AI비서 를 포함하면 AI가 응답합니다</div>
        <div className="input-row">
          <button className="attach-btn">📎</button>
          <input
            className="msg-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="메시지 입력..."
          />
          <button className="send-btn" onClick={handleSend}>▶</button>
        </div>
      </div>
    </main>
  )
}
