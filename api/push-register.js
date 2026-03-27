import admin from 'firebase-admin'
import { getAdminApp } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { uid, token } = req.body || {}
  if (!uid || !token) return res.status(400).json({ error: 'uid와 token이 필요합니다' })

  try {
    const app = getAdminApp()
    const db = admin.firestore(app)
    const userRef = db.collection('users').doc(String(uid))
    const snap = await userRef.get()
    const prev = snap.exists ? (snap.data()?.fcmTokens || []) : []
    const next = Array.isArray(prev) ? [...new Set([...prev, token])] : [token]

    await userRef.set(
      {
        uid: String(uid),
        fcmTokens: next,
        pushEnabled: true,
        lastPushTokenAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return res.status(200).json({ ok: true, tokenCount: next.length })
  } catch (err) {
    console.error('push-register API 오류:', err)
    return res.status(500).json({ error: err.message || 'push token 등록 실패' })
  }
}
