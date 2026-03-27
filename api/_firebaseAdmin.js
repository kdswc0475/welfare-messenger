import admin from 'firebase-admin'

let app

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON 환경변수가 필요합니다.')
  }
  return JSON.parse(raw)
}

export function getAdminApp() {
  if (app) return app
  if (admin.apps.length > 0) {
    app = admin.app()
    return app
  }

  const serviceAccount = getServiceAccount()
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  return app
}
