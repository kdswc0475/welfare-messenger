import React, { useState, useRef, useEffect } from 'react'
import './ChatMain.css'

function Avatar({ msg, size = 32 }) {
  if (msg.photoURL) {
    return (
      <img
        src={msg.photoURL}
        alt={msg.author}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div className={`avatar av-${msg.avatarColor}`} style={{ width: size, height: size, fontSize: size * 0.375 }}>
      {msg.avatar}
    </div>
  )
}

function FileAttachment({ file }) {
  if (file.type.startsWith('image/')) {
    return (
      <div className="file-attachment">
        <img src={file.dataUrl} alt={file.name} className="attach-image" />
        <div className="attach-name">🖼 {file.name}</div>
      </div>
    )
  }
  return (
    <div className="file-attachment file-doc">
      <span className="file-icon">📄</span>
      <div className="file-info">
        <div className="attach-name">{file.name}</div>
        <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isAI     = msg.type === 'ai'
  const isNotice = msg.type === 'notice'

  return (
    <div className="msg">
      <Avatar msg={msg} size={32} />
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
          <>
            {msg.text && <div className="msg-text">{msg.text}</div>}
            {msg.file && <FileAttachment file={msg.file} />}
          </>
        )}
      </div>
    </div>
  )
}

export default function ChatMain({ messages, sendMessage, aiModel }) {
  const [input, setInput]         = useState('')
  const [tab, setTab]             = useState('chat')
  const [pendingFile, setPendingFile] = useState(null)
  const bottomRef                 = useRef(null)
  const fileInputRef              = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = () => {
    if (!input.trim() && !pendingFile) return
    sendMessage(input.trim(), pendingFile)
    setInput('')
    setPendingFile(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 10MB 제한
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하만 첨부 가능합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPendingFile({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: ev.target.result,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <main className="chat-main">
      {/* Top tabs */}
      <div className="top-tabs">
        {['chat', 'ai', 'files'].map(t => (
          <button key={t} className={`top-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ chat: '채팅', ai: 'AI 비서', files: '파일' }[t]}
          </button>
        ))}
      </div>

      {/* Channel header */}
      <div className="chat-header">
        <span className="ch-lock">🔒</span>
        <span className="chat-ch-name">공지사항</span>
        <div className="header-actions">
          <button className="hbtn" title="화상회의">🎥</button>
          <button className="hbtn" title="멤버">👥</button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* 파일 미리보기 */}
      {pendingFile && (
        <div className="pending-file">
          {pendingFile.type.startsWith('image/') ? (
            <img src={pendingFile.dataUrl} alt={pendingFile.name} className="pending-image" />
          ) : (
            <span>📄 {pendingFile.name}</span>
          )}
          <button className="pending-remove" onClick={() => setPendingFile(null)}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className="input-area">
        <div className="input-hint">@AI비서 를 포함하면 AI가 응답합니다</div>
        <div className="input-row">
          {/* 숨겨진 파일 input */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.hwp"
            onChange={handleFileChange}
          />
          <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="파일 첨부">📎</button>
          <input
            className="msg-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={pendingFile ? `${pendingFile.name} 첨부됨 — 메시지 추가 (선택)` : '메시지 입력...'}
          />
          <button className="send-btn" onClick={handleSend}>▶</button>
        </div>
      </div>
    </main>
  )
}
