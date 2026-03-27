import admin from 'firebase-admin'
import { getAdminApp } from './_firebaseAdmin.js'

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size))
  return chunks
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { senderUid, author, text, fileName } = req.body || {}
  if (!senderUid) return res.status(400).json({ error: 'senderUid가 필요합니다' })

  try {
    const app = getAdminApp()
    const db = admin.firestore(app)

    const usersSnap = await db.collection('users').get()
    const tokens = usersSnap.docs
      .flatMap((d) => {
        const data = d.data() || {}
        if (d.id === senderUid) return []
        if (!Array.isArray(data.fcmTokens)) return []
        return data.fcmTokens.filter((t) => typeof t === 'string' && t.length > 0)
      })

    const uniqueTokens = [...new Set(tokens)]
    if (uniqueTokens.length === 0) return res.status(200).json({ ok: true, sent: 0 })

    const notifBody = (text && String(text).trim().slice(0, 120))
      || (fileName ? `📎 ${fileName}` : '새 메시지가 도착했습니다.')

    const tokenChunks = chunk(uniqueTokens, 500)
    let sent = 0
    let failure = 0

    for (const tokenChunk of tokenChunks) {
      const response = await admin.messaging(app).sendEachForMulticast({
        tokens: tokenChunk,
        notification: {
          title: author || '복지 메신저',
          body: notifBody,
        },
        data: {
          click_action: '/',
          senderUid: String(senderUid),
        },
        webpush: {
          fcmOptions: { link: '/' },
          notification: {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          },
        },
      })

      sent += response.successCount
      failure += response.failureCount
    }

    return res.status(200).json({ ok: true, sent, failure })
  } catch (err) {
    console.error('push API 오류:', err)
    return res.status(500).json({ error: err.message || '푸시 발송 실패' })
  }
}
