import React, { useState, useRef, useEffect } from 'react'
import './Sidebar.css'

const MEMBERS = [
  { name: '김팀장', avatar: '김', color: 'green', status: 'online' },
  { name: '이복지', avatar: '이', color: 'blue',  status: 'online' },
  { name: '박사복', avatar: '박', color: 'coral', status: 'away'   },
]

export default function Sidebar({ workspaceName, setWorkspaceName, setSettingsOpen }) {
  const [collapsed, setCollapsed]   = useState(false)
  const [editing, setEditing]       = useState(false)
  const [draft, setDraft]           = useState(workspaceName)
  const inputRef                    = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const startEdit = () => { setDraft(workspaceName); setEditing(true) }
  const saveEdit  = () => { if (draft.trim()) setWorkspaceName(draft.trim()); setEditing(false) }
  const cancelEdit = () => setEditing(false)

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          editing ? (
            <input
              ref={inputRef}
              className="ws-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
            />
          ) : (
            <span className="ws-name" onClick={startEdit} title="클릭하여 팀명 수정">
              {workspaceName}
            </span>
          )
        )}
        {!collapsed && !editing && (
          <button className="icon-sm" onClick={startEdit} title="팀명 수정">✏</button>
        )}
        <button className="icon-sm toggle-btn" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Channels */}
      <div className="sidebar-body">
        <section className="ch-section">
          {!collapsed && <div className="section-label">채널</div>}
          <div className="channel-item active">
            <span className="ch-icon">🔒</span>
            {!collapsed && <span className="ch-name">공지사항</span>}
            {!collapsed && <span className="badge">1</span>}
          </div>
        </section>

        {/* Members */}
        <section className="ch-section">
          {!collapsed && <div className="section-label">멤버</div>}
          {MEMBERS.map(m => (
            <div className="member-row" key={m.name}>
              <span className={`avatar av-${m.color}`}>{m.avatar}</span>
              {!collapsed && <span className="member-name">{m.name}</span>}
              {!collapsed && <span className={`dot dot-${m.status}`} />}
            </div>
          ))}
        </section>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          <span>⚙</span>
          {!collapsed && <span>관리자 설정</span>}
        </button>
      </div>
    </aside>
  )
}
