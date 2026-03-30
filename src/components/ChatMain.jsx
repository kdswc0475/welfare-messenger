import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AI_MENTIONS } from '../aiMentions.js'
import NotionModal from './NotionModal.jsx'
import './ChatMain.css'

// @멘션 텍스트를 하이라이트 칩으로 렌더링
function renderWithMentions(text) {
  if (!text) return null
  const parts = text.split(/(@\S+)/g)
  return parts.map((part, i) => {
    const lower = part.toLowerCase()
    const isMention = AI_MENTIONS.some(m => lower === m.tag || lower === '@ai비서')
    return isMention
      ? <span key={i} className="mention-chip">{part}</span>
      : <span key={i}>{part}</span>
  })
}

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

function FileAttachment({ msg }) {
  if (!msg.fileURL && !msg.fileName) return null
  const isImage = msg.fileType?.startsWith('image/')
  if (isImage) {
    return (
      <div className="file-attachment">
        <a href={msg.fileURL} target="_blank" rel="noreferrer">
          <img src={msg.fileURL} alt={msg.fileName} className="attach-image" />
        </a>
        <div className="attach-name">🖼 {msg.fileName}</div>
      </div>
    )
  }
  return (
    <div className="file-attachment file-doc">
      <span className="file-icon">📄</span>
      <div className="file-info">
        <a href={msg.fileURL} target="_blank" rel="noreferrer" className="attach-name">{msg.fileName}</a>
        {msg.fileSize && <div className="file-size">{(msg.fileSize / 1024).toFixed(1)} KB</div>}
      </div>
    </div>
  )
}

// 메시지 내 인용(답장) 미리보기
function ReplyQuote({ replyTo }) {
  if (!replyTo) return null
  return (
    <div className="reply-quote">
      <div className="reply-quote-bar" />
      <div className="reply-quote-content">
        <span className="reply-quote-author">{replyTo.author}</span>
        <span className="reply-quote-text">{replyTo.text?.slice(0, 60)}{replyTo.text?.length > 60 ? '…' : ''}</span>
      </div>
    </div>
  )
}

function Message({ msg, onContextMenu }) {
  const isAI     = msg.type === 'ai'
  const isNotice = msg.type === 'notice'

  return (
    <div className="msg" onContextMenu={e => onContextMenu(e, msg)}>
      <Avatar msg={msg} size={32} />
      <div className="msg-body">
        <div className="msg-meta">
          <span className="msg-name">{msg.author}</span>
          {isAI && <span className="ai-model-badge">{msg.model}</span>}
          <span className="msg-time">{msg.time}</span>
        </div>
        {/* 인용된 메시지 */}
        {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} />}

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
            {msg.text && <div className="msg-text">{renderWithMentions(msg.text)}</div>}
            {msg.fileURL && <FileAttachment msg={msg} />}
          </>
        )}
      </div>
    </div>
  )
}

// 우클릭 컨텍스트 메뉴
const CTX_ITEMS = [
  { id: 'copy',   label: '복사',        icon: '📋' },
  { id: 'reply',  label: '답장',        icon: '↩' },
  { id: 'notion', label: '노션에 저장', icon: 'N', notion: true },
  { id: 'notice', label: '공지',        icon: '📢' },
  { id: 'delete', label: '삭제',        icon: '🗑', danger: true },
]

