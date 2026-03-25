import React, { useState } from 'react'
import ChatMain from './ChatMain.jsx'
import TodoPanel from './TodoPanel.jsx'
import './MobileLayout.css'

export default function MobileLayout({ workspaceName, messages, sendMessage, todos, addTodo, toggleTodo, aiModel, setSettingsOpen }) {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="mobile-wrap">
      {/* Mobile header */}
      <div className="mobile-header">
        <span className="mobile-ws-name">{workspaceName}</span>
        <span className="mobile-ch">🔒 공지사항</span>
        <button className="mobile-settings-btn" onClick={() => setSettingsOpen(true)}>⚙</button>
      </div>

      {/* Content */}
      <div className="mobile-content">
        {activeTab === 'chat' && (
          <ChatMain messages={messages} sendMessage={sendMessage} aiModel={aiModel} />
        )}
        {activeTab === 'todo' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TodoPanel todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} />
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
