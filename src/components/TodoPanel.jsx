import React, { useState, useMemo, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase.js'
import './TodoPanel.css'

function TodoModal({ onClose, onAdd, open, defaultType, userDisplayName }) {
  const [type, setType]         = useState('directive')
  const [text, setText]         = useState('')
  const [assignee, setAssignee] = useState(userDisplayName)
  const [due, setDue]           = useState('')
  const [priority, setPriority] = useState('보통')
  const [members, setMembers]   = useState([])

  // Firestore 전체 팀원 목록 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'users')), snapshot => {
      setMembers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!open) return
    const nextType = defaultType === 'personal' ? 'personal' : 'directive'
    setType(nextType)
    setText('')
    setDue('')
    setPriority('보통')
    // 개별업무는 본인, 업무지시는 첫 번째 팀원(또는 본인)
    setAssignee(userDisplayName)
  }, [open, defaultType, userDisplayName])

  const handleAdd = () => {
    if (!text.trim()) return
    onAdd({ type, text: text.trim(), assignee, due, urgent: priority === '긴급' })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">업무 등록</div>

        <div className="type-toggle">
          <button className={`type-btn ${type === 'directive' ? 'active' : ''}`} onClick={() => { setType('directive') }}>업무지시</button>
          <button className={`type-btn ${type === 'personal'  ? 'active' : ''}`} onClick={() => { setType('personal'); setAssignee(userDisplayName) }}>개별업무</button>
        </div>

        <div className="form-group">
          <label className="form-label">업무 내용</label>
          <input className="form-input" value={text} onChange={e => setText(e.target.value)} placeholder="업무 내용 입력" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div className="form-group">
          <label className="form-label">담당자</label>
          {type === 'personal' ? (
            // 개별업무: 본인 고정
            <input
              className="form-input assignee-self"
              readOnly
              value={`${userDisplayName} (나)`}
            />
          ) : members.length > 0 ? (
            // 업무지시: 팀원 드롭다운
            <select className="form-input" value={assignee} onChange={e => setAssignee(e.target.value)}>
              {members.map(m => (
                <option key={m.uid} value={m.displayName}>
                  {m.displayName}{m.displayName === userDisplayName ? ' (나)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <input className="form-input assignee-self" readOnly value={userDisplayName} />
          )}
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">마감일</label>
            <input className="form-input" type="date" value={due} onChange={e => setDue(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">우선순위</label>
            <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)}>
              <option>보통</option><option>긴급</option><option>낮음</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={handleAdd}>등록</button>
        </div>
      </div>
    </div>
  )
}

function TodoItem({ item, onToggle }) {
  return (
    <div className="todo-item">
      <div className={`todo-cb ${item.done ? 'checked' : ''}`} onClick={() => onToggle(item.id)}>
        {item.done && '✓'}
      </div>
      <div style={{ flex: 1 }}>
        <div className={`todo-text ${item.done ? 'done' : ''}`}>{item.text}</div>
        <div className="todo-meta">
          {item.assignee && <span>담당: {item.assignee}</span>}
          {item.assignee && item.due && <span> · </span>}
          {item.due && <span style={{ color: item.urgent && !item.done ? '#A32D2D' : 'inherit' }}>{item.due}</span>}
        </div>
        {item.urgent && !item.done && <span className="tag urgent">긴급</span>}
        {!item.urgent && <span className="tag">{item.type === 'directive' ? '지시' : '개인'}</span>}
      </div>
    </div>
  )
}

export default function TodoPanel({ todos, addTodo, toggleTodo, userDisplayName }) {
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter]       = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('directive')

  const openModal = (type = 'directive') => { setModalType(type); setModalOpen(true) }

  const filtered = useMemo(() => {
    switch (filter) {
      case 'directive': return todos.filter(t => t.type === 'directive' && !t.done)
      case 'personal':  return todos.filter(t => t.type === 'personal'  && !t.done)
      case 'done':      return todos.filter(t => t.done)
      default:          return todos
    }
  }, [todos, filter])

  const progress = useMemo(() => {
    if (!todos.length) return 0
    return Math.round(todos.filter(t => t.done).length / todos.length * 100)
  }, [todos])

  return (
    <>
      <aside className={`todo-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="todo-header">
          {!collapsed && <span className="todo-title">To Do 현황판</span>}
          {!collapsed && <button className="add-btn" onClick={() => openModal()}>+ 업무지시</button>}
          <button className="icon-sm toggle-btn" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? '◀' : '▶'}
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="todo-tabs">
              {[['all','전체'],['directive','업무지시'],['personal','개별'],['done','완료']].map(([v,l]) => (
                <button key={v} className={`todo-tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
              ))}
            </div>

            <div className="todo-body">
              <div className="progress-row">
                <span className="progress-label">진척률</span>
                <span className="progress-pct">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* Directive section */}
              {(filter === 'all' || filter === 'directive') && (
                <>
                  <div className="section-hd">
                    <span className="section-lbl">업무지시</span>
                    <button className="plus-btn" onClick={() => openModal('directive')}>＋</button>
                  </div>
                  {filtered.filter(t => t.type === 'directive').map(t => (
                    <TodoItem key={t.id} item={t} onToggle={toggleTodo} />
                  ))}
                </>
              )}

              {/* Personal section */}
              {(filter === 'all' || filter === 'personal') && (
                <>
                  <div className="section-hd">
                    <span className="section-lbl">개별업무</span>
                    <button className="plus-btn" onClick={() => openModal('personal')}>＋</button>
                  </div>
                  {filtered.filter(t => t.type === 'personal').map(t => (
                    <TodoItem key={t.id} item={t} onToggle={toggleTodo} />
                  ))}
                </>
              )}

              {/* Done section */}
              {filter === 'done' && filtered.map(t => (
                <TodoItem key={t.id} item={t} onToggle={toggleTodo} />
              ))}
            </div>
          </>
        )}
      </aside>

      {modalOpen && (
        <TodoModal
          open={modalOpen}
          defaultType={modalType}
          userDisplayName={userDisplayName}
          onClose={() => setModalOpen(false)}
          onAdd={addTodo}
        />
      )}
    </>
  )
}