function ContextMenu({ menu, currentUser, onAction }) {
  if (!menu.show || !menu.msg) return null
  const msg   = menu.msg
  // uid가 있으면 uid로, 없으면(기존 메시지) author 이름으로 본인 판별
  const isOwn = currentUser && (
    (msg.uid  && msg.uid    === currentUser.uid) ||
    (!msg.uid && msg.author === currentUser.displayName)
  )

  const visible = CTX_ITEMS.filter(item => {
    if (item.id === 'delete')  return isOwn
    if (item.id === 'notice')  return msg.type !== 'notice'
    return true
  })

  return (
    <div
      className="ctx-menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={e => e.preventDefault()}
      onClick={e => e.stopPropagation()}
    >
      {visible.map(item => (
        <div
          key={item.id}
          className={`ctx-item${item.danger ? ' danger' : ''}`}
          onClick={() => onAction(item.id, msg)}
        >
          <span className={`ctx-icon${item.notion ? ' ctx-icon-notion' : ''}`}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// 멘션 팝업
function MentionPopup({ items, activeIdx, onSelect }) {
  return (
    <div className="mention-popup">
      <div className="mention-popup-title">AI 모델 선택</div>
      {items.map((m, i) => (
        <div
          key={m.tag}
          className={`mention-item ${i === activeIdx ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); onSelect(m) }}
        >
          <span className="mention-item-tag">{m.tag}</span>
          <span className="mention-item-label">{m.label}</span>
          <span className={`mention-item-sub ${m.free ? 'free' : ''}`}>{m.sub}</span>
        </div>
      ))}
    </div>
  )
}

export default function ChatMain({ messages, sendMessage, aiModel, currentUser, onDeleteMessage, onMarkNotice, selectedChannel, channelOptions }) {
  const [input, setInput]             = useState('')
  const [tab, setTab]                 = useState('chat')
  const [pendingFile, setPendingFile] = useState(null)
  const [replyTo, setReplyTo]         = useState(null)
  const [popup, setPopup]             = useState({ show: false, filtered: [], atIdx: -1, query: '', activeIdx: 0 })
  const [ctxMenu, setCtxMenu]         = useState({ show: false, x: 0, y: 0, msg: null })
  const [notionMsg, setNotionMsg]     = useState(null)

  const bottomRef   = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef    = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // 외부 클릭 시 팝업/메뉴 닫기
  useEffect(() => {
    const close = () => {
      setPopup(p => ({ ...p, show: false }))
      setCtxMenu(p => ({ ...p, show: false }))
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  // ── 컨텍스트 메뉴 ─────────────────────────────────────────
  const handleContextMenu = useCallback((e, msg) => {
    e.preventDefault()
    e.stopPropagation()
    const menuW = 160, menuH = 180
    const x = e.clientX + menuW > window.innerWidth  ? e.clientX - menuW : e.clientX
    const y = e.clientY + menuH > window.innerHeight ? e.clientY - menuH : e.clientY
    setCtxMenu({ show: true, x, y, msg })
  }, [])

  const handleCtxAction = useCallback((action, msg) => {
    setCtxMenu(p => ({ ...p, show: false }))
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(msg.text || '').catch(() => {})
        break
      case 'reply':
        setReplyTo({ id: msg.id, author: msg.author, text: msg.text })
        inputRef.current?.focus()
        break
      case 'notice':
        onMarkNotice?.(msg.id)
        break
      case 'notion':
        setNotionMsg(msg)
        break
      case 'delete':
        if (window.confirm('이 메시지를 삭제할까요?')) onDeleteMessage?.(msg.id)
        break
      default: break
    }
  }, [onMarkNotice, onDeleteMessage])

  const saveToNotion = useCallback(async (project) => {
    const res = await fetch('/api/notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveChat',
        data: {
          content:  notionMsg?.text || '',
          author:   notionMsg?.author || '',
          date:     new Date().toISOString().split('T')[0],
          project,
        },
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || '저장 실패')
  }, [notionMsg])

  // ── @멘션 팝업 ────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val    = e.target.value
    const cursor = e.target.selectionStart
    setInput(val)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`

    const before = val.slice(0, cursor)
    const atIdx  = before.lastIndexOf('@')

    if (atIdx !== -1) {
      const afterAt = before.slice(atIdx + 1)
      if (!afterAt.includes(' ')) {
        const query    = afterAt.toLowerCase()
        const filtered = AI_MENTIONS.filter(m =>
          m.tag.slice(1).startsWith(query) || m.label.toLowerCase().includes(query)
        )
        if (filtered.length > 0) {
          setPopup({ show: true, filtered, atIdx, query, activeIdx: 0 })
          return
        }
      }
    }
    setPopup(p => ({ ...p, show: false }))
  }

  const selectMention = (mention) => {
    const before   = input.slice(0, popup.atIdx)
    const after    = input.slice(popup.atIdx + 1 + popup.query.length)
    const newInput = before + mention.tag + ' ' + after
    setInput(newInput)
    setPopup(p => ({ ...p, show: false }))
    setTimeout(() => {
      if (inputRef.current) {
        const pos = popup.atIdx + mention.tag.length + 1
        inputRef.current.setSelectionRange(pos, pos)
        inputRef.current.focus()
      }
    }, 0)
  }

  // ── 전송 ─────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() && !pendingFile) return
    sendMessage(input.trim(), pendingFile, replyTo)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = '34px'
    setPendingFile(null)
    setReplyTo(null)
    setPopup(p => ({ ...p, show: false }))
  }

  const handleKeyDown = (e) => {
    if (popup.show) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setPopup(p => ({ ...p, activeIdx: (p.activeIdx + 1) % p.filtered.length })); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setPopup(p => ({ ...p, activeIdx: (p.activeIdx - 1 + p.filtered.length) % p.filtered.length })); return }
      if (e.key === 'Enter')     { e.preventDefault(); selectMention(popup.filtered[popup.activeIdx]); return }
      if (e.key === 'Escape')    { setPopup(p => ({ ...p, show: false })); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('파일 크기는 10MB 이하만 첨부 가능합니다.'); return }
    const reader = new FileReader()
    reader.onload = ev => setPendingFile({ name: file.name, type: file.type, size: file.size, dataUrl: ev.target.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const activeChannel = (channelOptions || []).find(ch => ch.id === selectedChannel) || { id: 'notice', label: '공지사항', icon: '🔒' }

  return (
    <main className="chat-main">
      {/* 전역 컨텍스트 메뉴 (fixed 포지션) */}
      <ContextMenu
        menu={ctxMenu}
        currentUser={currentUser}
        onAction={handleCtxAction}
      />

      {/* 노션 저장 모달 */}
      {notionMsg && (
        <NotionModal
          preview={`${notionMsg.author}: ${(notionMsg.text || '').slice(0, 60)}${(notionMsg.text || '').length > 60 ? '…' : ''}`}
          onClose={() => setNotionMsg(null)}
          onSave={saveToNotion}
        />
      )}

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
        <span className="ch-lock">{activeChannel.icon}</span>
        <span className="chat-ch-name">{activeChannel.label}</span>
        <div className="header-actions">
          <button className="hbtn" title="화상회의">🎥</button>
          <button className="hbtn" title="멤버">👥</button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} onContextMenu={handleContextMenu} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 파일 미리보기 */}
      {pendingFile && (
        <div className="pending-file">
          {pendingFile.type.startsWith('image/')
            ? <img src={pendingFile.dataUrl} alt={pendingFile.name} className="pending-image" />
            : <span>📄 {pendingFile.name}</span>
          }
          <button className="pending-remove" onClick={() => setPendingFile(null)}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className="input-area" style={{ position: 'relative' }}>
        {/* 멘션 팝업 */}
        {popup.show && (
          <MentionPopup items={popup.filtered} activeIdx={popup.activeIdx} onSelect={selectMention} />
        )}

        {/* 답장 미리보기 */}
        {replyTo && (
          <div className="reply-preview">
            <div className="reply-preview-bar" />
            <div className="reply-preview-content">
              <span className="reply-preview-author">↩ {replyTo.author}에게 답장</span>
              <span className="reply-preview-text">{replyTo.text?.slice(0, 60)}{replyTo.text?.length > 60 ? '…' : ''}</span>
            </div>
            <button className="reply-preview-close" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}

        <div className="input-hint">
          <span>@를 입력하면 AI 모델을 선택할 수 있습니다 — </span>
          {AI_MENTIONS.filter(m => m.tag !== '@ai').map(m => (
            <span key={m.tag} className="hint-tag" onClick={() => {
              setInput(prev => prev + m.tag + ' ')
              inputRef.current?.focus()
            }}>
              {m.tag}
            </span>
          ))}
        </div>

        <div className="input-row">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.hwp"
            onChange={handleFileChange}
          />
          <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="파일 첨부">📎</button>
          <textarea
            ref={inputRef}
            className="msg-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={pendingFile ? `${pendingFile.name} 첨부됨 — 메시지 추가 (선택)` : '메시지 입력... (@로 AI 모델 선택)'}
          />
          <button className="send-btn" onClick={handleSend}>▶</button>
        </div>
      </div>
    </main>
  )
}
