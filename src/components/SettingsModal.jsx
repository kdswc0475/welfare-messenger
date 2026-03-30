import React, { useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext.jsx'
import { db } from '../firebase.js'
import './SettingsModal.css'

const PAGES = ['일반', '멤버 관리', 'AI 비서', '알림', '보안', '연동', '레이아웃']

function Toggle({ on = true, onToggle }) {
  return (
    <button className={`toggle ${on ? 'on' : 'off'}`} onClick={() => onToggle?.(!on)} />
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
        <Toggle on={true} />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">마감 D-1 자동 알림</div></div>
        <Toggle on={true} />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">주간 보고서 자동 생성</div></div>
        <Toggle on={false} />
      </div>
      <button className="save-btn" onClick={() => setWorkspaceName(name)}>변경사항 저장</button>
    </div>
  )
}

function MembersPage() {
  const { user, updateMemberProfile } = useAuth()
  const [name, setName] = useState(user?.displayName || '')
  const [photo, setPhoto] = useState(user?.photoURL || '')
  const [saving, setSaving] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const [members, setMembers] = useState([])

  React.useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setMembers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [])

  const onSaveProfile = async () => {
    setResultMsg('')
    setSaving(true)
    try {
      await updateMemberProfile({ displayName: name, photoURL: photo })
      setResultMsg('프로필이 저장되었습니다.')
    } catch (e) {
      setResultMsg(e?.message || '프로필 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="settings-title">멤버 관리</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        현재 등록된 멤버
      </div>
      {members.map(m => (
        <div className="member-row" key={m.uid}>
          {m.photoURL ? (
            <img
              src={m.photoURL}
              alt={m.displayName}
              referrerPolicy="no-referrer"
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar av-blue" style={{ width: 30, height: 30, fontSize: 12 }}>
              {m.displayName?.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13 }}>
              {m.displayName}
              {m.uid === user?.uid ? <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>(나)</span> : null}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email}</div>
          </div>
          <select className="role-select" defaultValue={m.uid === user?.uid ? '관리자' : '멤버'}>
            <option>관리자</option><option>멤버</option><option>게스트</option>
          </select>
        </div>
      ))}
      <div className="setting-row">
        <div><div className="setting-label">닉네임</div></div>
        <input
          className="setting-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="닉네임 입력"
        />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">사진 URL</div><div className="setting-sub">비우면 기본 아바타 사용</div></div>
        <input
          className="setting-input"
          style={{ width: 220 }}
          value={photo}
          onChange={e => setPhoto(e.target.value)}
          placeholder="https://example.com/profile.jpg"
        />
      </div>
      <button className="save-btn" onClick={onSaveProfile} disabled={saving}>
        {saving ? '저장 중...' : '프로필 저장'}
      </button>
      {resultMsg && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          {resultMsg}
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
        <div><div className="setting-label">AI 모델</div><div className="setting-sub">기본 Llama 3.3 (무료 · Groq)</div></div>
        <select className="setting-select" value={aiModel} onChange={e => setAiModel(e.target.value)}>
          <optgroup label="✅ 무료 (Groq)">
            <option>Llama 3.3 (무료)</option>
            <option>Mixtral (무료)</option>
          </optgroup>
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

function NotifyPage({ notifySettings, setNotifySettings, pushStatus }) {
  const [permission, setPermission] = React.useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  const update = (key, value) => setNotifySettings(prev => ({ ...prev, [key]: value }))

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      new Notification('복지 메신저', {
        body: '알림이 활성화되었습니다.',
        icon: '/icon-192.png',
      })
    }
  }

  const permissionLabel = { granted: '허용됨', denied: '차단됨', default: '미설정', unsupported: '미지원' }
  const permissionColor = { granted: '#16a34a', denied: '#dc2626', default: '#d97706', unsupported: '#6b7280' }

  return (
    <div>
      <div className="settings-title">알림 설정</div>

      {/* 브라우저 알림 권한 상태 */}
      <div className="setting-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
        <div className="setting-label">브라우저 알림 권한</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: permissionColor[permission] || '#6b7280',
            background: `${permissionColor[permission]}18`,
            padding: '2px 8px', borderRadius: 4,
          }}>
            {permissionLabel[permission] || permission}
          </span>
          {permission !== 'granted' && permission !== 'denied' && permission !== 'unsupported' && (
            <button className="save-btn" style={{ margin: 0, padding: '4px 12px', fontSize: 12 }} onClick={requestPermission}>
              권한 요청
            </button>
          )}
          {permission === 'denied' && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              브라우저 설정에서 직접 허용해야 합니다
            </span>
          )}
          {permission === 'default' && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              권한을 허용해야 알림을 받을 수 있습니다
            </span>
          )}
        </div>
      </div>

      <div className="setting-row">
        <div><div className="setting-label">멘션 알림</div><div className="setting-sub">@이름 멘션 시 알림</div></div>
        <Toggle on={notifySettings.mention} onToggle={v => update('mention', v)} />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">일반 메시지 알림</div><div className="setting-sub">모든 새 메시지 알림</div></div>
        <Toggle on={notifySettings.general} onToggle={v => update('general', v)} />
      </div>
      <div className="setting-row">
        <div><div className="setting-label">집중 모드</div><div className="setting-sub">21:00 ~ 08:00 알림 차단</div></div>
        <Toggle on={notifySettings.focusMode} onToggle={v => update('focusMode', v)} />
      </div>
      <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-muted)' }}>
        알림 설정은 자동 저장됩니다. 브라우저가 닫혀 있을 때도 알림을 받으려면 권한이 허용되어 있어야 합니다.
      </div>
      <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--panel-bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 500 }}>푸시 연결 상태</div>
        <div style={{ color: 'var(--text-secondary)' }}>
          {pushStatus?.supported === false ? '브라우저 미지원' : (pushStatus?.tokenRegistered ? '정상 연결됨' : '토큰 미등록')}
          {pushStatus?.lastError ? ` · ${pushStatus.lastError}` : ''}
        </div>
      </div>
    </div>
  )
}

