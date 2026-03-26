import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase.js'
import NotionModal from './NotionModal.jsx'
import './TodoPanel.css'

// ── 업무 등록/수정 모달 ────────────────────────────────────
function TodoModal({ onClose, onAdd, onEdit, open, defaultType, userDisplayName, editItem }) {
  const [type, setType]         = useState('directive')
  const [text, setText]         = useState('')
  const [assignee, setAssignee] = useState(userDisplayName)
  const [due, setDue]           = useState('')
  const [priority, setPriority] = useState('보통')
  const [members, setMembers]   = useState([])
  const isEditing = !!editItem

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'users')), snapshot => {
      setMembers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!open) return
    if (isEditing) {
      setType(editItem.type || 'directive')
      setText(editItem.text || '')
      setAssignee(editItem.assignee || userDisplayName)
      setDue(editItem.due || '')
      setPriority(editItem.urgent ? '긴급' : '보통')
    } else {
      setType(defaultType === 'personal' ? 'personal' : 'directive')
      setText('')
      setAssignee(userDisplayName)
      setDue('')
      setPriority('보통')
    }
  }, [open, defaultType, userDisplayName, editItem, isEditing])

  const handleSubmit = () => {
    if (!text.trim()) return
    const data = { type, text: text.trim(), assignee, due, urgent: priority === '긴급' }
    if (isEditing) onEdit(editItem.id, data)
    else           onAdd(data)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{isEditing ? '업무 수정' : '업무 등록'}</div>

        <div className="type-toggle">
          <button className={`type-btn ${type === 'directive' ? 'active' : ''}`} onClick={() => setType('directive')}>업무지시</button>
          <button className={`type-btn ${type === 'personal'  ? 'active' : ''}`} onClick={() => { setType('personal'); setAssignee(userDisplayName) }}>개별업무</button>
        </div>

        <div className="form-group">
          <label className="form-label">업무 내용</label>
          <input
            className="form-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="업무 내용 입력"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">담당자</label>
          {type === 'personal' ? (
            <input className="form-input assignee-self" readOnly value={`${userDisplayName} (나)`} />
          ) : members.length > 0 ? (
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
          <button className="btn-primary" onClick={handleSubmit}>{isEditing ? '저장' : '등록'}</button>
        </div>
      </div>
    </div>
  )
}

// ── To Do 항목 ────────────────────────────────────────────
function TodoItem({ item, onToggle, onEdit, onDelete, onNotion }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className="todo-item"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`todo-cb ${item.done ? 'checked' : ''}`} onClick={() => onToggle(item.id)}>
        {item.done && '✓'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={`todo-text ${item.done ? 'done' : ''}`}>{item.text}</div>
        <div className="todo-meta">
          {item.assignee && <span>담당: {item.assignee}</span>}
          {item.assignee && item.due && <span> · </span>}
          {item.due && <span style={{ color: item.urgent && !item.done ? '#A32D2D' : 'inherit' }}>{item.due}</span>}
        </div>
        {item.urgent && !item.done && <span className="tag urgent">긴급</span>}
        {!item.urgent && <span className="tag">{item.type === 'directive' ? '지시' : '개인'}</span>}
      </div>

      {/* 호버 시 노션/수정/삭제 버튼 */}
      <div className={`todo-actions ${hover ? 'visible' : ''}`}>
        <button
          className="todo-action-btn notion"
          title="노션에 저장"
          onClick={e => { e.stopPropagation(); onNotion(item) }}
        >N</button>
        <button
          className="todo-action-btn edit"
          title="수정"
          onClick={e => { e.stopPropagation(); onEdit(item) }}
        >✏️</button>
        <button
          className="todo-action-btn delete"
          title="삭제"
          onClick={e => { e.stopPropagation(); onDelete(item.id) }}
        >🗑</button>
      </div>
    </div>
  )
}

// ── 메인 패널 ─────────────────────────────────────────────
export default function TodoPanel({ todos, addTodo, toggleTodo, editTodo, deleteTodo, userDisplayName }) {
  const [collapsed, setCollapsed]     = useState(false)
  const [filter, setFilter]           = useState('all')
  const [modalOpen, setModalOpen]     = useState(false)
  const [modalType, setModalType]     = useState('directive')
  const [editingItem, setEditingItem] = useState(null)
  const [notionItem, setNotionItem]   = useState(null)

  const openAdd  = (type = 'directive') => { setEditingItem(null); setModalType(type); setModalOpen(true) }
  const openEdit = (item)               => { setEditingItem(item); setModalType(item.type); setModalOpen(true) }
  const handleDelete = (id) => {
    if (window.confirm('이 업무를 삭제할까요?')) deleteTodo(id)
  }

  const saveToNotion = useCallback(async (project) => {
    const res = await fetch('/api/notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveTodo',
        data: {
          text:     notionItem?.text     || '',
          assignee: notionItem?.assignee || '',
          due:      notionItem?.due      || null,
          project,
        },
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || '저장 실패')
  }, [notionItem])

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

  const renderItem = (t) => (
    <TodoItem
      key={t.id}
      item={t}
      onToggle={toggleTodo}
      onEdit={openEdit}
      onDelete={handleDelete}
      onNotion={setNotionItem}
    />
  )

  return (
    <>
      <aside className={`todo-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="todo-header">
          {!collapsed && <span className="todo-title">To Do 현황판</span>}
          {!collapsed && <button className="add-btn" onClick={() => openAdd()}>+ 업무지시</button>}
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

              {(filter === 'all' || filter === 'directive') && (
                <>
                  <div className="section-hd">
                    <span className="section-lbl">업무지시</span>
                    <button className="plus-btn" onClick={() => openAdd('directive')}>＋</button>
                  </div>
                  {filtered.filter(t => t.type === 'directive').map(renderItem)}
                </>
              )}

              {(filter === 'all' || filter === 'personal') && (
                <>
                  <div className="section-hd">
                    <span className="section-lbl">개별업무</span>
                    <button className="plus-btn" onClick={() => openAdd('personal')}>＋</button>
                  </div>
                  {filtered.filter(t => t.type === 'personal').map(renderItem)}
                </>
              )}

              {filter === 'done' && filtered.map(renderItem)}
            </div>
          </>
        )}
      </aside>

      {modalOpen && (
        <TodoModal
          open={modalOpen}
          defaultType={modalType}
          userDisplayName={userDisplayName}
          editItem={editingItem}
          onClose={() => { setModalOpen(false); setEditingItem(null) }}
          onAdd={addTodo}
          onEdit={editTodo}
        />
      )}

      {notionItem && (
        <NotionModal
          preview={`${notionItem.assignee ? notionItem.assignee + ': ' : ''}${notionItem.text}`}
          onClose={() => setNotionItem(null)}
          onSave={saveToNotion}
        />
      )}
    </>
  )
}
