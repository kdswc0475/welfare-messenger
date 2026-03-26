export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, data } = req.body
  const NOTION_API_KEY = process.env.NOTION_API_KEY
  const CHAT_DB_ID     = process.env.NOTION_CHAT_DB_ID
  const TODO_DB_ID     = process.env.NOTION_TODO_DB_ID

  if (!NOTION_API_KEY) return res.status(500).json({ error: 'Notion API 키가 설정되지 않았습니다' })

  const headers = {
    Authorization:    `Bearer ${NOTION_API_KEY}`,
    'Content-Type':   'application/json',
    'Notion-Version': '2022-06-28',
  }

  const createPage = (body) =>
    fetch('https://api.notion.com/v1/pages', { method: 'POST', headers, body: JSON.stringify(body) })

  try {
    // ── 채팅 메시지 → 채팅 요약 DB ──────────────────────────
    if (action === 'saveChat') {
      const { content, author, date, project } = data
      const title = `[${author}] ${(content || '').slice(0, 50)}${(content || '').length > 50 ? '…' : ''}`

      const r = await createPage({
        parent: { database_id: CHAT_DB_ID },
        properties: {
          '업무내용': { title:  [{ text: { content: title } }] },
          '날짜':     { date:   { start: date } },
          '사업명':   { select: { name: project } },
        },
        children: [{
          object: 'block', type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: content || '' } }] },
        }],
      })
      const result = await r.json()
      if (!r.ok) throw new Error(result.message || 'Notion 저장 실패')
      return res.status(200).json({ success: true, url: result.url })
    }

    // ── 할 일 → 할 일 캘린더 DB ──────────────────────────────
    if (action === 'saveTodo') {
      const { text, assignee, due, project } = data
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(due)

      const r = await createPage({
        parent: { database_id: TODO_DB_ID },
        properties: {
          '업무명':  { title:     [{ text: { content: text || '' } }] },
          '사업명':  { select:    { name: project } },
          '담당자':  { rich_text: [{ text: { content: assignee || '' } }] },
          ...(isValidDate ? { '날짜': { date: { start: due } } } : {}),
        },
      })
      const result = await r.json()
      if (!r.ok) throw new Error(result.message || 'Notion 저장 실패')
      return res.status(200).json({ success: true, url: result.url })
    }

    return res.status(400).json({ error: '지원하지 않는 action' })
  } catch (err) {
    console.error('Notion API 오류:', err)
    return res.status(500).json({ error: err.message })
  }
}
