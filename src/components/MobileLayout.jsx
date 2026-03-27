import React, { useState } from 'react'
import ChatMain from './ChatMain.jsx'
import TodoPanel from './TodoPanel.jsx'
import './MobileLayout.css'

export default function MobileLayout({ workspaceName, messages, sendMessage, todos, addTodo, toggleTodo, aiModel, setSettingsOpen, userDisplayName, selectedChannel, setSelectedChannel, channelOptions }) {
  const [activeTab, setActiveTab] = useState('chat')
  const activeChannel = (channelOptions || []).find(ch => ch.id === selectedChannel) || { label: '공지사항', icon: '🔒' }

  return (
    <div className="mobile-wrap">
      {/* Mobile header */}
      <div className="mobile-header">
        <span className="mobile-ws-name">{workspaceName}</span>
        <span className="mobile-ch">{activeChannel.icon} {activeChannel.label}</span>
        <button className="mobile-settings-btn" onClick={() => setSettingsOpen(true)}>⚙</button>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderBottom: '0.5px solid var(--border)', background: 'var(--sidebar-bg)' }}>
        {(channelOptions || []).map(ch => (
          <button
            key={ch.id}
            onClick={() => setSelectedChannel?.(ch.id)}
            style={{
              border: '0.5px solid var(--border-hover)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              background: selectedChannel === ch.id ? 'var(--accent-light)' : 'var(--panel-bg)',
              color: selectedChannel === ch.id ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {ch.icon} {ch.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mobile-content">
        {activeTab === 'chat' && (
          <ChatMain messages={messages} sendMessage={sendMessage} aiModel={aiModel} selectedChannel={selectedChannel} channelOptions={channelOptions} />
        )}
        {activeTab === 'todo' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TodoPanel todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} userDisplayName={userDisplayName} />
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <nav className="mobile-nav">
        {[
          { id: 'chat', label: '채팅',    icon: '💬' },
          { id: 'todo', label: 'To Do',   icon: '✅' },
          { id: 'ai',   label: 'AI 비서', icon: '🤖' },
        ].map(t => (
          <button
            key={t.id}
            className={`mobile-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
