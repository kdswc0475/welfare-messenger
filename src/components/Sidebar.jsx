import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './Sidebar.css'

export default function Sidebar({ workspaceName, setWorkspaceName, setSettingsOpen }) {
  const { user, logout }          = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing]     = useState(false)
  const [draft, setDraft]         = useState(workspaceName)
  const inputRef                  = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const startEdit  = () => { setDraft(workspaceName); setEditing(true) }
  const saveEdit   = () => { if (draft.trim()) setWorkspaceName(draft.trim()); setEditing(false) }
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
          {user && (
            <div className="member-row" key={user.uid}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <span className="avatar av-blue">{user.displayName?.charAt(0) || '?'}</span>
              )}
              {!collapsed && <span className="member-name">{user.displayName} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(나)</span></span>}
              {!collapsed && <span className="dot dot-online" />}
            </div>
          )}
        </section>
      </div>

      {/* Footer — 로그인 유저 + 설정 + 로그아웃 */}
      <div className="sidebar-footer">
        {/* 현재 로그인 유저 */}
        {user && (
          <div className={`user-profile ${collapsed ? 'user-profile-collapsed' : ''}`}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="user-photo"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="avatar av-blue user-photo-fallback">
                {user.displayName?.charAt(0) || '?'}
              </span>
            )}
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{user.displayName}</span>
                <span className="user-email">{user.email}</span>
              </div>
            )}
          </div>
        )}

        {/* 설정 버튼 */}
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          <span>⚙</span>
          {!collapsed && <span>관리자 설정</span>}
        </button>

        {/* 로그아웃 버튼 */}
        <button className="logout-btn" onClick={logout} title="로그아웃">
          <span>↩</span>
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  )
}
