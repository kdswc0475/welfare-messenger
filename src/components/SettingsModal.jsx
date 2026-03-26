import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './SettingsModal.css'

const PAGES = ['일반', '멤버 관리', 'AI 비서', '알림', '보안', '연동', '레이아웃']

function Toggle({ defaultOn = true }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button className={`toggle ${on ? 'on' : 'off'}`} onClick={() => setOn(v => !v)} />
  )
}

function GeneralPage({ workspaceName, setWorkspaceName }) {
  const [name, setName] = useState(workspaceName)
  return (
    <div>
      <div className="settings-title">일반 설정</div>
      <div className="setting-row">
        <div><div className="setting-label">워크스페이스 이름</div></div>
        <input className="setting-input" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">언어</div></div>
        <select className="setting-select"><option>한국어</option><option>English</option></select>
      </div>
      <div className="setting-row">
        <div><div className="setting-label">To Do 완료 알림</div><div className="setting-sub">완료 시 채널에 자동 메시지</div></div>
        <Toggle defaultOn={true} />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">마감 D-1 자동 알림</div></div>
        <Toggle defaultOn={true} />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">주간 보고서 자동 생성</div></div>
        <Toggle defaultOn={false} />
      </div>
      <button className="save-btn" onClick={() => setWorkspaceName(name)}>변경사항 저장</button>
    </div>
  )
}

function MembersPage() {
  const { user } = useAuth()
  return (
    <div>
      <div className="settings-title">멤버 관리</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        현재 로그인된 멤버
      </div>
      {user && (
        <div className="member-row">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar av-blue" style={{ width: 30, height: 30, fontSize: 12 }}>
              {user.displayName?.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13 }}>{user.displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          <select className="role-select" defaultValue="관리자">
            <option>관리자</option><option>멤버</option><option>게스트</option>
          </select>
        </div>
      )}
      <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)' }}>
        💡 팀원이 같은 URL로 접속하면 자동으로 멤버가 됩니다.
      </div>
    </div>
  )
}

function AIPage({ aiModel, setAiModel }) {
  return (
    <div>
      <div className="settings-title">AI 비서 설정</div>
      <div className="setting-row">
        <div><div className="setting-label">AI 모델</div><div className="setting-sub">기본 Gemini Flash (무료)</div></div>
        <select className="setting-select" value={aiModel} onChange={e => setAiModel(e.target.value)}>
          <optgroup label="Google">
            <option>Gemini Flash</option>
            <option>Gemini Pro</option>
          </optgroup>
          <optgroup label="OpenAI">
            <option>GPT-4o</option>
            <option>GPT-3.5</option>
          </optgroup>
          <optgroup label="Anthropic">
            <option>Claude Sonnet</option>
            <option>Claude Haiku</option>
          </optgroup>
        </select>
      </div>
      <div className="setting-row">
        <div><div className="setting-label">1인 일일 호출 제한</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input type="number" defaultValue={50} className="setting-input" style={{ width: 60 }} /> 회
        </div>
      </div>
      <div className="setting-row">
        <div><div className="setting-label">AI 비서 사용</div></div>
        <Toggle defaultOn={true} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="setting-sub" style={{ marginBottom: 6 }}>시스템 프롬프트</div>
        <textarea className="setting-textarea" defaultValue="당신은 복지팀의 AI 비서입니다. 사회복지 업무 맥락에 맞게 친절하고 정확하게 답변하세요." />
      </div>
      <button className="save-btn">저장</button>
    </div>
  )
}

function NotifyPage() {
  return (
    <div>
      <div className="settings-title">알림 설정</div>
      <div className="setting-row"><div><div className="setting-label">멘션 알림</div></div><Toggle defaultOn={true} /></div>
      <div className="setting-row"><div><div className="setting-label">일반 메시지 알림</div></div><Toggle defaultOn={false} /></div>
      <div className="setting-row"><div><div className="setting-label">집중 모드</div><div className="setting-sub">21:00 ~ 08:00 알림 차단</div></div><Toggle defaultOn={false} /></div>
      <button className="save-btn">저장</button>
    </div>
  )
}

function SecurityPage() {
  return (
    <div>
      <div className="settings-title">보안</div>
      <div className="setting-row"><div><div className="setting-label">세션 자동 만료</div><div className="setting-sub">비활성 30분 후 로그아웃</div></div><Toggle defaultOn={true} /></div>
      <div className="setting-row"><div><div className="setting-label">종단간 암호화</div></div><Toggle defaultOn={true} /></div>
      <div className="setting-row"><div><div className="setting-label">관리자 DM 열람 차단</div></div><Toggle defaultOn={true} /></div>
    </div>
  )
}

function IntegrationPage() {
  return (
    <div>
      <div className="settings-title">연동 설정</div>
      <div className="setting-row"><div><div className="setting-label">Google 스프레드시트</div><div className="setting-sub">To Do 완료 시 자동 기록</div></div><Toggle defaultOn={false} /></div>
      <div className="setting-row"><div><div className="setting-label">Google 캘린더</div></div><Toggle defaultOn={false} /></div>
      <div className="setting-row"><div><div className="setting-label">자동 백업</div><div className="setting-sub">매일 00:00</div></div><Toggle defaultOn={true} /></div>
      <button className="save-btn">저장</button>
    </div>
  )
}

function LayoutPage() {
  return (
    <div>
      <div className="settings-title">레이아웃 설정</div>
      <div className="setting-row">
        <div><div className="setting-label">사이드바 기본 너비</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input type="number" defaultValue={200} className="setting-input" style={{ width: 70 }} /> px
        </div>
      </div>
      <div className="setting-row">
        <div><div className="setting-label">To Do 패널 기본 너비</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input type="number" defaultValue={260} className="setting-input" style={{ width: 70 }} /> px
        </div>
      </div>
      <div className="setting-row"><div><div className="setting-label">레이아웃 자동 저장</div></div><Toggle defaultOn={true} /></div>
      <button className="save-btn">저장</button>
    </div>
  )
}

export default function SettingsModal({ workspaceName, setWorkspaceName, aiModel, setAiModel, onClose }) {
  const [page, setPage] = useState('일반')

  const PageContent = () => {
    switch (page) {
      case '일반':     return <GeneralPage workspaceName={workspaceName} setWorkspaceName={setWorkspaceName} />
      case '멤버 관리': return <MembersPage />
      case 'AI 비서':  return <AIPage aiModel={aiModel} setAiModel={setAiModel} />
      case '알림':     return <NotifyPage />
      case '보안':     return <SecurityPage />
      case '연동':     return <IntegrationPage />
      case '레이아웃': return <LayoutPage />
      default:         return null
    }
  }

  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-modal">
        <nav className="settings-nav">
          <div className="settings-nav-title">관리자 설정</div>
          {PAGES.map(p => (
            <button key={p} className={`nav-item ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="nav-close" onClick={onClose}>닫기</button>
        </nav>
        <div className="settings-content">
          <PageContent />
        </div>
      </div>
    </div>
  )
}
