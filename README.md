# 복지팀 메신저

사회복지팀을 위한 전용 메신저 + To Do 현황판 + AI 비서 통합 시스템

## 기능
- 💬 실시간 채팅 (공지사항 채널)
- ✅ To Do 현황판 (업무지시 / 개별업무 / 진척률)
- 🤖 AI 비서 (@AI비서 멘션으로 호출)
- ⚙ 관리자 설정 (팀명, 멤버, AI 모델, 알림, 보안, 연동)
- 📱 PC + 모바일 반응형

---

## 로컬 실행

### 1. 준비물
- [Node.js 18 이상](https://nodejs.org) 설치 필요

### 2. 의존성 설치
```bash
npm install
```

### 2-1. 푸시 알림 환경변수 (FCM)
- 프론트엔드(`.env`)
```bash
VITE_FIREBASE_VAPID_KEY=YOUR_FIREBASE_WEB_PUSH_CERTIFICATE_KEY_PAIR
```
- 서버 배포 환경(Vercel Project Settings → Environment Variables)
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```
`FIREBASE_SERVICE_ACCOUNT_JSON`에는 Firebase 서비스 계정 JSON 전체를 1줄 문자열로 넣어야 합니다.

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 http://localhost:5173 접속

### 4. 빌드 (배포용)
```bash
npm run build
```
`dist/` 폴더가 생성됩니다.

---

## GitHub Pages 무료 배포 방법

### 1단계 — GitHub 저장소 생성
1. https://github.com 로그인
2. 우상단 `+` → `New repository`
3. Repository name: `welfare-messenger`
4. Public 선택 → `Create repository`

### 2단계 — 코드 업로드
```bash
git init
git add .
git commit -m "첫 배포"
git branch -M main
git remote add origin https://github.com/[내아이디]/welfare-messenger.git
git push -u origin main
```

### 3단계 — GitHub Pages 활성화
1. 저장소 → `Settings` 탭
2. 왼쪽 메뉴 `Pages` 클릭
3. Source: `GitHub Actions` 선택
4. 저장

### 4단계 — 자동 배포 확인
- `Actions` 탭에서 배포 진행 상황 확인
- 완료 후 접속 주소: `https://[내아이디].github.io/welfare-messenger`

---

## 다른 무료 배포 옵션

| 서비스 | 주소 | 특징 |
|--------|------|------|
| **GitHub Pages** | github.io | 완전 무료, GitHub 연동 |
| **Vercel** | vercel.app | 가장 빠름, CLI 1줄 배포 |
| **Netlify** | netlify.app | 드래그앤드롭 배포 가능 |
| **Cloudflare Pages** | pages.dev | 글로벌 CDN, 무료 |

---

## 기술 스택
- React 18 + Vite
- 순수 CSS (외부 UI 라이브러리 없음)
- 모바일 반응형

## 향후 확장
- [ ] 백엔드 연동 (Node.js + Socket.io)
- [ ] 실제 AI API 연결 (Gemini / Claude)
- [ ] 로그인 / 인증
- [ ] Google 스프레드시트 연동
- [ ] 파일 첨부 (AWS S3)
