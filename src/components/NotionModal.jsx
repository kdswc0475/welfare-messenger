import React, { useState } from 'react'
import './NotionModal.css'

const PROJECTS = ['서울밥상', '노인일자리']

export default function NotionModal({ preview, onClose, onSave }) {
  const [project, setProject] = useState(PROJECTS[0])
  const [status, setStatus]   = useState('idle') // idle | loading | success | error

  const handleSave = async () => {
    setStatus('loading')
    try {
      await onSave(project)
      setStatus('success')
      setTimeout(onClose, 1600)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="nm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nm-box">
        <button className="nm-close" onClick={onClose}>✕</button>
        <div className="nm-title">
          <span className="nm-icon">N</span>
          노션에 저장
        </div>

        {preview && <div className="nm-preview">{preview}</div>}

        {status === 'success' && <div className="nm-status success">✅ 노션에 저장됐습니다!</div>}
        {status === 'error'   && <div className="nm-status error">❌ 저장 실패. 다시 시도해주세요.</div>}

        {(status === 'idle' || status === 'loading') && (
          <>
            <div className="nm-group">
              <label className="nm-label">사업명</label>
              <select
                className="nm-select"
                value={project}
                onChange={e => setProject(e.target.value)}
                disabled={status === 'loading'}
              >
                {PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="nm-actions">
              <button className="nm-btn nm-cancel" onClick={onClose}>취소</button>
              <button className="nm-btn nm-save" onClick={handleSave} disabled={status === 'loading'}>
                {status === 'loading' ? '저장 중…' : '저장'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
