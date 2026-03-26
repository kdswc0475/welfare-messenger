import React from 'react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const { signInWithGoogle, error } = useAuth()

  return (
    <div className="login-page">
      <div className="login-card">
        {/* 로고 */}
        <div className="login-logo">
          <span className="login-logo-icon">💬</span>
        </div>

        {/* 헤더 */}
        <div className="login-header">
          <h1 className="login-title">복지팀 메신저</h1>
          <p className="login-subtitle">팀원들과 소통하고, 업무를 관리하세요</p>
        </div>

        {/* 구분선 */}
        <div className="login-divider" />

        {/* 구글 로그인 버튼 */}
        <button className="google-btn" onClick={signInWithGoogle}>
          <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google 계정으로 로그인
        </button>

        {/* 에러 메시지 */}
        {error && <div className="login-error">{error}</div>}

        {/* 안내 문구 */}
        <p className="login-notice">
          조직의 Google 계정(@welfare.kr)으로 로그인하세요.<br />
          승인된 계정만 접근할 수 있습니다.
        </p>
      </div>

      {/* 하단 */}
      <p className="login-footer">복지팀 내부 시스템 · 무단 접근 금지</p>
    </div>
  )
}