function SecurityPage() {
  return (
    <div>
      <div className="settings-title">보안</div>
      <div className="setting-row"><div><div className="setting-label">세션 자동 만료</div><div className="setting-sub">비활성 30분 후 로그아웃</div></div><Toggle on={true} /></div>
      <div className="setting-row"><div><div className="setting-label">종단간 암호화</div></div><Toggle on={true} /></div>
      <div className="setting-row"><div><div className="setting-label">관리자 DM 열람 차단</div></div><Toggle on={true} /></div>
    </div>
  )
}

function IntegrationPage() {
  return (
    <div>
      <div className="settings-title">연동 설정</div>
      <div className="setting-row"><div><div className="setting-label">Google 스프레드시트</div><div className="setting-sub">To Do 완료 시 자동 기록</div></div><Toggle on={false} /></div>
      <div className="setting-row"><div><div className="setting-label">Google 캘린더</div></div><Toggle on={false} /></div>
      <div className="setting-row"><div><div className="setting-label">자동 백업</div><div className="setting-sub">매일 00:00</div></div><Toggle on={true} /></div>
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
      <div className="setting-row"><div><div className="setting-label">레이아웃 자동 저장</div></div><Toggle on={true} /></div>
      <button className="save-btn">저장</button>
    </div>
  )
}

export default function SettingsModal({ workspaceName, setWorkspaceName, aiModel, setAiModel, notifySettings, setNotifySettings, pushStatus, onClose }) {
  const [page, setPage] = useState('일반')

  const PageContent = () => {
    switch (page) {
      case '일반':     return <GeneralPage workspaceName={workspaceName} setWorkspaceName={setWorkspaceName} />
      case '멤버 관리': return <MembersPage />
      case 'AI 비서':  return <AIPage aiModel={aiModel} setAiModel={setAiModel} />
      case '알림':     return <NotifyPage notifySettings={notifySettings} setNotifySettings={setNotifySettings} pushStatus={pushStatus} />
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
