import React, { useState, useRef, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext.jsx'
import { db } from '../firebase.js'
import './Sidebar.css'

export default function Sidebar({ workspaceName, setWorkspaceName, setSettingsOpen, selectedChannel, setSelectedChannel, channelOptions, channelUnread }) {
  const { user, logout }          = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing]     = useState(false)
  const [draft, setDraft]         = useState(workspaceName)
  const [members, setMembers]     = useState([])
  const inputRef                  = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  // Firestore 온라인 멤버 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'users'), where('online', '==', true))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [])

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

      {/* Body */}
      <div className="sidebar-body">
        {/* 채널 */}
        <section className="ch-section">
          {!collapsed && <div className="section-label">채널</div>}
          {(channelOptions || []).map(ch => (
            <div
              key={ch.id}
              className={`channel-item ${selectedChannel === ch.id ? 'active' : ''}`}
              onClick={() => setSelectedChannel?.(ch.id)}
            >
              <span className="ch-icon">{ch.icon}</span>
              {!collapsed && <span className="ch-name">{ch.label}</span>}
              {!collapsed && (channelUnread?.[ch.id] > 0) && <span className="badge">{channelUnread[ch.id]}</span>}
            </div>
          ))}
        </section>

        {/* 온라인 멤버 */}
        <section className="ch-section">
          {!collapsed && (
            <div className="section-label">
              온라인 멤버 {members.length > 0 && <span style={{ color: 'var(--success)' }}>· {members.length}명</span>}
            </div>
          )}
          {members.map(m => (
            <div className="member-row" key={m.uid}>
              {m.photoURL ? (
                <img
                  src={m.photoURL}
                  alt={m.displayName}
                  referrerPolicy="no-referrer"
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <span className="avatar av-blue">{m.displayName?.charAt(0) || '?'}</span>
              )}
              {!collapsed && (
                <span className="member-name">
                  {m.displayName}
                  {m.uid === user?.uid && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>(나)</span>}
                </span>
              )}
              {!collapsed && <span className="dot dot-online" />}
            </div>
          ))}
        </section>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {user && (
          <div className={`user-profile ${collapsed ? 'user-profile-collapsed' : ''}`}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="user-photo" referrerPolicy="no-referrer" />
            ) : (
              <span className="avatar av-blue user-photo-fallback">{user.displayName?.charAt(0) || '?'}</span>
            )}
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{user.displayName}</span>
                <span className="user-email">{user.email}</span>
              </div>
            )}
          </div>
        )}
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          <span>⚙</span>
          {!collapsed && <span>관리자 설정</span>}
        </button>
        <button className="logout-btn" onClick={logout} title="로그아웃">
          <span>↩</span>
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  )
}
